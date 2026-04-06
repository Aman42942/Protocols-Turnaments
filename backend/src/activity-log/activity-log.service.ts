import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async log(
    adminId: string,
    action: string,
    details?: any,
    targetId?: string,
    ipAddress?: string,
  ) {
    try {
      await this.prisma.activityLog.create({
        data: {
          adminId,
          action,
          details: details ? JSON.stringify(details) : null,
          targetId,
          ipAddress,
        },
      });
    } catch (error) {
      console.error('Failed to create activity log', error);
      // Don't throw error to prevent blocking main action
    }
  }

  async findAll(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: { name: true, email: true, role: true },
          },
        },
      }),
      this.prisma.activityLog.count(),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
