import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getGlobalLeaderboard(limit: number = 100) {
    const cachedLeaderboard = await this.prisma.tournamentLeaderboard.findMany({
      orderBy: { totalPoints: 'desc' },
      take: limit,
      include: {
        team: { include: { members: { include: { user: true } } } },
        tournament: { select: { game: true } },
      },
    });

    return cachedLeaderboard.map((entry, index) => ({
      id: entry.team.id,
      name: entry.team.name,
      avatar: entry.team.logo, // Assuming team logo
      points: entry.totalPoints,
      game: entry.tournament.game,
      winRate:
        entry.matchesPlayed > 0
          ? `${Math.round((entry.totalPoints / (entry.matchesPlayed * 10)) * 100)}%`
          : '0%', // Simplified metric
      rank: index + 1,
    }));
  }

  async getTournamentLeaderboard(tournamentId: string) {
    const lb = await this.prisma.tournamentLeaderboard.findMany({
      where: { tournamentId },
      orderBy: { totalPoints: 'desc' },
      include: { team: true },
    });

    return lb.map((entry, index) => ({
      rank: index + 1,
      teamId: entry.teamId,
      teamName: entry.team.name,
      points: entry.totalPoints,
      kills: entry.totalKills,
      matches: entry.matchesPlayed,
    }));
  }

  private getMostFrequent(arr: string[]) {
    if (arr.length === 0) return null;
    const modeMap = {};
    let maxEl = arr[0],
      maxCount = 1;
    for (let i = 0; i < arr.length; i++) {
      const el = arr[i];
      if (modeMap[el] == null) modeMap[el] = 1;
      else modeMap[el]++;
      if (modeMap[el] > maxCount) {
        maxEl = el;
        maxCount = modeMap[el];
      }
    }
    return maxEl;
  }
}
