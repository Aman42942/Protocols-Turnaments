import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { randomBytes } from 'crypto';

import { LeaderboardGateway } from './leaderboard.gateway';

@Injectable()
export class TournamentsService {
  constructor(
    private prisma: PrismaService,
    private leaderboardGateway: LeaderboardGateway,
  ) {}

  private generateShareCode(): string {
    return randomBytes(4).toString('hex').toUpperCase(); // 8-char code
  }

  create(createTournamentDto: CreateTournamentDto) {
    return this.prisma.tournament.create({
      data: {
        title: createTournamentDto.title,
        description: createTournamentDto.description,
        game: createTournamentDto.game,
        tier: createTournamentDto.tier,
        entryFeePerPerson: createTournamentDto.entryFeePerPerson,
        prizePool: createTournamentDto.prizePool,
        startDate: new Date(createTournamentDto.startDate),
        maxTeams: createTournamentDto.maxTeams,
        gameMode: createTournamentDto.gameMode,
        format: createTournamentDto.format || 'SINGLE_ELIM',
        // Game-specific settings
        scoringEngine: createTournamentDto.scoringEngine,
        mapPool: createTournamentDto.mapPool,
        gameSettings: createTournamentDto.gameSettings,
        rules: createTournamentDto.rules,
        prizeDistribution: createTournamentDto.prizeDistribution,
        // Room management
        roomId: createTournamentDto.roomId,
        roomPassword: createTournamentDto.roomPassword,
        slotList: createTournamentDto.slotList,
        // Sharing & links
        shareCode: createTournamentDto.shareCode || this.generateShareCode(),
        whatsappGroupLink: createTournamentDto.whatsappGroupLink,
        discordChannelId: createTournamentDto.discordChannelId,
        streamUrl: createTournamentDto.streamUrl,
        region: createTournamentDto.region,
      },
    });
  }

  findAll() {
    return this.prisma.tournament.findMany({
      orderBy: { startDate: 'asc' },
      include: { _count: { select: { teams: true } } },
    });
  }

  async findOne(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        teams: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { teams: true } },
      },
    });
    if (tournament) {
      // Ghost Data: Hide sensitive room details by default
      (tournament as any).roomPassword = null;
      (tournament as any).roomId = null;
    }
    return tournament;
  }

  async findByShareCode(shareCode: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { shareCode },
      include: {
        teams: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { teams: true } },
      },
    });
    if (tournament) {
      // Ghost Data: Hide sensitive room details by default
      (tournament as any).roomPassword = null;
      (tournament as any).roomId = null;
    }
    return tournament;
  }

  // Securely retrieve credentials for Participants or Admins
  async getCredentials(id: string, userId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
    });
    if (!tournament) throw new BadRequestException('Tournament not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isParticipant = await this.prisma.tournamentParticipant.findFirst({
      where: { tournamentId: id, userId, status: 'APPROVED' },
    });

    if (user?.role !== 'ADMIN' && !isParticipant) {
      throw new BadRequestException(
        'Access Denied. You are not a participant.',
      );
    }

    return {
      roomId: tournament.roomId,
      roomPassword: tournament.roomPassword,
      whatsappGroupLink: tournament.whatsappGroupLink,
      discordChannelId: tournament.discordChannelId,
    };
  }

  // Register a user for a tournament (Robust Version)
  async registerUser(userId: string, tournamentId: string) {
    // 1. Check Tournament Existence & Status
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { _count: { select: { teams: true } } },
    });

    if (!tournament) throw new BadRequestException('Tournament not found');

    // Check Status (Only UPCOMING or OPEN allowed)
    // Assuming status is inferred or stored. If strictly checking:
    // if (tournament.status !== 'UPCOMING') throw new BadRequestException('Tournament is not open for registration');

    // 2. Check Capacity
    if (tournament.maxTeams && tournament._count.teams >= tournament.maxTeams) {
      throw new BadRequestException('Tournament is full');
    }

    // 3. Check Existing Registration
    const existing = await this.prisma.tournamentParticipant.findFirst({
      where: { userId, tournamentId },
    });
    if (existing) {
      throw new BadRequestException(
        'You are already registered for this tournament',
      );
    }

    // 4. Handle Entry Fee & Wallet Deduction
    if (tournament.entryFeePerPerson > 0) {
      const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < tournament.entryFeePerPerson) {
        throw new BadRequestException(
          `Insufficient funds. You need ₹${tournament.entryFeePerPerson} to join.`,
        );
      }

      // Atomic Transaction: Deduct Money -> Add Participant
      return this.prisma.$transaction(async (tx) => {
        // Deduct from User Wallet
        await tx.wallet.update({
          where: { userId },
          data: { balance: { decrement: tournament.entryFeePerPerson } },
        });

        // Record Transaction
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            amount: tournament.entryFeePerPerson,
            type: 'ENTRY_FEE',
            status: 'COMPLETED',
            description: `Entry fee for ${tournament.title}`,
          },
        });

        // Add to Tournament
        const participant = await tx.tournamentParticipant.create({
          data: {
            userId,
            tournamentId,
            status: 'APPROVED',
            paymentStatus: 'PAID',
          },
        });

        return participant;
      });
    }

    // Free Tournament
    const participant = await this.prisma.tournamentParticipant.create({
      data: {
        userId,
        tournamentId,
        status: 'APPROVED',
        paymentStatus: 'PAID',
      },
    });

    // Notify clients of new participant
    this.leaderboardGateway.updateLeaderboard(tournamentId);

    return participant;
  }

  // Update room credentials (admin can update mid-tournament)
  async updateRoomCredentials(
    id: string,
    roomId: string,
    roomPassword: string,
  ) {
    return this.prisma.tournament.update({
      where: { id },
      data: { roomId, roomPassword },
    });
  }

  update(id: string, updateTournamentDto: UpdateTournamentDto) {
    const data: any = { ...updateTournamentDto };
    if (updateTournamentDto.startDate) {
      data.startDate = new Date(updateTournamentDto.startDate);
    }
    return this.prisma.tournament.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.tournament.delete({
      where: { id },
    });
  }
}
