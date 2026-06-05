import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as os from 'os';
import { SystemHealth } from './interfaces/monitoring.interface';

@Injectable()
export class MonitoringService {
  private requestCount = 0;
  private errorCount = 0;
  private startTime = Date.now();
  private endpointStats: Record<string, number> = {};

  constructor(private prisma: PrismaService) {}

  getSystemHealth(): SystemHealth {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      cpuUsage: os.loadavg()[0], // 1 min load average
      memoryUsage: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        percentage: Number(((usedMem / totalMem) * 100).toFixed(2)),
      },
      uptime: os.uptime(),
      timestamp: new Date(),
    };
  }
  async getDashboardStats() {
    const [
      activeSessions,
      totalUsers,
      totalTournaments,
      newUsers24h,
      transactionVolume,
    ] = await Promise.all([
      this.prisma.userSession.count({
        where: { lastActive: { gt: new Date(Date.now() - 15 * 60 * 1000) } },
      }),
      this.prisma.user.count(),
      this.prisma.tournament.count(),
      this.prisma.user.count({
        where: { createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS' },
      }),
    ]);

    const securityAlerts = await this.prisma.securityLog.count({
      where: { resolved: false, severity: 'HIGH' },
    });

    const recentActivity = await this.prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { name: true } } },
    });

    // Get top 5 endpoints
    const topEndpoints = Object.entries(this.endpointStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path, count]) => ({ path, count }));

    return {
      health: this.getSystemHealth(),
      realtime: {
        activeSessions,
        totalUsers,
        totalTournaments,
        securityAlerts,
        newUsers24h,
      },
      traffic: {
        totalRequestsSinceRestart: this.requestCount,
        errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
        uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
        topEndpoints,
      },
      financial: {
        totalVolume: transactionVolume._sum.amount || 0,
      },
      recentActivity,
    };
  }

  incrementRequestCount(path: string) {
    this.requestCount++;
    const baseBorder = path.split('?')[0];
    this.endpointStats[baseBorder] = (this.endpointStats[baseBorder] || 0) + 1;
  }

  incrementErrorCount() {
    this.errorCount++;
  }

  async logSecurityEvent(data: {
    type: string;
    ipAddress: string;
    path: string;
    method: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    userId?: string;
    payload?: any;
  }) {
    return this.prisma.securityLog.create({
      data: {
        ...data,
        payload: data.payload ? JSON.stringify(data.payload) : null,
      },
    });
  }

  async getSecurityLogs(limit = 50) {
    return this.prisma.securityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { name: true, email: true } },
      },
    });
  }
}
