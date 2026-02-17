import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { WalletService } from './wallet.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Controller('admin/transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminTransactionsController {
  constructor(
    private readonly walletService: WalletService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Get()
  async getAllTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.walletService.getAllTransactions(
      Number(page) || 1,
      Number(limit) || 100,
    );

    // Flatten the user data for the frontend
    return result.transactions.map((tx) => ({
      ...tx,
      user: tx.wallet?.user,
      wallet: undefined, // Remove nested wallet once user is extracted
    }));
  }

  @Post(':id/approve')
  async approveTransaction(@Param('id') id: string, @Request() req) {
    const result = await this.walletService.approveTransaction(id);
    await this.activityLogService.log(
      req.user.userId,
      'APPROVE_TRANSACTION',
      { txId: id, amount: result.transaction.amount },
      id,
      req.ip,
    );
    return result;
  }

  @Post(':id/reject')
  async rejectTransaction(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    const result = await this.walletService.rejectTransaction(id, reason);
    await this.activityLogService.log(
      req.user.userId,
      'REJECT_TRANSACTION',
      { txId: id, reason },
      id,
      req.ip,
    );
    return result;
  }
}
