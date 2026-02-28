import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, ROLE_HIERARCHY } from '../auth/role.enum';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(data: any) {
    return this.prisma.user.create({ data });
  }

  async findOne(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        country: true,
        bio: true,
        riotId: true,
        pubgId: true,
        bgmiId: true,
        freeFireId: true,
        socials: true,
        banned: true,
        createdAt: true,
        wallet: true,
        teams: { include: { team: true } },
      },
    }) as any;
  }

  async updateProfile(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        avatar: data.avatar,
        bio: data.bio,
        country: data.country,
        riotId: data.riotId,
        pubgId: data.pubgId,
        bgmiId: data.bgmiId,
        freeFireId: data.freeFireId,
        socials: data.socials,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        country: true,
        banned: true,
        createdAt: true,
        wallet: { select: { balance: true } },
        _count: {
          select: { teams: true, notifications: true, tournaments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: Update user role
  async updateRole(requesterId: string, targetUserId: string, newRole: string) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!requester || !targetUser) throw new Error('User not found');

    const requesterLevel = ROLE_HIERARCHY[requester.role as UserRole] || 0;
    const targetLevel = ROLE_HIERARCHY[targetUser.role as UserRole] || 0;
    const newRoleLevel = ROLE_HIERARCHY[newRole as UserRole] || 0;

    // Rule 1: Requester cannot promote someone to a role higher than or equal to their own
    // Exception: SUPERADMIN (level 3) can promote to SUPERADMIN (level 3)?
    // Let's say: Requester must be strictly higher than the target's CURRENT role
    // AND strictly higher than or equal to the NEW role?

    // Actually, let's stick to:
    // You can only modify users with a lower role than yours.
    if (requesterLevel <= targetLevel) {
      throw new Error(
        'You cannot modify a user with a role equal to or higher than yours.',
      );
    }

    // You can only assign roles lower than your own.
    // Exception: SUPERADMIN can assign ADMIN (ok) and MODERATOR (ok).
    if (newRoleLevel >= requesterLevel) {
      throw new Error(
        'You cannot assign a role equal to or higher than your own.',
      );
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });
  }

  // Admin: Ban/Unban user
  async toggleBan(requesterId: string, targetUserId: string) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!requester || !targetUser) throw new Error('User not found');

    const requesterLevel = ROLE_HIERARCHY[requester.role as UserRole] || 0;
    const targetLevel = ROLE_HIERARCHY[targetUser.role as UserRole] || 0;

    // Prevent banning someone with equal or higher rank
    if (requesterLevel <= targetLevel) {
      throw new Error(
        'You cannot ban a user with a role equal to or higher than yours.',
      );
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { banned: !targetUser.banned },
    });
  }

  // Admin: Delete user
  async deleteUser(userId: string) {
    // Delete related records first
    await this.prisma.notification.deleteMany({ where: { userId } });
    await this.prisma.tournamentParticipant.deleteMany({ where: { userId } });
    await this.prisma.teamMember.deleteMany({ where: { userId } });

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (wallet) {
      await this.prisma.transaction.deleteMany({
        where: { walletId: wallet.id },
      });
      await this.prisma.wallet.delete({ where: { userId } });
    }

    return this.prisma.user.delete({ where: { id: userId } });
  }

  // Admin: Get dashboard stats
  async getAdminStats() {
    const [totalUsers, totalTournaments, activeTournaments, totalTeams] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.tournament.count(),
        this.prisma.tournament.count({
          where: { status: { in: ['UPCOMING', 'LIVE'] } },
        }),
        this.prisma.team.count(),
      ]);

    // Revenue: sum of completed deposits
    const depositAgg = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: 'DEPOSIT', status: 'COMPLETED' },
    });
    const totalRevenue = depositAgg._sum.amount || 0;

    // Entry fee revenue
    const entryFeeAgg = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: 'ENTRY_FEE', status: 'COMPLETED' },
    });
    const entryFeeRevenue = entryFeeAgg._sum.amount || 0;

    // Pending deposits
    const pendingDeposits = await this.prisma.transaction.count({
      where: { type: 'DEPOSIT', status: 'PENDING' },
    });

    // Recent users (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newUsersThisWeek = await this.prisma.user.count({
      where: { createdAt: { gte: weekAgo } },
    });

    // Recent signups
    const recentUsers = await this.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    });

    // Recent transactions
    const recentTransactions = await this.prisma.transaction.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    return {
      totalUsers,
      totalTournaments,
      activeTournaments,
      totalTeams,
      totalRevenue,
      entryFeeRevenue,
      pendingDeposits,
      newUsersThisWeek,
      recentUsers,
      recentTransactions,
    };
  }

  async search(query: string, currentUserId: string) {
    if (!query || query.length < 2) return [];
    return this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
        NOT: { id: currentUserId },
        banned: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
      take: 10,
    });
  }
}
