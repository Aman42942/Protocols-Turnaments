import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CashfreePayoutsService } from '../../payments/cashfree-payouts.service';
import { PaypalPayoutsService } from '../../payments/paypal-payouts.service';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class FinancialService {
  private readonly logger = new Logger(FinancialService.name);

  constructor(
    private prisma: PrismaService,
    private payouts: CashfreePayoutsService,
    private paypalPayouts: PaypalPayoutsService,
    private authService: AuthService,
  ) { }

  /**
   * Track every bit of system revenue (Fees, TDS, etc.)
   */
  async trackRevenue(amount: number, type: 'PLATFORM_FEE' | 'TDS' | 'WITHDRAWAL_FEE' | 'AD_REVENUE', sourceId?: string, description?: string) {
    if (amount <= 0) return;

    try {
      await this.prisma.systemRevenue.create({
        data: {
          amount,
          type,
          sourceId,
          description,
        },
      });
      this.logger.log(`[REVENUE] Tracked ${type}: ₹${amount} | Source: ${sourceId || 'N/A'}`);
    } catch (error) {
      this.logger.error(`Failed to track revenue: ${error.message}`);
    }
  }

  /**
   * Get a comprehensive financial summary for the ULTIMATE_ADMIN
   */
  async getFinancialSummary() {
    // 1. Total Earnings by Type
    const revenueStats = await this.prisma.systemRevenue.groupBy({
      by: ['type'],
      _sum: { amount: true },
    });

    const earnings = {
      PLATFORM_FEE: 0,
      TDS: 0,
      WITHDRAWAL_FEE: 0,
      AD_REVENUE: 0,
      total: 0,
    };

    revenueStats.forEach((stat) => {
      earnings[stat.type] = stat._sum.amount || 0;
      if (stat.type !== 'OWNER_WITHDRAWAL' && stat.type !== 'TDS_SETTLEMENT') {
        earnings.total += stat._sum.amount || 0;
      }
    });

    // 1.1 Calculate Buckets
    const ownerWithdrawals = Math.abs(earnings['OWNER_WITHDRAWAL'] || 0);
    const tdsSettlements = Math.abs(earnings['TDS_SETTLEMENT'] || 0);

    const withdrawableProfit = (earnings.PLATFORM_FEE + earnings.WITHDRAWAL_FEE + earnings.AD_REVENUE) - ownerWithdrawals;
    const taxBalance = earnings.TDS - tdsSettlements;

    // 2. Current User Liability (Sum of all wallet balances)
    const walletAgg = await this.prisma.wallet.aggregate({
      _sum: { balance: true, frozenBalance: true },
    });
    const totalUserLiability = (walletAgg._sum.balance || 0) + (walletAgg._sum.frozenBalance || 0);

    // 3. Total Escrowed Funds (Prizes in LIVE/UPCOMING tournaments)
    const escrowAgg = await this.prisma.escrowPool.aggregate({
      where: { status: { in: ['OPEN', 'LOCKED'] } },
      _sum: { netPrizePool: true },
    });
    const totalEscrowLiability = escrowAgg._sum.netPrizePool || 0;

    // 4. Safety Audit: 
    // Ideally, the total cash in the bank account should be >= (totalUserLiability + totalEscrowLiability)
    // Here we provide the required coverage amount.
    const requiredLiquidFunds = totalUserLiability + totalEscrowLiability;

    // 5. Monthly Revenue Trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenue = await this.prisma.systemRevenue.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    return {
      earnings,
      buckets: {
        profit: Math.max(0, withdrawableProfit),
        tax: Math.max(0, taxBalance),
      },
      liabilities: {
        wallets: totalUserLiability,
        escrow: totalEscrowLiability,
        totalRequired: requiredLiquidFunds,
      },
      safetyStatus: 'STABLE', // Could be calculated if site bank balance was known
      dailyRevenueTrend: dailyRevenue,
    };
  }

  /**
   * Securely withdraw platform profit
   */
  async withdrawProfit(adminId: string, amount: number, currency: string, method: string, payoutDetails: any, twoFactorToken: string) {
    // 1. Military Grade: 2FA Verification
    const isAuth = await this.authService.verifyTOTP(adminId, twoFactorToken);
    if (!isAuth && process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Security Alert: Fresh 2FA code is mandatory for profit withdrawal.');
    }

    // 2. Safety Guardrail: Check Withdrawable Balance
    const summary = await this.getFinancialSummary();
    if (amount > summary.buckets.profit) {
      throw new BadRequestException(`Insufficient Profit: You only have ₹${summary.buckets.profit.toLocaleString()} withdrawable profit.`);
    }

    // 3. Trigger Payout
    const payoutRef = await this.executePayout(amount, currency, method, payoutDetails, adminId);

    // 4. Log Revenue Deduction
    return this.trackRevenue(
      -amount, 
      'OWNER_WITHDRAWAL' as any, 
      payoutRef, 
      `Owner Profit Withdrawal (${currency} ${amount}) - Ref: ${payoutRef}`
    );
  }

  /**
   * Settle TDS with Government
   */
  async settleTax(adminId: string, amount: number, currency: string, method: string, payoutDetails: any, twoFactorToken: string) {
    const isAuth = await this.authService.verifyTOTP(adminId, twoFactorToken);
    if (!isAuth && process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Security Alert: Fresh 2FA code is mandatory for tax settlement.');
    }

    const summary = await this.getFinancialSummary();
    if (amount > summary.buckets.tax) {
      throw new BadRequestException(`Insufficient Tax Reserves: You only have ₹${summary.buckets.tax.toLocaleString()} in the tax bucket.`);
    }

    const payoutRef = await this.executePayout(amount, currency, method, payoutDetails, adminId);

    return this.trackRevenue(
      -amount, 
      'TDS_SETTLEMENT' as any, 
      payoutRef, 
      `Government TDS Settlement (${currency} ${amount}) - Ref: ${payoutRef}`
    );
  }

  private async executePayout(amount: number, currency: string, method: string, details: any, adminId: string) {
    const transferId = `ADM_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    try {
      if (currency === 'INR') {
        const res = await this.payouts.requestTransfer({
          transferId,
          amount,
          name: 'Platform Owner',
          email: 'admin@protocol.com',
          phone: '9999999999',
          vpa: details.upiId,
          transferMode: 'upi',
          remark: 'Admin Profit Withdrawal',
        });
        return res.cf_transfer_id || transferId;
      } else {
        const res = await this.paypalPayouts.sendPayout({
          paypalEmail: details.paypalEmail,
          amount,
          currency: currency as any,
          senderItemId: transferId,
          note: 'Admin Profit Withdrawal',
        });
        return res.batchId || transferId;
      }
    } catch (error) {
      this.logger.error(`Payout execution failed: ${error.message}`);
      throw new BadRequestException(`Payout failed: ${error.message}`);
    }
  }

  async getRevenueLogs(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.systemRevenue.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.systemRevenue.count(),
    ]);

    return { logs, total, page, totalPages: Math.ceil(total / limit) };
  }
}
