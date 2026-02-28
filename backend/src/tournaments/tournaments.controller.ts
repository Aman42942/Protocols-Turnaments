import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import {
  ComplianceService,
  ComplianceEvent,
} from '../organizer/compliance.service';
import { UsersService } from '../users/users.service';

@Controller('tournaments')
export class TournamentsController {
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
    private readonly paymentsService: PaymentsService,
    private readonly activityLogService: ActivityLogService,
    private readonly complianceService: ComplianceService,
    private readonly usersService: UsersService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(
    @Body() createTournamentDto: CreateTournamentDto,
    @Request() req,
  ) {
    const tournament =
      await this.tournamentsService.create(createTournamentDto);
    await this.activityLogService.log(
      req.user.userId,
      'CREATE_TOURNAMENT',
      { title: tournament.title },
      tournament.id,
      req.ip,
    );
    return tournament;
  }

  @Get()
  findAll() {
    return this.tournamentsService.findAll();
  }

  @Get('share/:shareCode')
  async findByShareCode(@Param('shareCode') shareCode: string) {
    const tournament = await this.tournamentsService.findByShareCode(shareCode);
    if (!tournament) throw new BadRequestException('Tournament not found');
    return tournament;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tournamentsService.findOne(id);
  }

  // --- SECURE CREDENTIALS ACCESS (Ghost Data Rule) ---
  @UseGuards(JwtAuthGuard)
  @Get(':id/credentials')
  async getCredentials(@Param('id') id: string, @Request() req) {
    return this.tournamentsService.getCredentials(id, req.user.userId);
  }

  //  // Create payment order for tournament (Cashfree)
  @UseGuards(JwtAuthGuard)
  @Post(':id/create-order')
  async createOrder(@Request() req, @Param('id') id: string) {
    const tournament = await this.tournamentsService.findOne(id);
    if (!tournament) throw new BadRequestException('Tournament not found');

    // Free tournament
    if (!tournament.entryFeePerPerson || tournament.entryFeePerPerson <= 0) {
      return { amount: 0, orderId: null }; // Free tournament
    }

    // Create Cashfree order with real user details
    const user = await this.usersService.findById(req.user.userId);
    const order = await this.paymentsService.createOrder(
      tournament.entryFeePerPerson,
      req.user.userId,
      user?.email,
      undefined,
    );
    return order;
  }

  // --- REGISTER WITH PAYMENT VERIFICATION ---
  @UseGuards(JwtAuthGuard)
  @Post(':id/register')
  async register(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { paymentId?: string; orderId?: string; signature?: string },
  ) {
    const tournament = await this.tournamentsService.findOne(id);
    if (!tournament) throw new BadRequestException('Tournament not found');

    const entryFee = tournament.entryFeePerPerson || 0;

    // Verify payment if entry fee exists
    if (entryFee > 0) {
      if (!body.paymentId || !body.orderId || !body.signature) {
        throw new BadRequestException(
          'Payment details missing. Please complete payment first.',
        );
      }

      // Verify payment with Cashfree
      await this.paymentsService.verifyPayment(body.orderId);

      // Deposit the verified amount into user's wallet so it can be deducted by registerUser
      // This ensures a complete transaction history (Money In -> Money Out)
      await this.walletService.deposit(
        req.user.userId,
        entryFee,
        'CASHFREE', // Using CASHFREE label as per PaymentsService implementation
        body.paymentId,
        JSON.stringify({ tournamentId: id }),
      );
    }

    // Register the user in the tournament (Will deduct fee from wallet or use provided payment)
    const result = await this.tournamentsService.registerUser(
      req.user.userId,
      id,
      body.paymentId || body.orderId // Pass payment reference if direct
    );

    // Send confirmation notification
    await this.notificationsService.create(
      req.user.userId,
      'Registration Confirmed ✅',
      `You've registered for "${tournament.title}". You will be added to the group soon.`,
      'success',
      `/tournaments/${id}`,
    );

    return {
      success: true,
      message: `Successfully registered for ${tournament.title}`,
      shareCode: tournament.shareCode,
      ...result,
    };
  }

  // ─── ADMIN: List all participants ──────────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id/participants')
  async getParticipants(@Param('id') id: string) {
    return this.tournamentsService.getParticipants(id);
  }

  // ─── ADMIN: Kick / remove a fraudulent participant ──────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id/participants/:pId/kick')
  async kickParticipant(
    @Param('id') tournamentId: string,
    @Param('pId') participantId: string,
    @Body() body: { reason?: string },
    @Request() req,
  ) {
    const result = await this.tournamentsService.kickParticipant(
      tournamentId,
      participantId,
      body.reason || 'Fraudulent registration — removed by admin',
    );

    await this.activityLogService.log(
      req.user.userId,
      'KICK_PARTICIPANT',
      { participantId, reason: body.reason || 'Fraud / No payment' },
      tournamentId,
      req.ip,
    );

    return result;
  }

  @Post(':id/upi-payment')
  @UseGuards(JwtAuthGuard)
  async submitUpiPayment(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { amount: number },
  ) {
    const tournament = await this.tournamentsService.findOne(id);
    if (!tournament) throw new BadRequestException('Tournament not found');

    // ✅ PAYMENT VALIDATION: Reject if tournament has an entry fee but amount doesn't match
    const expectedFee = tournament.entryFeePerPerson || 0;
    if (expectedFee > 0) {
      if (!body.amount || body.amount <= 0) {
        throw new BadRequestException(
          'Payment amount is required for this tournament.',
        );
      }
      if (Math.abs(body.amount - expectedFee) > 0.01) {
        throw new BadRequestException(
          `Payment amount (₹${body.amount}) does not match tournament entry fee (₹${expectedFee}). Registration denied.`,
        );
      }
    } else {
      // Free tournament — do not accept payments, just register
      const participant = await this.tournamentsService.registerUser(
        req.user.userId,
        id,
        undefined,
        'APPROVED',
      );
      await this.notificationsService.create(
        req.user.userId,
        'Registration Confirmed ✅',
        `You've successfully registered for "${tournament.title}". You will be added to the group soon.`,
        'success',
        `/tournaments/${id}`,
      );
      return { success: true, message: 'Registered for free tournament.', participant };
    }

    // Generate a server-side transaction reference (cannot be forged by client)
    const serverTxnRef = `UPI-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;

    // Create a pending transaction for admin verification, linked to this tournament
    const transaction = await this.walletService.createQrDeposit(
      req.user.userId,
      body.amount,
      serverTxnRef,
      JSON.stringify({ tournamentId: id }),
    );

    // Register with APPROVED status (instant UX) — admin can audit the transaction separately
    await this.tournamentsService.registerUser(
      req.user.userId,
      id,
      serverTxnRef,
      'APPROVED',
    );

    // Send confirmation notification
    await this.notificationsService.create(
      req.user.userId,
      'Registration Confirmed ✅',
      `You've successfully registered for "${tournament.title}". You will be added to the group soon.`,
      'success',
      `/tournaments/${id}`,
    );

    // Compliance logging
    await this.complianceService.log({
      organizerId: tournament.organizerId || 'PLATFORM',
      tournamentId: tournament.id,
      event: ComplianceEvent.PLAYER_REGISTERED,
      details: {
        userId: req.user.userId,
        method: 'UPI_DIRECT',
        transactionRef: serverTxnRef,
        amount: body.amount,
        status: 'APPROVED',
      },
      performedBy: req.user.userId,
      ipAddress: req.ip,
    });

    return {
      success: true,
      message: 'Payment recorded! You are now registered for the tournament.',
      reference: serverTxnRef,
      transaction: transaction.transaction,
    };
  }

  // --- UPDATE ROOM CREDENTIALS (Admin) ---
  // --- UPDATE ROOM CREDENTIALS (Admin) ---
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/room')
  async updateRoom(
    @Param('id') id: string,
    @Body() body: { roomId: string; roomPassword: string },
    @Request() req,
  ) {
    const result = await this.tournamentsService.updateRoomCredentials(
      id,
      body.roomId,
      body.roomPassword,
    );
    await this.activityLogService.log(
      req.user.userId,
      'UPDATE_ROOM_CREDENTIALS',
      { roomId: body.roomId },
      id,
      req.ip,
    );
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
    @Request() req,
  ) {
    const result = await this.tournamentsService.update(
      id,
      updateTournamentDto,
    );
    await this.activityLogService.log(
      req.user.userId,
      'UPDATE_TOURNAMENT',
      null,
      id,
      req.ip,
    );
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.tournamentsService.remove(id);
    await this.activityLogService.log(
      req.user.userId,
      'DELETE_TOURNAMENT',
      null,
      id,
      req.ip,
    );
    return result;
  }

  @Post(':id/participants/:participantId/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async refundParticipant(
    @Param('id') tournamentId: string,
    @Param('participantId') participantId: string,
    @Request() req,
  ) {
    const result = await this.tournamentsService.refundParticipant(
      tournamentId,
      participantId,
      req.user.userId,
      req.ip,
    );

    await this.activityLogService.log(
      req.user.userId,
      'REFUND_PARTICIPANT',
      {
        tournamentTitle: result.tournamentTitle,
        amount: result.amount,
        userId: result.userId,
      },
      tournamentId,
      req.ip,
    );

    return {
      success: true,
      message: `Refunded ₹${result.amount} to user successfully.`,
      participant: result.updatedParticipant,
    };
  }

  @Post('admin/refund/:transactionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async refundTransaction(
    @Param('transactionId') transactionId: string,
    @Request() req,
  ) {
    const transaction = await this.walletService.getTransactionById(transactionId);
    if (!transaction) throw new BadRequestException('Transaction not found');
    if (transaction.status !== 'COMPLETED') throw new BadRequestException('Only completed transactions can be refunded');
    if (transaction.type !== 'DEPOSIT' && transaction.type !== 'ENTRY_FEE') throw new BadRequestException('Only deposits or entry fees can be refunded');

    let tournamentId: string | undefined;
    if (transaction.metadata) {
      try {
        const meta = JSON.parse(transaction.metadata);
        tournamentId = meta.tournamentId;
      } catch (e) {
        // Ignore
      }
    }

    if (!tournamentId) {
      throw new BadRequestException('This transaction is not linked to any tournament metadata.');
    }

    // Find the participant
    const participant = await this.tournamentsService.findParticipant(
      transaction.wallet.userId,
      tournamentId,
    );

    if (!participant) {
      throw new BadRequestException('No active paid registration found for this user in the linked tournament.');
    }

    return this.refundParticipant(tournamentId, participant.id, req);
  }
}
