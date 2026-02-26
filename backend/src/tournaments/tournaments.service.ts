import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { randomBytes } from 'crypto';

import { LeaderboardGateway } from './leaderboard.gateway';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class TournamentsService {
  constructor(
    private prisma: PrismaService,
    private leaderboardGateway: LeaderboardGateway,
    private usersService: UsersService,
    private emailService: EmailService,
    private walletService: WalletService,
  ) { }

  private generateShareCode(): string {
    return randomBytes(4).toString('hex').toUpperCase(); // 8-char code
  }

  async create(createTournamentDto: CreateTournamentDto) {
    const tournament = await this.prisma.tournament.create({
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

    // Send notifications to all users asynchronously
    this.notifyAllUsers(tournament).catch(err =>
      console.error('Failed to notify users about new tournament:', err)
    );

    return tournament;
  }

  private async notifyAllUsers(tournament: any) {
    const users = await this.usersService.findAll();
    const emailPromises = users.map(user =>
      this.emailService.sendTournamentCreatedNotification(
        user.email,
        user.name || 'Warrior',
        {
          id: tournament.id,
          title: tournament.title,
          game: tournament.game,
          prizePool: tournament.prizePool,
          entryFee: tournament.entryFeePerPerson,
          startDate: tournament.startDate,
        }
      )
    );
    await Promise.allSettled(emailPromises);
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
  async registerUser(userId: string, tournamentId: string, paymentReference?: string, status: 'APPROVED' | 'PENDING' = 'APPROVED') {
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
      // If we have a paymentReference, it means the user paid directly (Cashfree or Manual UPI)
      if (paymentReference) {
        return this.prisma.$transaction(async (tx) => {
          const wallet = await tx.wallet.findUnique({ where: { userId } });

          // Record Transaction (Completed since it's already verified)
          await tx.transaction.create({
            data: {
              walletId: wallet?.id || '',
              amount: tournament.entryFeePerPerson,
              type: 'ENTRY_FEE',
              status: 'COMPLETED',
              reference: paymentReference,
              description: `Direct payment for ${tournament.title}`,
            },
          });

          // Add to Tournament
          const participant = await tx.tournamentParticipant.create({
            data: {
              userId,
              tournamentId,
              status,
              paymentStatus: status === 'APPROVED' ? 'PAID' : 'PENDING',
              paymentId: paymentReference,
            },
          });

          return participant;
        });
      }

      // Traditional Wallet Deduction Flow (Fallback)
      const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < tournament.entryFeePerPerson) {
        throw new BadRequestException(
          `Insufficient funds. Please pay ₹${tournament.entryFeePerPerson} to join.`,
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
            status,
            paymentStatus: status === 'APPROVED' ? 'PAID' : 'PENDING',
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
        status,
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

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete Leaderboard entries
      await tx.tournamentLeaderboard.deleteMany({ where: { tournamentId: id } });

      // 2. Delete Match Participations for matches in this tournament
      const matches = await tx.match.findMany({
        where: { tournamentId: id },
        select: { id: true },
      });
      const matchIds = matches.map((m) => m.id);
      await tx.matchParticipation.deleteMany({
        where: { matchId: { in: matchIds } },
      });

      // 3. Delete Match Result Locks
      await tx.resultLock.deleteMany({
        where: { matchId: { in: matchIds } },
      });

      // 4. Delete Matches
      await tx.match.deleteMany({ where: { tournamentId: id } });

      // 5. Delete Participants/Teams registrations
      await tx.tournamentParticipant.deleteMany({
        where: { tournamentId: id },
      });

      // 6. Delete Escrow Pool
      await tx.escrowPool.deleteMany({ where: { tournamentId: id } });

      // 7. Finally, delete the Tournament
      return tx.tournament.delete({ where: { id } });
    });
  }

  async refundParticipant(tournamentId: string, participantId: string, adminId: string, ip: string) {
    const tournament = await this.findOne(tournamentId);
    if (!tournament) throw new BadRequestException('Tournament not found');

    const participant = await this.prisma.tournamentParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant) throw new BadRequestException('Participant not found');
    if (participant.tournamentId !== tournamentId) throw new BadRequestException('Participant does not belong to this tournament');
    if (participant.paymentStatus === 'REFUNDED') throw new BadRequestException('Participant already refunded');
    if (participant.paymentStatus !== 'PAID') throw new BadRequestException('Only paid participants can be refunded');

    const amount = tournament.entryFeePerPerson || 0;
    if (amount <= 0) throw new BadRequestException('No entry fee to refund');

    // 1. Perform refund in wallet
    await this.walletService.refundTournamentEntry(
      participant.userId,
      amount,
      tournamentId,
      tournament.title,
    );

    // 2. Update participant status
    const updated = await this.prisma.tournamentParticipant.update({
      where: { id: participantId },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
      },
    });

    return {
      amount,
      userId: participant.userId,
      tournamentTitle: tournament.title,
      updatedParticipant: updated,
    };
  }

  async findParticipant(userId: string, tournamentId: string) {
    return this.prisma.tournamentParticipant.findFirst({
      where: {
        userId,
        tournamentId,
        paymentStatus: 'PAID',
      },
    });
  }

  // ─── ADMIN: Get all participants for a tournament ───────────────────────────
  async getParticipants(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, title: true, entryFeePerPerson: true },
    });
    if (!tournament) throw new BadRequestException('Tournament not found');

    const participants = await this.prisma.tournamentParticipant.findMany({
      where: { tournamentId },
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });

    return { tournament, participants };
  }

  // ─── ADMIN: Force-remove a fraudulent participant ────────────────────────────
  async kickParticipant(tournamentId: string, participantId: string, reason: string) {
    const participant = await this.prisma.tournamentParticipant.findUnique({
      where: { id: participantId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!participant) throw new BadRequestException('Participant not found');
    if (participant.tournamentId !== tournamentId) {
      throw new BadRequestException('Participant does not belong to this tournament');
    }
    if (['CANCELLED', 'KICKED'].includes(participant.status)) {
      throw new BadRequestException('Participant is already removed');
    }

    // Mark as kicked (soft delete — preserves audit trail)
    const updated = await this.prisma.tournamentParticipant.update({
      where: { id: participantId },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'CANCELLED',
      },
    });

    return {
      success: true,
      message: `${participant.user.name} has been removed from the tournament.`,
      participant: updated,
    };
  }
}
