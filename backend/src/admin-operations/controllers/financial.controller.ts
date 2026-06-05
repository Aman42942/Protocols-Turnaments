import { Controller, Get, Post, UseGuards, Query, Body, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { FinancialService } from '../services/financial.service';
import { Admin2faGuard } from '../../auth/admin-2fa.guard';

@Controller('admin-financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('ping')
  async ping() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard, Admin2faGuard)
  @Roles('ULTIMATE_ADMIN', 'SUPERADMIN', 'ADMIN')
  async getSummary() {
    return this.financialService.getFinancialSummary();
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard, Admin2faGuard)
  @Roles('ULTIMATE_ADMIN', 'SUPERADMIN', 'ADMIN')
  async getLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.financialService.getRevenueLogs(
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Post('withdraw')
  @UseGuards(JwtAuthGuard, RolesGuard, Admin2faGuard)
  @Roles('ULTIMATE_ADMIN')
  async withdraw(
    @Request() req,
    @Body() body: { amount: number; currency: string; method: string; payoutDetails: any; twoFactorToken: string },
  ) {
    const adminId = req.user.userId;
    return this.financialService.withdrawProfit(
      adminId,
      body.amount,
      body.currency,
      body.method,
      body.payoutDetails,
      body.twoFactorToken,
    );
  }

  @Post('settle-tax')
  @UseGuards(JwtAuthGuard, RolesGuard, Admin2faGuard)
  @Roles('ULTIMATE_ADMIN')
  async settleTax(
    @Request() req,
    @Body() body: { amount: number; currency: string; method: string; payoutDetails: any; twoFactorToken: string },
  ) {
    const adminId = req.user.userId;
    return this.financialService.settleTax(
      adminId,
      body.amount,
      body.currency,
      body.method,
      body.payoutDetails,
      body.twoFactorToken,
    );
  }
}
