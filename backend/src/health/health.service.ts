import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import * as os from 'os';

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async check() {
    const start = Date.now();

    // ── Database check ────────────────────────────────────────────────────
    let dbStatus = 'down';
    let dbLatency = 0;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
      dbLatency = Date.now() - start;
    } catch {
      dbStatus = 'down';
    }

    // ── Redis check ───────────────────────────────────────────────────────
    let redisStatus = 'down';
    let redisLatency = 0;
    let redisClients = 0;
    try {
      const redisHealth = await this.redis.healthCheck();
      redisStatus = redisHealth.status === 'ok' ? 'up' : 'down';
      redisLatency = redisHealth.latencyMs;
      redisClients = redisHealth.connectedClients;
    } catch {
      redisStatus = 'down';
    }

    // ── System metrics ────────────────────────────────────────────────────
    const memoryUsage = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
      usedPercentage: (
        ((os.totalmem() - os.freemem()) / os.totalmem()) *
        100
      ).toFixed(2),
    };

    const allUp = dbStatus === 'up' && redisStatus === 'up';

    return {
      status: allUp ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: dbStatus,
          latency: `${dbLatency}ms`,
        },
        redis: {
          status: redisStatus,
          latency: `${redisLatency}ms`,
          connectedClients: redisClients,
        },
      },
      system: {
        memory: {
          heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
          systemFree: `${(systemMemory.free / 1024 / 1024 / 1024).toFixed(2)} GB`,
          systemTotal: `${(systemMemory.total / 1024 / 1024 / 1024).toFixed(2)} GB`,
          usedPercent: `${systemMemory.usedPercentage}%`,
        },
        cpu: os.cpus().length,
        platform: os.platform(),
        nodeVersion: process.version,
      },
    };
  }
}
