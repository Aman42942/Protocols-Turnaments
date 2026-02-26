import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizerService {
  constructor(private prisma: PrismaService) {}

  // ─── Organizer CRUD ───────────────────────────────────────────────────────

  /**
   * Create an organizer account for a user.
   * One user can have only one organizer account.
   */
  async create(
    userId: string,
    data: {
      name: string;
      slug: string;
      description?: string;
      website?: string;
      contactEmail?: string;
      panNumber?: string;
      gstNumber?: string;
    },
  ) {
    const exists = await this.prisma.organizer.findUnique({
      where: { userId },
    });
    if (exists)
      throw new ConflictException('You already have an organizer account');

    const slugTaken = await this.prisma.organizer.findUnique({
      where: { slug: data.slug },
    });
    if (slugTaken)
      throw new ConflictException(`Slug "${data.slug}" is already taken`);

    return this.prisma.organizer.create({
      data: { userId, ...data },
      include: { theme: true },
    });
  }

  async findBySlug(slug: string) {
    const organizer = await this.prisma.organizer.findUnique({
      where: { slug },
      include: { theme: true },
    });
    if (!organizer) throw new NotFoundException('Organizer not found');
    return organizer;
  }

  async findByUserId(userId: string) {
    const organizer = await this.prisma.organizer.findUnique({
      where: { userId },
      include: { theme: true },
    });
    if (!organizer)
      throw new NotFoundException('You do not have an organizer account');
    return organizer;
  }

  async update(
    userId: string,
    data: Partial<{
      name: string;
      description: string;
      website: string;
      contactEmail: string;
      panNumber: string;
      gstNumber: string;
      tnc: string;
    }>,
  ) {
    const org = await this.prisma.organizer.findUnique({ where: { userId } });
    if (!org) throw new NotFoundException('Organizer not found');

    return this.prisma.organizer.update({
      where: { id: org.id },
      data,
      include: { theme: true },
    });
  }

  async listAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [organizers, total] = await Promise.all([
      this.prisma.organizer.findMany({
        skip,
        take: limit,
        where: { isActive: true },
        include: { theme: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organizer.count({ where: { isActive: true } }),
    ]);
    return { organizers, total, page, pages: Math.ceil(total / limit) };
  }

  // ─── White-Label Theme ────────────────────────────────────────────────────

  async upsertTheme(
    userId: string,
    themeData: {
      primaryColor?: string;
      accentColor?: string;
      bgColor?: string;
      textColor?: string;
      logoUrl?: string;
      faviconUrl?: string;
      bannerUrl?: string;
      fontFamily?: string;
      heroTitle?: string;
      heroSubtitle?: string;
      footerText?: string;
    },
  ) {
    const org = await this.prisma.organizer.findUnique({ where: { userId } });
    if (!org) throw new NotFoundException('Organizer not found');

    return this.prisma.organizerTheme.upsert({
      where: { organizerId: org.id },
      create: { organizerId: org.id, ...themeData },
      update: themeData,
    });
  }

  async getTheme(slug: string) {
    const org = await this.prisma.organizer.findUnique({
      where: { slug },
      include: { theme: true },
    });
    if (!org) throw new NotFoundException('Organizer not found');
    return org.theme;
  }

  // ─── Organizer Dashboard Analytics ───────────────────────────────────────

  async getDashboard(userId: string) {
    const org = await this.prisma.organizer.findUnique({ where: { userId } });
    if (!org) throw new NotFoundException('Organizer not found');

    const [
      totalTournaments,
      liveTournaments,
      completedTournaments,
      recentTournaments,
      revenueResult,
    ] = await Promise.all([
      // Total tournaments
      this.prisma.tournament.count({ where: { organizerId: org.id } }),

      // Live tournaments
      this.prisma.tournament.count({
        where: { organizerId: org.id, status: 'LIVE' },
      }),

      // Completed tournaments
      this.prisma.tournament.count({
        where: { organizerId: org.id, status: 'COMPLETED' },
      }),

      // Last 5 tournaments
      this.prisma.tournament.findMany({
        where: { organizerId: org.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          startDate: true,
          entryFeePerPerson: true,
          prizePool: true,
          collectedFees: true,
          _count: { select: { teams: true } },
        },
      }),

      // Total revenue from escrow pools
      this.prisma.escrowPool.aggregate({
        where: {
          tournament: { organizerId: org.id },
        } as any,
        _sum: { platformFeeRaw: true, totalCollected: true },
      }),
    ]);

    return {
      organizer: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        isVerified: org.isVerified,
      },
      stats: {
        totalTournaments,
        liveTournaments,
        completedTournaments,
        totalRevenue: revenueResult._sum.totalCollected ?? 0,
        platformFeesPaid: revenueResult._sum.platformFeeRaw ?? 0,
      },
      recentTournaments,
    };
  }

  // ─── Admin: Verify Organizer ───────────────────────────────────────────────

  async verify(organizerId: string, adminId: string) {
    return this.prisma.organizer.update({
      where: { id: organizerId },
      data: { isVerified: true },
    });
  }

  async suspend(organizerId: string) {
    return this.prisma.organizer.update({
      where: { id: organizerId },
      data: { isActive: false },
    });
  }
}
