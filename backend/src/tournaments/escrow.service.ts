import {
    Injectable,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EscrowService {
    private readonly PLATFORM_FEE_PERCENT: number;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
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

        if (!pool) throw new BadRequestException('No escrow pool found for this tournament');
        if (pool.status !== 'OPEN')
            throw new ForbiddenException(`Pool is already ${pool.status}`);

        const platformFee = parseFloat(
            ((pool.totalCollected * this.PLATFORM_FEE_PERCENT) / 100).toFixed(2),
        );
        const netPrizePool = parseFloat((pool.totalCollected - platformFee).toFixed(2));

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
                include: { leaderboard: { orderBy: { rank: 'asc' }, take: 10 } },
            }),
        ]);

        if (!pool) throw new BadRequestException('No escrow pool found');
        if (pool.status !== 'LOCKED')
            throw new ForbiddenException('Pool must be LOCKED before distribution');
        if (!tournament) throw new BadRequestException('Tournament not found');

        // Parse prizeDistribution: [{place: "1st", percent: 50}, {place: "2nd", percent: 30}, ...]
        let distribution: Array<{ place: string; percent: number }> = [];
        if (tournament.prizeDistribution) {
            try {
                distribution = JSON.parse(tournament.prizeDistribution);
            } catch {
                throw new BadRequestException('Invalid prizeDistribution JSON on tournament');
            }
        }

        if (distribution.length === 0) {
            // Default: winner takes all
            distribution = [{ place: '1st', percent: 100 }];
        }

        const leaderboard = tournament.leaderboard;
        if (leaderboard.length === 0) {
            throw new BadRequestException('No leaderboard entries — cannot distribute');
        }

        // Build payout operations
        const payoutOps: any[] = [];
        const payoutLog: any[] = [];

        for (let i = 0; i < distribution.length; i++) {
            const entry = leaderboard[i];
            if (!entry) continue;

            const prizeAmount = parseFloat(
                ((pool.netPrizePool * distribution[i].percent) / 100).toFixed(2),
            );

            const team = await this.prisma.team.findUnique({
                where: { id: entry.teamId },
                include: { members: { select: { userId: true } } },
            });

            if (!team) continue;

            // For squad games: split prize evenly among team members
            const memberCount = team.members.length;
            const perMemberAmount = parseFloat((prizeAmount / memberCount).toFixed(2));

            for (const member of team.members) {
                const wallet = await this.prisma.wallet.findUnique({
                    where: { userId: member.userId },
                });
                if (!wallet) continue;

                payoutOps.push(
                    this.prisma.wallet.update({
                        where: { id: wallet.id },
                        data: { balance: { increment: perMemberAmount } },
                    }),
                );

                payoutOps.push(
                    this.prisma.transaction.create({
                        data: {
                            walletId: wallet.id,
                            type: 'WINNINGS',
                            amount: perMemberAmount,
                            status: 'COMPLETED',
                            description: `${distribution[i].place} place prize from "${tournament.title}"`,
                            metadata: JSON.stringify({ tournamentId, teamId: entry.teamId }),
                        },
                    }),
                );

                payoutLog.push({ userId: member.userId, amount: perMemberAmount, place: distribution[i].place });
            }
        }

        // Mark escrow as distributed + audit log — all in one transaction
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
                        netPrizePool: pool.netPrizePool,
                        platformFee: pool.platformFeeRaw,
                        payouts: payoutLog,
                    }),
                },
            }),
        );

        await this.prisma.$transaction(payoutOps);

        return {
            message: 'Prizes distributed successfully',
            totalDistributed: pool.netPrizePool,
            platformFee: pool.platformFeeRaw,
            payouts: payoutLog,
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
            throw new ForbiddenException('Prizes already distributed — cannot refund');

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
