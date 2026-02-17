import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as os from 'os';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async check() {
    const start = Date.now();
    let dbStatus = 'down';
    let dbLatency = 0;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
      dbLatency = Date.now() - start;
    } catch (e) {
      dbStatus = 'down';
    }

    const memoryUsage = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
      usedPercentage: (
        ((os.totalmem() - os.freemem()) / os.totalmem()) *
        100
      ).toFixed(2),
    };

    const uptime = process.uptime();

    return {
      status: dbStatus === 'up' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: uptime,
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`,
      },
      system: {
        memory: {
          heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
          systemFree: `${(systemMemory.free / 1024 / 1024 / 1024).toFixed(2)} GB`,
          systemTotal: `${(systemMemory.total / 1024 / 1024 / 1024).toFixed(2)} GB`,
        },
        cpu: os.cpus().length,
        platform: os.platform(),
      },
    };
  }
}
