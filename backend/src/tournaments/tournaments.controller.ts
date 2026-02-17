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

@Controller('tournaments')
export class TournamentsController {
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
    private readonly paymentsService: PaymentsService,
    private readonly activityLogService: ActivityLogService,
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

    // Create Cashfree order
    const order = await this.paymentsService.createOrder(
      tournament.entryFeePerPerson,
      req.user.userId // Pass userId for Cashfree customer details
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
      await this.paymentsService.verifyPayment(
        body.orderId
      );

      // Deposit the verified amount into user's wallet so it can be deducted by registerUser
      // This ensures a complete transaction history (Money In -> Money Out)
      await this.walletService.deposit(
        req.user.userId,
        entryFee,
        'RAZORPAY',
        body.paymentId,
      );
    }

    // Register the user in the tournament (Will deduct fee from wallet)
    const result = await this.tournamentsService.registerUser(
      req.user.userId,
      id,
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
}
