import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  Param,
  Delete,
} from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { ActivityLogService } from '../activity-log/activity-log.service';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private walletService: WalletService,
    private readonly activityLogService: ActivityLogService,
  ) { }

  @Get()
  async getWallet(@Request() req) {
    return this.walletService.getWallet(req.user.userId);
  }

  // Get UPI details for QR code generation
  @Get('upi-details')
  async getUpiDetails() {
    return this.walletService.getUpiDetails();
  }

  // Submit a QR deposit with UTR number
  @Post('qr-deposit')
  async qrDeposit(
    @Request() req,
    @Body() body: { amount: number; utrNumber: string },
  ) {
    return this.walletService.createQrDeposit(
      req.user.userId,
      body.amount,
      body.utrNumber,
    );
  }

  @Post('deposit')
  async deposit(
    @Request() req,
    @Body() body: { amount: number; method?: string; reference?: string },
  ) {
    return this.walletService.deposit(
      req.user.userId,
      body.amount,
      body.method || 'UPI',
      body.reference,
    );
  }

  @Post('withdraw')
  async withdraw(
    @Request() req,
    @Body() body: { amount: number; method?: string },
  ) {
    return this.walletService.withdraw(
      req.user.userId,
      body.amount,
      body.method || 'BANK_TRANSFER',
    );
  }

  @Get('transactions')
  async getTransactions(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getTransactions(
      req.user.userId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  // ===== Admin Endpoints =====

  @Get('admin/pending')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getPendingDeposits() {
    return this.walletService.getPendingDeposits();
  }

  @Get('admin/all-transactions')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getAllTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getAllTransactions(
      Number(page) || 1,
      Number(limit) || 50,
    );
  }

  @Post('admin/approve/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async approveDeposit(@Param('id') id: string, @Request() req) {
    const result = await this.walletService.approveTransaction(id);
    await this.activityLogService.log(
      req.user.userId,
      'APPROVE_DEPOSIT',
      { amount: result.transaction.amount },
      id,
      req.ip,
    );
    return result;
  }

  @Post('admin/reject/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async rejectDeposit(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req,
  ) {
    const result = await this.walletService.rejectTransaction(id, body.reason);
    await this.activityLogService.log(
      req.user.userId,
      'REJECT_DEPOSIT',
      { reason: body.reason },
      id,
      req.ip,
    );
    return result;
  }
  @Get('admin/users/:userId/transactions')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getTransactionsForUser(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getTransactions(
      userId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Post('admin/upi-settings')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async updateUpiSettings(
    @Body() body: { upiId: string; merchantName: string },
    @Request() req,
  ) {
    const result = await this.walletService.updateUpiSettings(
      body.upiId,
      body.merchantName,
    );
    await this.activityLogService.log(
      req.user.userId,
      'UPDATE_UPI_SETTINGS',
      { upiId: body.upiId, merchantName: body.merchantName },
      undefined,
      req.ip,
    );
    return result;
  }

  @Post('admin/adjust-balance/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async adjustBalance(
    @Param('userId') userId: string,
    @Body() body: { amount: number; type: 'DEPOSIT' | 'WITHDRAWAL'; reason: string },
    @Request() req,
  ) {
    const result = await this.walletService.adjustBalance(
      userId,
      body.amount,
      body.type,
      body.reason,
      req.user.userId,
    );

    await this.activityLogService.log(
      req.user.userId,
      'ADJUST_WALLET_BALANCE',
      { targetUserId: userId, amount: body.amount, type: body.type, reason: body.reason },
      undefined,
      req.ip,
    );

    return result;
  }

  @Delete('admin/adjustment/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async deleteAdjustment(@Param('id') id: string, @Request() req) {
    const result = await this.walletService.deleteAdminAdjustment(id, req.user.userId);
    await this.activityLogService.log(
      req.user.userId,
      'DELETE_WALLET_ADJUSTMENT',
      { transactionId: id },
      id,
      req.ip,
    );
    return result;
  }
}
