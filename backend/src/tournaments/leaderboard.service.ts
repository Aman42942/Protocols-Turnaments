import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) { }

  async getGlobalLeaderboard(limit: number = 100) {
    // 1. Fetch all COMPLETED matches with Winner info
    const matches = await this.prisma.match.findMany({
      where: { status: 'COMPLETED', winnerId: { not: null } },
      select: { winnerId: true, tournament: { select: { game: true } } },
    });

    // 2. Fetch all Approved Participations to count "Matches Played" (approx) or just participation
    // For accurate "Matches Played", we'd need to query matches where teamA or teamB is the user's team.
    // For MVP, we'll base points on WINS from matches and Participation count.

    // Map TeamID -> Win Count & Game
    const teamWins: Record<string, { wins: number; game: string }> = {};
    matches.forEach((m) => {
      if (m.winnerId) {
        if (!teamWins[m.winnerId])
          teamWins[m.winnerId] = { wins: 0, game: m.tournament.game };
        teamWins[m.winnerId].wins++;
      }
    });

    // 3. Find Users belonging to these winning teams
    const winningTeamIds = Object.keys(teamWins);

    // If no matches completed, return empty (triggers "Coming Soon")
    if (winningTeamIds.length === 0) return [];

    const teamMembers = await this.prisma.teamMember.findMany({
      where: { teamId: { in: winningTeamIds } },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    // 3.5 Fetch Total Matches for these teams to calculate Win Rate
    const allTeamMatches = await this.prisma.match.findMany({
      where: {
        status: 'COMPLETED',
        OR: [
          { teamAId: { in: winningTeamIds } },
          { teamBId: { in: winningTeamIds } }
        ]
      },
      select: { teamAId: true, teamBId: true }
    });

    const teamTotalMatches: Record<string, number> = {};
    allTeamMatches.forEach(m => {
      if (m.teamAId && winningTeamIds.includes(m.teamAId)) teamTotalMatches[m.teamAId] = (teamTotalMatches[m.teamAId] || 0) + 1;
      if (m.teamBId && winningTeamIds.includes(m.teamBId)) teamTotalMatches[m.teamBId] = (teamTotalMatches[m.teamBId] || 0) + 1;
    });

    // 4. Aggregate User Points
    const userStats: Record<
      string,
      { user: any; points: number; wins: number; totalMatches: number; game: string }
    > = {};

    teamMembers.forEach((tm) => {
      const userId = tm.userId;
      const wins = teamWins[tm.teamId]?.wins || 0;
      const totalMatches = teamTotalMatches[tm.teamId] || 0;
      const game = teamWins[tm.teamId]?.game || 'General';
      const points = wins * 100; // 100 pts per win

      if (!userStats[userId]) {
        userStats[userId] = {
          user: tm.user,
          points: 0,
          wins: 0,
          totalMatches: 0,
          game: game,
        };
      }
      userStats[userId].points += points;
      userStats[userId].wins += wins;
      userStats[userId].totalMatches += totalMatches;
      // Keep the most recent game or dominant game logic if needed
    });

    // 5. Convert to Array and Sort
    const leaderboardData = Object.values(userStats)
      .sort((a, b) => b.points - a.points)
      .slice(0, limit)
      .map((stat, index) => {
        const winRateVal = stat.totalMatches > 0 ? Math.round((stat.wins / stat.totalMatches) * 100) : 0;
        return {
          id: stat.user.id,
          name: stat.user.name || `Player_${stat.user.id.substring(0, 4)}`,
          avatar: stat.user.avatar,
          points: stat.points,
          game: stat.game,
          winRate: `${winRateVal}%`,
          rank: index + 1,
        };
      });

    return leaderboardData;
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
