import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScoringService } from './scoring.service';
import { LeaderboardGateway } from '../leaderboard.gateway';

@Injectable()
export class MatchService {
    constructor(
        private prisma: PrismaService,
        private scoringService: ScoringService,
        private leaderboardGateway: LeaderboardGateway
    ) { }

    async submitMatchResults(matchId: string, results: { teamId: string; placement: number; kills: number }[]) {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
            include: { tournament: true }
        });

        if (!match) throw new NotFoundException('Match not found');

        const scoringRules = match.tournament.scoringEngine
            ? JSON.parse(match.tournament.scoringEngine)
            : { "1": 10, "kill": 1 };

        // Transaction to update match and participations
        await this.prisma.$transaction(async (tx) => {
            // 1. Update Match Status
            await tx.match.update({
                where: { id: matchId },
                data: { status: 'COMPLETED' }
            });

            // 2. Insert Participations
            for (const res of results) {
                const score = this.scoringService.calculateScore(res.placement, res.kills, scoringRules);

                await tx.matchParticipation.upsert({
                    where: { matchId_teamId: { matchId, teamId: res.teamId } },
                    create: {
                        matchId,
                        teamId: res.teamId,
                        placement: res.placement,
                        kills: res.kills,
                        score
                    },
                    update: {
                        placement: res.placement,
                        kills: res.kills,
                        score
                    }
                });

                // 3. Update Cached Leaderboard
                const lbEntry = await tx.tournamentLeaderboard.findUnique({
                    where: { tournamentId_teamId: { tournamentId: match.tournamentId, teamId: res.teamId } }
                });

                if (lbEntry) {
                    await tx.tournamentLeaderboard.update({
                        where: { id: lbEntry.id },
                        data: {
                            totalPoints: { increment: score },
                            totalKills: { increment: res.kills },
                            matchesPlayed: { increment: 1 }
                        }
                    });
                } else {
                    await tx.tournamentLeaderboard.create({
                        data: {
                            tournamentId: match.tournamentId,
                            teamId: res.teamId,
                            totalPoints: score,
                            totalKills: res.kills,
                            matchesPlayed: 1
                        }
                    });
                }
            }
        });

        // 4. Trigger Real-time Update
        this.leaderboardGateway.updateLeaderboard(match.tournamentId);

        return { success: true, matchId };
    }
}
