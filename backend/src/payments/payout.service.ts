import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  /**
   * Distribute prizes for a completed tournament
   */
  async distributePrizes(tournamentId: string) {
    this.logger.log(
      `Starting prize distribution for tournament: ${tournamentId}`,
    );

    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament || tournament.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Tournament must be completed to distribute prizes',
      );
    }

    if (!tournament.prizeDistribution) {
      this.logger.warn(
        `No prize distribution rules for tournament ${tournamentId}`,
      );
      return;
    }

    // Parse distribution rules: e.g., [{"rank": 1, "percent": 50}, {"rank": 2, "percent": 30}]
    const rules = JSON.parse(tournament.prizeDistribution);
    const prizePool = tournament.prizePool;

    // Get Leaderboard
    const leaderboard = await this.prisma.tournamentLeaderboard.findMany({
      where: { tournamentId },
      orderBy: { totalPoints: 'desc' },
      include: { team: { include: { members: true } } },
    });

    // Process Payouts
    for (const rule of rules) {
      const entry = leaderboard[rule.rank - 1]; // rank is 1-based
      if (!entry) continue;

      const amount = (prizePool * rule.percent) / 100;
      const team = entry.team;

      // Split among team members (simple equal split for now)
      // Real-world: Captain might get it, or customizable splits
      const splitAmount = amount / team.members.length;

      for (const member of team.members) {
        try {
          await this.walletService.creditWinnings(
            member.userId,
            splitAmount,
            tournament.title,
          );
          this.logger.log(
            `Credited ${splitAmount} to ${member.userId} for rank ${rule.rank}`,
          );
        } catch (e) {
          this.logger.error(`Failed to credit ${member.userId}: ${e.message}`);
        }
      }
    }

    this.logger.log(`Prize distribution completed for ${tournamentId}`);
    return { success: true };
  }
}
