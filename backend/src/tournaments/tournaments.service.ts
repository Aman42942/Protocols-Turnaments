import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { randomBytes } from 'crypto';

import { LeaderboardGateway } from './leaderboard.gateway';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentsService } from '../payments/payments.service';
import { PaypalService } from '../payments/paypal.service';
import { NotificationsService } from '../notifications/notifications.service';

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TournamentsService {
  constructor(
    private prisma: PrismaService,
    private leaderboardGateway: LeaderboardGateway,
    private usersService: UsersService,
    private walletService: WalletService,
    @InjectQueue('notification') private notificationQueue: Queue,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
    private paypalService: PaypalService,
    private notificationsService: NotificationsService,
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
        shareMessage: createTournamentDto.shareMessage,
        region: createTournamentDto.region,
        banner: createTournamentDto.banner,
      },
    });

    // Send notifications to all users asynchronously
    this.notifyAllUsers(tournament).catch(err =>
      console.error('Failed to notify users about new tournament:', err)
    );

    return tournament;
  }

  private async notifyAllUsers(tournament: any) {
    // 1. In-app broadcast (Real-time + Persistence)
    await this.notificationsService.broadcast(
      'New Tournament Added 🏆',
      `${tournament.title} is now open for registration! Prize pool: ₹${tournament.prizePool.toLocaleString()}.`,
      'success',
      `/tournaments/${tournament.id}`
    );

    // 2. Offload Email notifications to background queue (batched to avoid memory explosion)
    try {
      const users = await this.usersService.findAll();
      const BATCH_SIZE = 100;
      
      // Add jobs to queue in batches to avoid memory issues with large user bases
      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);
        const jobs = batch.map(user => ({
          name: 'tournament_created',
          data: {
            userEmail: user.email,
            userName: user.name || 'Warrior',
            tournament: {
              id: tournament.id,
              title: tournament.title,
              game: tournament.game,
              prizePool: tournament.prizePool,
              entryFee: tournament.entryFeePerPerson,
              startDate: tournament.startDate,
            }
          },
          opts: {
            removeOnComplete: true,
            removeOnFail: false,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            }
          }
        }));

        await this.notificationQueue.addBulk(jobs);
      }
      console.log(`Successfully queued ${users.length} tournament notifications in batches of ${BATCH_SIZE}.`);
    } catch (err) {
      console.error('[QUEUE] Failed to queue tournament notifications (Redis may be down):', err.message);
      // Don't crash tournament creation flow if queue fails
    }
  }

  findAll() {
    return this.prisma.tournament.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            teams: { where: { status: { notIn: ['CANCELLED', 'REJECTED'] } } },
          },
        },
        teams: {
          where: { paymentStatus: 'PAID', status: { notIn: ['CANCELLED', 'REJECTED'] } },
          select: { id: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        teams: {
          where: { status: { notIn: ['CANCELLED', 'REJECTED'] } },
          include: {
            user: { select: { id: true, name: true, email: true } },
            team: { select: { name: true } },
          },
        },
        _count: {
          select: {
            teams: { where: { status: { notIn: ['CANCELLED', 'REJECTED'] } } },
          },
        },
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
          where: { status: { notIn: ['CANCELLED', 'REJECTED'] } },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: {
          select: {
            teams: { where: { status: { notIn: ['CANCELLED', 'REJECTED'] } } },
          },
        },
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

    // Allow all admin roles to view credentials, not just 'ADMIN'
    const adminRoles = ['ADMIN', 'SUPERADMIN', 'ULTIMATE_ADMIN', 'EMPLOYEE'];
    if (!adminRoles.includes(user?.role || '') && !isParticipant) {
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

  // Validate if a user can register (Pre-check for payments)
  async validateRegistration(userId: string, tournamentId: string, teamId?: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: {
            teams: {
              where: { status: { notIn: ['CANCELLED', 'REJECTED'] } },
            },
          },
        },
      },
    });

    if (!tournament) throw new BadRequestException('Tournament not found');

    // 1. Team Validation
    if (tournament.gameMode !== 'SOLO') {
      if (!teamId) throw new BadRequestException(`Team selection is required for ${tournament.gameMode} mode.`);

      const isMember = await this.prisma.teamMember.count({
        where: { teamId, userId },
      });
      if (isMember === 0) throw new BadRequestException('You are not a member of the selected team.');

      const maxPerTeam = tournament.gameMode === 'DUO' ? 2 : tournament.gameMode === 'SQUAD' ? 4 : 5;
      const currentTeamCount = await this.prisma.tournamentParticipant.count({
        where: { tournamentId, teamId, status: { notIn: ['CANCELLED', 'REJECTED'] } },
      });

      if (currentTeamCount >= maxPerTeam) {
        throw new BadRequestException(`Your team already has the maximum ${maxPerTeam} members registered.`);
      }
    }

    // 2. Time & Status Check
    if (tournament.status !== 'UPCOMING') {
      throw new BadRequestException('Registration is not open for this tournament');
    }

    if (new Date() >= tournament.startDate) {
      throw new BadRequestException('Registration has closed for this tournament');
    }

    // 3. Capacity Check
    if (tournament.maxTeams) {
      if (tournament.gameMode === 'SOLO') {
        if (tournament._count.teams >= tournament.maxTeams) {
          throw new BadRequestException('Tournament is full');
        }
      } else {
        // Count unique squads (excluding cancelled/rejected)
        const participants = await this.prisma.tournamentParticipant.findMany({
          where: { tournamentId, status: { notIn: ['CANCELLED', 'REJECTED'] } },
          select: { teamId: true },
        });
        
        const uniqueTeamIds = new Set(participants.map(p => p.teamId).filter((tid): tid is string => !!tid));
        
        // If the user's team is not already in the tournament and we hit maxTeams, block.
        if (teamId && !uniqueTeamIds.has(teamId) && uniqueTeamIds.size >= tournament.maxTeams) {
          throw new BadRequestException('Tournament is full (All team slots occupied)');
        }
      }
    }

    // 3. Existing Registration Check
    const existing = await this.prisma.tournamentParticipant.findFirst({
      where: { userId, tournamentId, status: { notIn: ['CANCELLED', 'REJECTED'] } },
    });
    if (existing) throw new BadRequestException('You are already registered for this tournament');

    return { tournament };
  }

  // Register a user for a tournament (Robust Version)
  async registerUser(
    userId: string,
    tournamentId: string,
    paymentReference?: string,
    status: 'APPROVED' | 'PENDING' = 'APPROVED',
    teamId?: string,
  ) {
    // 1. Check Tournament Existence & Status
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: {
            teams: {
              where: { status: { notIn: ['CANCELLED', 'REJECTED'] } },
            },
          },
        },
      },
    });

    if (!tournament) throw new BadRequestException('Tournament not found');

    // 1.1 Team Validation for non-SOLO modes
    if (tournament.gameMode !== 'SOLO') {
      if (!teamId) {
        throw new BadRequestException(
          `Team selection is required for ${tournament.gameMode} mode.`,
        );
      }

      // Check if user is a member of the selected team
      const memberCount = await this.prisma.teamMember.count({
        where: { teamId, userId },
      });
      if (memberCount === 0) {
        throw new BadRequestException('You are not a member of the selected team.');
      }

      // Check if the team already has maximum allowed members in this tournament
      const maxPerTeam =
        tournament.gameMode === 'DUO' ? 2 : tournament.gameMode === 'SQUAD' ? 4 : 5;
      const currentTeamCount = await this.prisma.tournamentParticipant.count({
        where: {
          tournamentId,
          teamId,
          status: { notIn: ['CANCELLED', 'REJECTED'] },
        },
      });

      if (currentTeamCount >= maxPerTeam) {
        throw new BadRequestException(
          `Your team already has the maximum ${maxPerTeam} members registered for this tournament.`,
        );
      }
    } else if (teamId) {
      // In SOLO mode, teamId should ideally be null
      teamId = undefined;
    }

    // 2. Check Capacity & Time
    if (tournament.status !== 'UPCOMING') {
      throw new BadRequestException('Registration is not open for this tournament');
    }

    if (new Date() >= tournament.startDate) {
      throw new BadRequestException('Registration has closed for this tournament');
    }

    if (tournament.maxTeams) {
      if (tournament.gameMode === 'SOLO') {
        if (tournament._count.teams >= tournament.maxTeams) {
          throw new BadRequestException('Tournament is full');
        }
      } else {
        const participants = await this.prisma.tournamentParticipant.findMany({
          where: { tournamentId, status: { notIn: ['CANCELLED', 'REJECTED'] } },
          select: { teamId: true },
        });
        const uniqueTeamIds = new Set(participants.map(p => p.teamId).filter((tid): tid is string => !!tid));
        if (teamId && !uniqueTeamIds.has(teamId) && uniqueTeamIds.size >= tournament.maxTeams) {
          throw new BadRequestException('Tournament is full');
        }
      }
    }

    // 3. Check Existing Registration
    const existing = await this.prisma.tournamentParticipant.findFirst({
      where: {
        userId,
        tournamentId,
        status: { notIn: ['CANCELLED', 'REJECTED'] },
      },
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

          // Deduct from User Wallet (Atomic with balance check)
          const updatedWallet = await tx.wallet.updateMany({
            where: { userId, balance: { gte: tournament.entryFeePerPerson } },
            data: { balance: { decrement: tournament.entryFeePerPerson } },
          });

          if (updatedWallet.count === 0) {
            throw new BadRequestException('Insufficient balance to join this tournament.');
          }

          // Record Transaction (Completed since it's already verified)
          await tx.transaction.create({
            data: {
              walletId: wallet?.id || '',
              amount: tournament.entryFeePerPerson,
              type: 'ENTRY_FEE',
              status: 'COMPLETED',
              reference: paymentReference,
              description: `Direct payment for ${tournament.title}`,
              metadata: JSON.stringify({ tournamentId, teamId }),
            },
          });

          // Add to Tournament
          const participant = await tx.tournamentParticipant.create({
            data: {
              userId,
              tournamentId,
              teamId,
              status,
              paymentStatus: 'PAID',
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
        // Deduct from User Wallet (Atomic with balance check)
        const updatedWallet = await tx.wallet.updateMany({
          where: { userId, balance: { gte: tournament.entryFeePerPerson } },
          data: { balance: { decrement: tournament.entryFeePerPerson } },
        });

        if (updatedWallet.count === 0) {
          throw new BadRequestException('Insufficient balance to join this tournament.');
        }

        // Record Transaction
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            amount: tournament.entryFeePerPerson,
            type: 'ENTRY_FEE',
            status: 'COMPLETED',
            description: `Entry fee for ${tournament.title}`,
            metadata: JSON.stringify({ tournamentId, teamId }),
          },
        });

        // Add to Tournament
        const participant = await tx.tournamentParticipant.create({
          data: {
            userId,
            tournamentId,
            teamId,
            status,
            paymentStatus: 'PAID',
          },
        });

        return participant;
      });
    }

    // 5. FREE Tournament Flow
    const participant = await this.prisma.tournamentParticipant.create({
      data: {
        userId,
        tournamentId,
        teamId,
        status,
        paymentStatus: 'PAID', // Technically ₹0 paid
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

  async refundParticipant(tournamentId: string, participantId: string, adminId: string, ip: string, refundToWallet: boolean = false) {
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

    const paymentId = participant.paymentId;
    const paymentMethod = paymentId?.startsWith('PAYPAL') ? 'PAYPAL' : 
                         paymentId?.startsWith('ORD') ? 'CASHFREE' : 'WALLET';

    // 1. PERFORM REFUND
    if (refundToWallet) {
        console.log(`[REFUND] Selective Refund: Crediting Wallet directly for user ${participant.userId}`);
        await this.walletService.refundTournamentEntry(
            participant.userId,
            amount,
            tournamentId,
            tournament.title,
            paymentId || undefined,
            true // Force wallet credit
        );
    } else if (paymentMethod === 'CASHFREE') {
        try {
            console.log(`[REFUND] Triggering Cashfree Gateway Refund for Order: ${paymentId}`);
            await this.paymentsService.createRefund(paymentId!, amount);
            
            await this.walletService.refundTournamentEntry(
                participant.userId,
                amount,
                tournamentId,
                tournament.title,
                paymentId!,
                false // allowBalanceUpdate = false for gateway refunds
            );
        } catch (err: any) {
            console.error('[REFUND ERROR] Cashfree refund failed! Falling back to Wallet Refund:', err.message);
            await this.walletService.refundTournamentEntry(
                participant.userId,
                amount,
                tournamentId,
                tournament.title,
                paymentId ?? undefined,
                true // fallback to wallet credit
            );
        }
    } else if (paymentMethod === 'PAYPAL') {
        try {
            console.log(`[REFUND] Triggering PayPal Gateway Refund for Capture: ${paymentId}`);
            // PayPal paymentId is stored as captureId in our system during registration
            await this.paypalService.refundCapture(paymentId!, amount, tournament.currency || 'INR');
            
            await this.walletService.refundTournamentEntry(
                participant.userId,
                amount,
                tournamentId,
                tournament.title,
                paymentId!,
                false
            );
        } catch (err: any) {
            console.error('[REFUND ERROR] PayPal refund failed! Falling back to Wallet Refund:', err.message);
            await this.walletService.refundTournamentEntry(
                participant.userId,
                amount,
                tournamentId,
                tournament.title,
                paymentId ?? undefined,
                true
            );
        }
    } else {
        // Standard Wallet Refund
        await this.walletService.refundTournamentEntry(
            participant.userId,
            amount,
            tournamentId,
            tournament.title,
            paymentId || undefined,
            true
        );
    }

    // 3. Update participant status to exit them
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
      where: {
        tournamentId,
        status: { notIn: ['CANCELLED', 'REJECTED'] },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
        team: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { teamId: 'asc' }, // Group by team first
        { registeredAt: 'desc' },
      ],
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

    // Mark as kicked (sets KICKED status for audit trail)
    const updated = await this.prisma.tournamentParticipant.update({
      where: { id: participantId },
      data: {
        status: 'KICKED',
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
