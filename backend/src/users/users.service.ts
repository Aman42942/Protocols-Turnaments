import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, ROLE_HIERARCHY } from '../auth/role.enum';
import { SecurityService, SecurityEventType, SecuritySeverity } from '../security/security.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private securityService: SecurityService,
  ) { }

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
        emailVerified: true,
        role: true,
        avatar: true,
        country: true,
        bio: true,
        gender: true,
        dob: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        riotId: true,
        pubgId: true,
        bgmiId: true,
        freeFireId: true,
        socials: true,
        profileCompletion: true,
        profileVisibility: true,
        showGameIds: true,
        canChangeVisibility: true,
        twoFactorEnabled: true,
        banned: true,
        createdAt: true,
        wallet: true,
        teams: { include: { team: true } },
      } as any,
    }) as any;
  }

  async updateProfile(id: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');

    // Sanitize input: convert empty strings to null to avoid unique constraint issues
    const sanitizedData: any = {};
    const fieldsToSanitize = [
      'name', 'avatar', 'bio', 'country', 'riotId', 'pubgId', 'bgmiId', 'freeFireId',
      'socials', 'gender', 'phone', 'address', 'city', 'state', 'pincode'
    ];

    for (const key of Object.keys(data)) {
      if (fieldsToSanitize.includes(key)) {
        sanitizedData[key] = data[key] === '' ? null : data[key];
      } else {
        sanitizedData[key] = data[key];
      }
    }

    const mergedData = { ...user, ...sanitizedData };

    // Calculate Completion Score (Total 100%)
    let score = 0;
    if (mergedData.emailVerified && mergedData.name) score += 20;
    if (mergedData.phone) score += 10;
    if (mergedData.dob) score += 10;
    if (mergedData.gender) score += 10;
    if (mergedData.address) score += 5;
    if (mergedData.city) score += 5;
    if (mergedData.state) score += 5;
    if (mergedData.pincode) score += 5;
    if (mergedData.pubgId || mergedData.bgmiId || mergedData.freeFireId || mergedData.riotId) score += 10;
    if (mergedData.avatar) score += 10;
    if (mergedData.bio) score += 10;

    // Enforce Privacy Change Permission
    let safeVisibility = undefined;
    if (data.profileVisibility !== undefined) {
      if ((user as any).canChangeVisibility) {
        safeVisibility = data.profileVisibility;
      }
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          name: sanitizedData.name,
          avatar: sanitizedData.avatar,
          bio: sanitizedData.bio,
          country: sanitizedData.country,
          riotId: sanitizedData.riotId,
          pubgId: sanitizedData.pubgId,
          bgmiId: sanitizedData.bgmiId,
          freeFireId: sanitizedData.freeFireId,
          socials: sanitizedData.socials,
          // Personal Fields
          dob: sanitizedData.dob ? new Date(sanitizedData.dob) : undefined,
          gender: sanitizedData.gender,
          phone: sanitizedData.phone,
          address: sanitizedData.address,
          city: sanitizedData.city,
          state: sanitizedData.state,
          pincode: sanitizedData.pincode,
          // Privacy & Scoring
          profileVisibility: safeVisibility,
          showGameIds: sanitizedData.showGameIds,
          profileCompletion: score > 100 ? 100 : score,
        } as any,
      });
    } catch (error) {
      console.error('[DATABASE ERROR] updateProfile failure:', error);
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'input';
        throw new Error(`The ${field} already exists. Please use a unique value.`);
      }
      throw new Error('Database operation failed. Please check your inputs.');
    }
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

    const result = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });

    // Detailed Security Audit Log
    await this.securityService.logThreat({
      type: SecurityEventType.ADMIN_ACTION,
      ipAddress: 'System-Level',
      userId: requesterId,
      path: `UsersService.updateRole`,
      method: 'INTERNAL',
      payload: `Role Change: User ${targetUserId} changed from ${targetUser.role} to ${newRole}`,
      severity: SecuritySeverity.MEDIUM,
    });

    return result;
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

    const result = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { banned: !targetUser.banned },
    });

    // Detailed Security Audit Log
    await this.securityService.logThreat({
      type: SecurityEventType.ADMIN_ACTION,
      ipAddress: 'System-Level',
      userId: requesterId,
      path: `UsersService.toggleBan`,
      method: 'INTERNAL',
      payload: `${result.banned ? 'Banned' : 'Unbanned'} user ${targetUserId}. Reason: Admin manual action.`,
      severity: SecuritySeverity.HIGH,
    });

    return result;
  }

  // Admin: Toggle Privacy Override
  async togglePrivacyOverride(requesterId: string, targetUserId: string) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true },
    });

    if (!requester || (requester.role !== 'SUPERADMIN' && requester.role !== 'ADMIN' && requester.role !== 'ULTIMATE_ADMIN')) {
      throw new Error('Unauthorized');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { canChangeVisibility: true } as any
    });

    if (!targetUser) throw new Error('Target user not found');

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { canChangeVisibility: !(targetUser as any).canChangeVisibility } as any,
    }) as any;
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
          where: { 
            status: { in: ['UPCOMING', 'LIVE', 'upcoming', 'live'] } 
          },
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

  // ========== SESSION MANAGEMENT ==========

  async getActiveSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId },
      orderBy: { lastActive: 'desc' },
      select: {
        id: true,
        device: true,
        ipAddress: true,
        lastActive: true,
        createdAt: true,
      }
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    // Ensure the session belongs to the user
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, userId }
    });

    if (!session) {
      throw new Error('Session not found or unauthorized');
    }

    return this.prisma.userSession.delete({
      where: { id: sessionId }
    });
  }

  // Admin: Revoke any session
  async adminRevokeSession(sessionId: string) {
    return this.prisma.userSession.delete({
      where: { id: sessionId }
    });
  }

  // Admin: Get all sessions for a user
  async adminGetUserSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId },
      orderBy: { lastActive: 'desc' }
    });
  }
}
