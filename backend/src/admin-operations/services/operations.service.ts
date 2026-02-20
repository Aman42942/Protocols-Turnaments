import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FraudService } from '../../payments/fraud.service';
import { WalletService } from '../../wallet/wallet.service';
import { OperationsGateway } from '../gateways/operations.gateway';

@Injectable()
export class OperationsService {
    private readonly logger = new Logger(OperationsService.name);

    constructor(
        private prisma: PrismaService,
        private fraudService: FraudService,
        private walletService: WalletService,
        private gateway: OperationsGateway
    ) { }

    /**
     * Get Operations Dashboard Stats
     */
    async getDashboardStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeTournaments = await this.prisma.tournament.count({ where: { status: 'LIVE' } });
        const pendingDisputes = await this.prisma.transaction.count({ where: { status: 'DISPUTED' } }); // Assuming DISPUTED status exists or logic

        // Revenue Today
        const revenueAgg = await this.prisma.transaction.aggregate({
            where: { createdAt: { gte: today }, type: { in: ['ENTRY_FEE', 'DEPOSIT'] }, status: 'COMPLETED' },
            _sum: { amount: true }
        });

        const flaggedUsersCount = await this.prisma.user.count({ where: { banned: true } });
        // Ideally check recent flags from FraudService logs if persisted

        return {
            activeTournaments,
            pendingDisputes,
            revenueToday: revenueAgg._sum.amount || 0,
            flaggedUsersCount
        };
    }

    /**
     * Get Live Matches for Monitoring
     */
    async getLiveMatches() {
        return this.prisma.match.findMany({
            where: { status: 'LIVE' },
            include: {
                tournament: { select: { title: true, game: true } },
                participations: { include: { team: { select: { name: true } } } }
            },
            orderBy: { startTime: 'desc' }
        });
    }

    /**
     * Override Match Score (Admin Intervention)
     */
    async overrideMatchScore(matchId: string, teamId: string, placement: number, kills: number, adminId: string) {
        const match = await this.prisma.match.findUnique({ where: { id: matchId } });
        if (!match) throw new NotFoundException('Match not found');

        // Update participation
        await this.prisma.matchParticipation.update({
            where: { matchId_teamId: { matchId, teamId } },
            data: { placement, kills }
        });

        // Log the override
        await this.prisma.activityLog.create({
            data: {
                adminId,
                action: 'OVERRIDE_SCORE',
                targetId: matchId,
                details: JSON.stringify({ teamId, placement, kills, reason: 'Admin Override' })
            }
        });

        this.gateway.sendLiveMatchUpdate({ matchId, type: 'SCORE_OVERRIDE', details: { teamId, placement } });

        // Logic to trigger leaderboard update would typically go here
        // e.g. await this.leaderboardService.updateLeaderboard(match.tournamentId);

        return { success: true, message: 'Score updated successfully' };
    }

    /**
     * Trigger Manual Payout
     */
    async triggerManualPayout(tournamentId: string, adminId: string) {
        // Logic calls PayoutService
        // For now just locking the action logging
        await this.prisma.activityLog.create({
            data: {
                adminId,
                action: 'TRIGGER_PAYOUT',
                targetId: tournamentId,
                details: JSON.stringify({ manual: true })
            }
        });
        return { success: true, message: 'Payout triggered (simulation)' };
    }
}
