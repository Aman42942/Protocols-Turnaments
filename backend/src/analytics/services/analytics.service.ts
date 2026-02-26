import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get Admin Dashboard Statistics (Revenue, User Growth, etc.)
   */
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Total Revenue (Lifetime)
    const totalRevenueAgg = await this.prisma.transaction.aggregate({
      where: { type: { in: ['ENTRY_FEE', 'DEPOSIT'] }, status: 'COMPLETED' },
      _sum: { amount: true },
    });
    const totalRevenue = totalRevenueAgg._sum.amount || 0;

    // 2. Active Tournaments
    const activeTournaments = await this.prisma.tournament.count({
      where: { status: 'LIVE' },
    });

    // 3. Total Users
    const totalUsers = await this.prisma.user.count();

    // 4. Daily Revenue Trend (Last 7 Days) - Using GroupBy or DailyStat if populated
    // For now, we calculate on-the-fly for real-time accuracy on small datasets
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const revenueTrend = await this.prisma.transaction.groupBy({
      by: ['createdAt'],
      where: {
        type: { in: ['ENTRY_FEE', 'DEPOSIT'] },
        status: 'COMPLETED',
        createdAt: { gte: sevenDaysAgo },
      },
      _sum: { amount: true },
    });

    // Format trend data
    const trendMap = {};
    revenueTrend.forEach((item) => {
      const dateStr = item.createdAt.toISOString().split('T')[0];
      trendMap[dateStr] = (trendMap[dateStr] || 0) + (item._sum.amount || 0);
    });

    const formattedTrend: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      formattedTrend.push({ date: ds, revenue: trendMap[ds] || 0 });
    }

    return {
      totalRevenue,
      activeTournaments,
      totalUsers,
      revenueTrend: formattedTrend,
    };
  }

  /**
   * Get Individual Player Performance Metrics
   */
  async getPlayerStats(playerId: string) {
    // 1. Basic User Info
    const user = await this.prisma.user.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        name: true,
        avatar: true,
        riotId: true,
        pubgId: true,
      },
    });

    if (!user) return null;

    // 2. Find all teams this user belongs to
    const teamMemberships = await this.prisma.teamMember.findMany({
      where: { userId: playerId },
      select: { teamId: true },
    });
    const teamIds = teamMemberships.map((tm) => tm.teamId);

    // 3. Aggregate Match Participations for these teams
    // Note: This approximates player stats via team stats.
    // Ideally, MatchParticipation should have playerIds if we track individual performance in squad games.
    // Assuming team performance = player performance for now.

    if (teamIds.length === 0) {
      return {
        user,
        matchesPlayed: 0,
        wins: 0,
        winRate: 0,
        kdRatio: 0,
        avgPlacement: 0,
      };
    }

    const participations = await this.prisma.matchParticipation.findMany({
      where: { teamId: { in: teamIds } },
    });

    const matchesPlayed = participations.length;
    const wins = participations.filter((p) => p.placement === 1).length;
    const totalKills = participations.reduce((sum, p) => sum + p.kills, 0);
    const totalPlacement = participations.reduce(
      (sum, p) => sum + (p.placement || 20),
      0,
    ); // Default 20 if null

    return {
      user,
      matchesPlayed,
      wins,
      winRate: matchesPlayed ? (wins / matchesPlayed) * 100 : 0,
      kdRatio: matchesPlayed ? totalKills / matchesPlayed : 0, // Approx K/D per match
      avgPlacement: matchesPlayed ? totalPlacement / matchesPlayed : 0,
      totalKills,
    };
  }

  /**
   * Get Team Consistency & Performance Metrics
   */
  async getTeamStats(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: { include: { user: true } } },
    });

    if (!team) return null;

    const participations = await this.prisma.matchParticipation.findMany({
      where: { teamId },
      orderBy: { match: { startTime: 'desc' } },
      take: 20, // Recent 20 matches
    });

    const matchesPlayed = participations.length;

    if (matchesPlayed === 0) {
      return {
        team,
        matchesPlayed: 0,
        consistencyScore: 0,
        top3Rate: 0,
        recentResults: [],
      };
    }

    // specific metrics
    const placements = participations.map((p) => p.placement || 20);
    const wins = participations.filter((p) => p.placement === 1).length;
    const top3 = participations.filter((p) => (p.placement || 20) <= 3).length;

    // Consistency Score: Standard Deviation of placements (Lower is better)
    const avgPlacement = placements.reduce((a, b) => a + b, 0) / matchesPlayed;
    const variance =
      placements.reduce((a, b) => a + Math.pow(b - avgPlacement, 2), 0) /
      matchesPlayed;
    const stdDev = Math.sqrt(variance);

    // Normalize consistency score (0-100, where 100 is perfectly consistent at rank 1)
    // Here we just return the raw StdDev for now, or an inverse metric.
    const consistencyScore = Math.max(0, 100 - stdDev * 5);

    return {
      team,
      matchesPlayed,
      avgPlacement,
      winRate: (wins / matchesPlayed) * 100,
      top3Rate: (top3 / matchesPlayed) * 100,
      consistencyScore: Math.round(consistencyScore),
      recentResults: participations.map((p) => ({
        matchId: p.matchId,
        placement: p.placement,
        kills: p.kills,
        score: p.score,
      })),
    };
  }

  /**
   * Daily Batch Processing (Runs at Midnight)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyStats() {
    this.logger.log('Running Daily Analytics Batch...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    // 1. New Users
    const newUsers = await this.prisma.user.count({
      where: { createdAt: { gte: yesterday, lte: endOfYesterday } },
    });

    // 2. Revenue
    const revenueAgg = await this.prisma.transaction.aggregate({
      where: {
        type: { in: ['ENTRY_FEE', 'DEPOSIT'] },
        status: 'COMPLETED',
        createdAt: { gte: yesterday, lte: endOfYesterday },
      },
      _sum: { amount: true },
    });

    // 3. Matches Played
    const matchesPlayed = await this.prisma.match.count({
      where: {
        startTime: { gte: yesterday, lte: endOfYesterday },
        status: 'COMPLETED',
      },
    });

    // 4. Upsert DailyStat
    await this.prisma.dailyStat.upsert({
      where: { date: yesterday },
      update: { newUsers, revenue: revenueAgg._sum.amount || 0, matchesPlayed },
      create: {
        date: yesterday,
        newUsers,
        revenue: revenueAgg._sum.amount || 0,
        matchesPlayed,
      },
    });

    this.logger.log(
      `Daily Stats computed for ${yesterday.toISOString().split('T')[0]}`,
    );
  }
}
