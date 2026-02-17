import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Create a notification
  async create(
    userId: string,
    title: string,
    message: string,
    type = 'info',
    link?: string,
  ) {
    return this.prisma.notification.create({
      data: { userId, title, message, type, link },
    });
  }

  // Get all notifications for a user
  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return { notifications, total, unreadCount, page, limit };
  }

  // Get unread count
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { unreadCount: count };
  }

  // Mark a single notification as read
  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  // Mark all as read
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  // Delete a notification
  async delete(userId: string, notificationId: string) {
    return this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }

  // Delete all notifications
  async deleteAll(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }

  // --- Helper: Send system notifications ---
  async sendWelcome(userId: string) {
    return this.create(
      userId,
      'Welcome to Protocal! 🎮',
      'Verify your email and link your game IDs to start playing.',
      'system',
      '/settings',
    );
  }

  async sendTournamentReminder(userId: string, tournamentName: string) {
    return this.create(
      userId,
      'Tournament Starting Soon ⏰',
      `${tournamentName} starts in 30 minutes. Check in now!`,
      'warning',
      '/dashboard',
    );
  }

  async sendWinnings(userId: string, amount: number, tournamentName: string) {
    return this.create(
      userId,
      'Winnings Deposited 🏆',
      `Your earnings of ₹${amount} from ${tournamentName} have been credited.`,
      'success',
      '/dashboard/wallet',
    );
  }

  async sendTeamInvite(userId: string, teamName: string) {
    return this.create(
      userId,
      'Team Invite 🛡️',
      `You have been invited to join Team "${teamName}".`,
      'info',
      '/dashboard/teams',
    );
  }
}
