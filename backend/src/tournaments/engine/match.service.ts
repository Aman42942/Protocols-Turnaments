import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScoringService } from './scoring.service';
import { LeaderboardGateway } from '../leaderboard.gateway';
import { LeaderboardCacheService } from '../../redis/leaderboard-cache.service';

@Injectable()
export class MatchService {
  constructor(
    private prisma: PrismaService,
    private scoringService: ScoringService,
    private leaderboardGateway: LeaderboardGateway,
    private leaderboardCache: LeaderboardCacheService,
  ) {}

  async submitMatchResults(
    matchId: string,
    results: { teamId: string; placement: number; kills: number }[],
  ) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: true },
    });

    if (!match) throw new NotFoundException('Match not found');

    const scoringRules = match.tournament.scoringEngine
      ? JSON.parse(match.tournament.scoringEngine)
      : { '1': 10, kill: 1 };

    // Accumulate score changes to batch-update Redis after DB transaction
    const scoreUpdates: Array<{ teamId: string; newTotalScore: number }> = [];

    // Step 1: DB writes in a single atomic transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: { status: 'COMPLETED' },
      });

      for (const res of results) {
        const score = this.scoringService.calculateScore(
          res.placement,
          res.kills,
          scoringRules,
        );

        await tx.matchParticipation.upsert({
          where: { matchId_teamId: { matchId, teamId: res.teamId } },
          create: {
            matchId,
            teamId: res.teamId,
            placement: res.placement,
            kills: res.kills,
            score,
          },
          update: { placement: res.placement, kills: res.kills, score },
        });

        // Upsert leaderboard entry
        const existing = await tx.tournamentLeaderboard.findUnique({
          where: {
            tournamentId_teamId: {
              tournamentId: match.tournamentId,
              teamId: res.teamId,
            },
          },
        });

        let newTotalPoints: number;

        if (existing) {
          const updated = await tx.tournamentLeaderboard.update({
            where: { id: existing.id },
            data: {
              totalPoints: { increment: score },
              totalKills: { increment: res.kills },
              matchesPlayed: { increment: 1 },
            },
          });
          newTotalPoints = updated.totalPoints;
        } else {
          const created = await tx.tournamentLeaderboard.create({
            data: {
              tournamentId: match.tournamentId,
              teamId: res.teamId,
              totalPoints: score,
              totalKills: res.kills,
              matchesPlayed: 1,
            },
          });
          newTotalPoints = created.totalPoints;
        }

        scoreUpdates.push({
          teamId: res.teamId,
          newTotalScore: newTotalPoints,
        });
      }
    });

    // Step 2: Update Redis sorted set (outside transaction — non-critical)
    await Promise.all(
      scoreUpdates.map(
        ({ teamId, newTotalScore }) =>
          this.leaderboardCache
            .updateScore(match.tournamentId, teamId, newTotalScore)
            .catch(() => {}), // Never block match submission on cache failure
      ),
    );

    // Step 3: Broadcast updated leaderboard to tournament room
    await this.leaderboardGateway.broadcastLeaderboardUpdate(
      match.tournamentId,
    );

    return { success: true, matchId, scoresUpdated: scoreUpdates.length };
  }
}
