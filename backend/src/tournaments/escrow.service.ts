import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  ComplianceService,
  ComplianceEvent,
} from '../organizer/compliance.service';

@Injectable()
export class EscrowService {
  private readonly PLATFORM_FEE_PERCENT: number;
  private readonly TDS_THRESHOLD = 10000;
  private readonly TDS_RATE = 0.3; // 30% TDS for online gaming winnings

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly compliance: ComplianceService,
  ) {
    // Default 10% platform fee — configurable via SystemConfig or env
    this.PLATFORM_FEE_PERCENT = parseFloat(
      this.config.get<string>('PLATFORM_FEE_PERCENT') || '10',
    );
  }

  /**
   * Create or initialize the escrow pool for a tournament.
   * Called when tournament goes from DRAFT → OPEN.
   */
  async initializePool(tournamentId: string) {
    const existing = await this.prisma.escrowPool.findUnique({
      where: { tournamentId },
    });
    if (existing) return existing;

    return this.prisma.escrowPool.create({
      data: { tournamentId },
    });
  }

  /**
   * Credit entry fee into the escrow pool when a player registers.
   * This is called AFTER the wallet deduction succeeds.
   */
  async creditEntryFee(tournamentId: string, amount: number) {
    await this.prisma.escrowPool.upsert({
      where: { tournamentId },
      create: {
        tournamentId,
        totalCollected: amount,
        netPrizePool: amount,
      },
      update: {
        totalCollected: { increment: amount },
        netPrizePool: { increment: amount },
      },
    });
  }

  /**
   * Lock the escrow pool when tournament goes LIVE.
   * Calculates and reserves platform fee.
   */
  async lockPool(tournamentId: string, adminId: string) {
    const pool = await this.prisma.escrowPool.findUnique({
      where: { tournamentId },
    });

    if (!pool)
      throw new BadRequestException('No escrow pool found for this tournament');
    if (pool.status !== 'OPEN')
      throw new ForbiddenException(`Pool is already ${pool.status}`);

    const platformFee = parseFloat(
      ((pool.totalCollected * this.PLATFORM_FEE_PERCENT) / 100).toFixed(2),
    );
    const netPrizePool = parseFloat(
      (pool.totalCollected - platformFee).toFixed(2),
    );

    const [updated] = await this.prisma.$transaction([
      this.prisma.escrowPool.update({
        where: { tournamentId },
        data: {
          platformFeeRaw: platformFee,
          netPrizePool,
          status: 'LOCKED',
        },
      }),
      this.prisma.activityLog.create({
        data: {
          adminId,
          action: 'ESCROW_LOCKED',
          targetId: tournamentId,
          details: JSON.stringify({
            totalCollected: pool.totalCollected,
            platformFee,
            netPrizePool,
            feePercent: this.PLATFORM_FEE_PERCENT,
          }),
        },
      }),
    ]);

    return updated;
  }

  /**
   * Distribute prizes after tournament completes.
   * Reads prizeDistribution from Tournament, calculates amounts from netPrizePool,
   * and credits each winner's wallet atomically.
   */
  async distributePool(tournamentId: string, adminId: string) {
    const [pool, tournament] = await Promise.all([
      this.prisma.escrowPool.findUnique({ where: { tournamentId } }),
      this.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { leaderboard: { orderBy: { rank: 'asc' }, take: 20 } },
      }),
    ]);

    if (!pool) throw new BadRequestException('No escrow pool found');
    if (pool.status !== 'LOCKED')
      throw new ForbiddenException('Pool must be LOCKED before distribution');
    if (!tournament) throw new BadRequestException('Tournament not found');

    let distribution: Array<{ place: string; percent: number }> = [];
    if (tournament.prizeDistribution) {
      try {
        distribution = JSON.parse(tournament.prizeDistribution);
      } catch {
        throw new BadRequestException('Invalid prizeDistribution JSON');
      }
    }
    if (distribution.length === 0)
      distribution = [{ place: '1st', percent: 100 }];

    const leaderboard = tournament.leaderboard;
    if (leaderboard.length === 0)
      throw new BadRequestException('No leaderboard entries');

    const payoutOps: any[] = [];
    const payoutLog: any[] = [];
    const tdsLogs: any[] = [];

    for (let i = 0; i < distribution.length; i++) {
      const entry = leaderboard[i];
      if (!entry) continue;

      // Prize for the entire team
      const teamPrizeTotal =
        Math.floor(pool.netPrizePool * (distribution[i].percent / 100) * 100) /
        100;

      const team = await this.prisma.team.findUnique({
        where: { id: entry.teamId },
        include: { members: { select: { userId: true } } },
      });
      if (!team) continue;

      const memberCount = team.members.length;
      const perMemberGross =
        Math.floor((teamPrizeTotal / memberCount) * 100) / 100;
      const remainder =
        Math.round((teamPrizeTotal - perMemberGross * memberCount) * 100) / 100;

      for (let mIdx = 0; mIdx < team.members.length; mIdx++) {
        const member = team.members[mIdx];
        let grossAmount = perMemberGross;
        if (mIdx === 0) grossAmount += remainder; // Add remainder to the first member (usually leader)

        let tdsAmount = 0;
        if (grossAmount > this.TDS_THRESHOLD) {
          tdsAmount = Math.round(grossAmount * this.TDS_RATE * 100) / 100;
        }
        const netAmount = Math.round((grossAmount - tdsAmount) * 100) / 100;

        payoutOps.push(
          this.prisma.wallet.update({
            where: { userId: member.userId },
            data: { balance: { increment: netAmount } },
          }),
        );

        payoutOps.push(
          this.prisma.transaction.create({
            data: {
              walletId:
                (
                  await this.prisma.wallet.findUnique({
                    where: { userId: member.userId },
                  })
                )?.id || '',
              type: 'WINNINGS',
              amount: netAmount,
              status: 'COMPLETED',
              description: `${distribution[i].place} place prize (Gross: ₹${grossAmount}, TDS: ₹${tdsAmount})`,
              metadata: JSON.stringify({
                tournamentId,
                teamId: entry.teamId,
                tds: tdsAmount,
                gross: grossAmount,
              }),
            },
          }),
        );

        payoutLog.push({
          userId: member.userId,
          gross: grossAmount,
          tds: tdsAmount,
          net: netAmount,
          place: distribution[i].place,
        });

        if (tdsAmount > 0) {
          tdsLogs.push({
            userId: member.userId,
            amount: tdsAmount,
            reason: 'WINNINGS_TDS',
          });
        }
      }
    }

    payoutOps.push(
      this.prisma.escrowPool.update({
        where: { tournamentId },
        data: { status: 'DISTRIBUTED', distributedAt: new Date() },
      }),
    );

    payoutOps.push(
      this.prisma.activityLog.create({
        data: {
          adminId,
          action: 'PRIZES_DISTRIBUTED',
          targetId: tournamentId,
          details: JSON.stringify({
            payouts: payoutLog,
            tdsCollected: tdsLogs.length,
          }),
        },
      }),
    );

    await this.prisma.$transaction(payoutOps);

    // Record compliance logs for payouts and TDS
    await this.compliance.log({
      organizerId: tournament.organizerId || 'SYSTEM',
      tournamentId,
      event: ComplianceEvent.PRIZE_DISTRIBUTED,
      details: {
        winners: payoutLog,
        tdsTotal: tdsLogs.reduce((s, l) => s + l.amount, 0),
      },
      performedBy: adminId,
    });

    return {
      success: true,
      totalPrizes: pool.netPrizePool,
      payouts: payoutLog.length,
    };
  }

  /**
   * Refund all entry fees for a cancelled tournament.
   */
  async refundPool(tournamentId: string, adminId: string) {
    const pool = await this.prisma.escrowPool.findUnique({
      where: { tournamentId },
    });

    if (!pool) return { message: 'No escrow pool — nothing to refund' };
    if (pool.status === 'DISTRIBUTED')
      throw new ForbiddenException(
        'Prizes already distributed — cannot refund',
      );

    const participants = await this.prisma.tournamentParticipant.findMany({
      where: { tournamentId, paymentStatus: 'PAID' },
    });

    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) throw new BadRequestException('Tournament not found');
    const entryFee = tournament.entryFeePerPerson;

    const refundOps: any[] = [];

    for (const participant of participants) {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId: participant.userId },
      });
      if (!wallet) continue;

      refundOps.push(
        this.prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: entryFee } },
        }),
      );

      refundOps.push(
        this.prisma.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'REFUND',
            amount: entryFee,
            status: 'COMPLETED',
            description: `Refund: "${tournament.title}" was cancelled`,
            metadata: JSON.stringify({ tournamentId }),
          },
        }),
      );

      refundOps.push(
        this.prisma.tournamentParticipant.update({
          where: { id: participant.id },
          data: { paymentStatus: 'REFUNDED' },
        }),
      );
    }

    refundOps.push(
      this.prisma.escrowPool.update({
        where: { tournamentId },
        data: { status: 'DISTRIBUTED', distributedAt: new Date() },
      }),
    );

    refundOps.push(
      this.prisma.activityLog.create({
        data: {
          adminId,
          action: 'ESCROW_REFUNDED',
          targetId: tournamentId,
          details: JSON.stringify({
            refundedParticipants: participants.length,
            totalRefunded: entryFee * participants.length,
          }),
        },
      }),
    );

    await this.prisma.$transaction(refundOps);

    return {
      message: `Refunded ${participants.length} participants`,
      totalRefunded: entryFee * participants.length,
    };
  }

  async getPool(tournamentId: string) {
    return this.prisma.escrowPool.findUnique({ where: { tournamentId } });
  }
}
