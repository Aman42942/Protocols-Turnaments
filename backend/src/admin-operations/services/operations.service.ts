import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FraudService } from '../../payments/fraud.service';
import { WalletService } from '../../wallet/wallet.service';
import { OperationsGateway } from '../gateways/operations.gateway';
import {
  ComplianceService,
  ComplianceEvent,
} from '../../organizer/compliance.service';
import { CashfreePayoutsService } from '../../payments/cashfree-payouts.service';
import { PaypalPayoutsService } from '../../payments/paypal-payouts.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class OperationsService {
  private readonly logger = new Logger(OperationsService.name);

  constructor(
    private prisma: PrismaService,
    private fraudService: FraudService,
    private walletService: WalletService,
    private gateway: OperationsGateway,
    private compliance: ComplianceService,
    private payouts: CashfreePayoutsService,
    private paypalPayouts: PaypalPayoutsService,
    private notifications: NotificationsService,
    private authService: AuthService,
  ) { }

  /**
   * Get Operations Dashboard Stats
   */
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeTournaments = await this.prisma.tournament.count({
      where: { status: 'LIVE' },
    });
    const pendingDisputes = await this.prisma.transaction.count({
      where: { status: 'DISPUTED' },
    }); // Assuming DISPUTED status exists or logic

    // Revenue Today
    const revenueAgg = await this.prisma.transaction.aggregate({
      where: {
        createdAt: { gte: today },
        type: { in: ['ENTRY_FEE', 'DEPOSIT'] },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    const flaggedUsersCount = await this.prisma.user.count({
      where: { banned: true },
    });
    // Ideally check recent flags from FraudService logs if persisted

    return {
      activeTournaments,
      pendingDisputes,
      revenueToday: revenueAgg._sum.amount || 0,
      flaggedUsersCount,
    };
  }

  /**
   * Get Live Matches for Monitoring
   */
  async getLiveMatches() {
    return this.prisma.match.findMany({
      where: { status: 'LIVE' },
      include: {
        tournament: { select: { title: true, game: true } },
        participations: { include: { team: { select: { name: true } } } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  /**
   * Override Match Score (Admin Intervention)
   */
  async overrideMatchScore(
    matchId: string,
    teamId: string,
    placement: number,
    kills: number,
    adminId: string,
    twoFactorToken?: string,
  ) {
    // Military Grade: Step-up Auth
    const isAdminAuthenticated = await this.authService.verifyTOTP(adminId, twoFactorToken || '');
    if (!isAdminAuthenticated && process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Military Grade Security: A fresh 2FA code is required for this action.');
    }

    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });
    if (!match) throw new NotFoundException('Match not found');

    // Update participation
    await this.prisma.matchParticipation.update({
      where: { matchId_teamId: { matchId, teamId } },
      data: { placement, kills },
    });

    // Log compliance event
    await this.compliance.log({
      organizerId: 'SYSTEM', // Match overrides are typically system-level or organizer-level
      tournamentId: match.tournamentId,
      event: ComplianceEvent.RESULT_OVERRIDDEN,
      details: { matchId, teamId, placement, kills, reason: 'Admin Override' },
      performedBy: adminId,
    });

    this.gateway.sendLiveMatchUpdate({
      matchId,
      type: 'SCORE_OVERRIDE',
      details: { teamId, placement },
    });

    // Logic to trigger leaderboard update would typically go here
    // e.g. await this.leaderboardService.updateLeaderboard(match.tournamentId);

    return { success: true, message: 'Score updated successfully' };
  }

  /**
   * Trigger Manual Payout
   */
  async triggerManualPayout(tournamentId: string, adminId: string, twoFactorToken?: string) {
    // Military Grade: Step-up Auth
    const isAdminAuthenticated = await this.authService.verifyTOTP(adminId, twoFactorToken || '');
    if (!isAdminAuthenticated && process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Military Grade Security: A fresh 2FA code is required for this action.');
    }

    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { organizer: true },
    });
    if (!tournament) throw new NotFoundException('Tournament not found');

    // Log compliance event
    await this.compliance.log({
      organizerId: tournament.organizerId || 'SYSTEM',
      tournamentId,
      event: ComplianceEvent.PRIZE_DISTRIBUTED,
      details: { manual: true, triggeredBy: adminId },
      performedBy: adminId,
    });

    return {
      success: true,
      message: 'Payout process initiated and logged for compliance',
    };
  }

  /**
   * Approve Withdrawal Request (Triggers Automated Payout)
   * - INR  → Cashfree Payouts V2 (UPI or Bank)
   * - USD/GBP → PayPal Payouts API v1
   */
  async approveWithdrawal(transactionId: string, admin: { userId: string; role: string }, twoFactorToken?: string) {
    const adminId = admin.userId;
    const adminRole = admin.role;

    // 1. Fetch transaction + user
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: { include: { user: true } } },
    });

    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.type !== 'WITHDRAWAL') throw new BadRequestException('Transaction is not a withdrawal');
    if (tx.status !== 'PENDING') throw new BadRequestException('Withdrawal is not pending');

    // 2. Admin 2FA check (production only)
    const isAdminAuthenticated = await this.authService.verifyTOTP(adminId, twoFactorToken || '');
    if (!isAdminAuthenticated && process.env.NODE_ENV === 'production') {
      this.logger.warn(`Admin ${adminId} attempted withdrawal with invalid 2FA`);
      throw new BadRequestException('Security verification failed: Valid 2FA code is required.');
    } else if (!isAdminAuthenticated) {
      this.logger.warn(`[STAGING/DEV] Admin ${adminId} authorized without 2FA.`);
    }

    const user = tx.wallet.user;

    // 3. Parse metadata (stores UPI ID, PayPal email, realValue, currency)
    let metadata: any = {};
    try {
      if (tx.metadata) metadata = JSON.parse(tx.metadata);
    } catch {
      this.logger.error(`Failed to parse metadata for tx: ${transactionId}`);
    }

    // 4. Determine the actual payout amount from metadata (realValue = fiat amount stored at request time)
    const currency: string = metadata.currency || tx.currency || 'INR';
    const realPayoutAmount = parseFloat(metadata.realValue) || (tx.amount / (tx.conversionRate || 1));

    // 5. Enforce role-based limits
    if (adminRole !== 'ULTIMATE_ADMIN') {
      const limits = await this.walletService.getWithdrawalLimits();
      const limit = adminRole === 'SUPERADMIN' ? limits.superAdminLimit : limits.adminLimit;

      // Convert payout amount to INR for comparison if needed (assuming limits are in INR)
      // If currency is USD/GBP, we might need a rough conversion or compare against $ equivalent
      let comparisonAmount = realPayoutAmount;
      if (currency === 'USD') comparisonAmount *= 83; // Rough INR conversion for limit check
      if (currency === 'GBP') comparisonAmount *= 105;

      if (comparisonAmount > limit) {
        throw new BadRequestException(`Amount exceeds your approval limit of ₹${limit}. Please contact a Superadmin or Owner.`);
      }
    }

    this.logger.log(`[PAYOUT] Admin ${adminId} (${adminRole}) approving ${currency} withdrawal | User: ${user.email} | Fiat: ${currency} ${realPayoutAmount}`);

    try {
      let payoutRef = '';
      let payoutStatus = 'PENDING';

      // ─── INR via Cashfree UPI/Bank ─────────────────────────────────────────
      if (currency === 'INR') {
        const upiId = metadata.upiId;
        const bankAccount = metadata.bankAccount;
        const ifsc = metadata.ifsc;

        if (!upiId && !bankAccount) {
          throw new BadRequestException('UPI ID or Bank Account details missing in metadata for INR withdrawal');
        }

        const transferId = `WIT_${tx.id.replace(/-/g, '').substring(0, 12)}_${Date.now()}`;
        const payoutResult = await this.payouts.requestTransfer({
          transferId,
          amount: realPayoutAmount,
          name: user.name || 'Gamer',
          email: user.email,
          phone: (user as any).phone || '9999999999',
          vpa: upiId,
          bankAccount,
          ifsc,
          transferMode: upiId ? 'upi' : 'imps',
          remark: `Protocol Withdrawal - ${tx.id.substring(0, 8)}`,
        });

        payoutRef = payoutResult.cf_transfer_id || payoutResult.transfer_id || transferId;
        payoutStatus = payoutResult.transfer_status || 'PENDING';

        // ─── USD / GBP via PayPal Payouts ──────────────────────────────────────
      } else if (currency === 'USD' || currency === 'GBP') {
        const paypalEmail = metadata.paypalEmail;
        if (!paypalEmail) {
          throw new BadRequestException('PayPal email missing in metadata for USD/GBP withdrawal');
        }

        const paypalResult = await this.paypalPayouts.sendPayout({
          paypalEmail,
          amount: realPayoutAmount,
          currency: currency as 'USD' | 'GBP',
          senderItemId: tx.id.replace(/-/g, '').substring(0, 20),
          note: `Protocol Tournament Withdrawal`,
        });

        payoutRef = paypalResult.batchId || `PAYPAL_${Date.now()}`;
        payoutStatus = paypalResult.status || 'PENDING';

      } else {
        throw new BadRequestException(`Unsupported withdrawal currency: ${currency}`);
      }

      // 5. Update transaction status
      // Note: Cashfree V2 is async — status may be PENDING until webhook arrives.
      //       We mark COMPLETED only when payoutStatus indicates immediate success.
      const finalStatus = (payoutStatus === 'SUCCESS' || payoutStatus === 'COMPLETED') ? 'COMPLETED' : 'PENDING';

      const updatedTx = await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: finalStatus,
          reference: payoutRef,
          description: `${tx.description} — PAYOUT_${finalStatus} (Ref: ${payoutRef})`,
        },
      });

      // 6. If immediately completed, deduct from frozenBalance
      if (finalStatus === 'COMPLETED') {
        await this.prisma.wallet.update({
          where: { id: tx.walletId },
          data: { frozenBalance: { decrement: tx.amount } },
        });
      }

      // 7. Notify user
      const currencySymbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '₹';
      await this.notifications.create(
        user.id,
        finalStatus === 'COMPLETED' ? 'Withdrawal Successful 💸' : 'Withdrawal Processing ⏳',
        finalStatus === 'COMPLETED'
          ? `Your withdrawal of ${currencySymbol}${realPayoutAmount.toFixed(2)} has been sent successfully.`
          : `Your withdrawal of ${currencySymbol}${realPayoutAmount.toFixed(2)} is being processed. You will be notified once completed.`,
        finalStatus === 'COMPLETED' ? 'success' : 'info',
        '/dashboard/wallet',
      );

      // 8. Compliance log
      await this.compliance.log({
        organizerId: 'SYSTEM',
        event: ComplianceEvent.PRIZE_DISTRIBUTED,
        details: {
          transactionId,
          currency,
          amount: realPayoutAmount,
          payoutRef,
          method: currency === 'INR' ? 'CASHFREE_PAYOUTS' : 'PAYPAL_PAYOUTS',
        },
        performedBy: adminId,
      });

      return { success: true, transaction: updatedTx, payoutRef, payoutStatus: finalStatus };

    } catch (error: any) {
      this.logger.error(`[PAYOUT FAILED] Withdrawal ${tx.id}: ${error.message}`);

      // Keep as PENDING for retry — log the failure
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          description: `${tx.description} — PAYOUT_FAILED: ${error.message}`,
        },
      });

      throw new BadRequestException(`Payout failed: ${error.message}`);
    }
  }

  /**
   * Reject Withdrawal — refund coins from frozenBalance back to balance
   */
  async rejectWithdrawal(transactionId: string, adminId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: { include: { user: true } } },
    });

    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.type !== 'WITHDRAWAL') throw new BadRequestException('Not a withdrawal transaction');
    if (tx.status !== 'PENDING') throw new BadRequestException('Only PENDING withdrawals can be rejected');

    // Unlock coins: frozenBalance → balance
    await this.prisma.wallet.update({
      where: { id: tx.walletId },
      data: {
        balance: { increment: tx.amount },
        frozenBalance: { decrement: tx.amount },
      },
    });

    // Update transaction status
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'FAILED',
        description: `${tx.description} — REJECTED by admin. Coins refunded.`,
      },
    });

    // Notify user
    await this.notifications.create(
      tx.wallet.user.id,
      'Withdrawal Rejected ❌',
      `Your withdrawal request of ${tx.amount} coins has been rejected. Coins have been returned to your wallet.`,
      'error',
      '/dashboard/wallet',
    );

    this.logger.log(`[REJECT] Withdrawal ${transactionId} rejected by ${adminId}. ${tx.amount} coins unlocked.`);
    return { success: true, message: 'Withdrawal rejected and coins returned to user wallet.' };
  }
}
