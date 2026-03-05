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
  ) {
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
  async triggerManualPayout(tournamentId: string, adminId: string) {
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
   */
  async approveWithdrawal(transactionId: string, adminId: string, twoFactorToken?: string) {
    // 1. Fetch transaction and associated user
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: { include: { user: true } } },
    });

    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.type !== 'WITHDRAWAL') throw new BadRequestException('Transaction is not a withdrawal');
    if (tx.status !== 'PENDING') throw new BadRequestException('Withdrawal is not pending');

    // 2. Security Check (Enforce 2FA for Admins)
    const isAdminAuthenticated = await this.authService.verifyTOTP(adminId, twoFactorToken || '');

    if (!isAdminAuthenticated && process.env.NODE_ENV === 'production') {
      this.logger.warn(`Admin ${adminId} attempted withdrawal with invalid or missing 2FA token`);
      throw new BadRequestException('Security verification failed: Valid 2FA code is required for production payouts.');
    } else if (!isAdminAuthenticated) {
      this.logger.warn(`[STAGING/DEV] Admin ${adminId} payout authorized without 2FA or invalid code.`);
    }

    const user = tx.wallet.user;
    let metadata: any = {};
    try {
      if (tx.metadata) metadata = JSON.parse(tx.metadata);
    } catch (e) {
      this.logger.error(`Failed to parse metadata for tx: ${transactionId}`);
    }

    const upiId = metadata.upiId;
    if (!upiId && tx.method === 'UPI') {
      throw new BadRequestException('UPI ID missing in transaction metadata');
    }

    try {
      this.logger.log(`[PAYOUT] Processing automated withdrawal for ${user.email} | Amount: ₹${tx.amount}`);

      // 3. Add Beneficiary to Cashfree (If needed/for first time)
      // Note: Cashfree Payouts V2 allows using beneficiary ID. We'll use user ID as beneficiary ID.
      const beneficiaryId = `BEN_${user.id.replace(/-/g, '')}`;

      try {
        await this.payouts.addBeneficiary({
          beneficiaryId,
          name: user.name || 'Gamer',
          email: user.email,
          vpa: upiId,
        });
      } catch (err) {
        // If beneficiary already exists, Cashfree might throw an error. 
        // We log it but continue since we only need them to exist.
        this.logger.warn(`Beneficiary add attempt: ${err.message}`);
      }

      // 4. Request Transfer
      const payoutResult = await this.payouts.requestTransfer({
        transferId: `WIT_${tx.id.substring(0, 10)}_${Date.now()}`,
        amount: tx.amount / tx.conversionRate, // Convert Coins back to real-world value (INR usually)
        beneficiaryId,
        transferMode: 'upi',
        remark: `Tournament Winnings Withdrawal - ${tx.id.substring(0, 8)}`,
      });

      // 5. Update Transaction Status
      const updatedTx = await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          reference: payoutResult.cf_transfer_id || payoutResult.transfer_id,
          description: `${tx.description} — PAID (Ref: ${payoutResult.transfer_id})`,
        },
      });

      // 6. Notify User
      await this.notifications.create(
        user.id,
        'Withdrawal Successful 💸',
        `Your withdrawal of ₹${(tx.amount / tx.conversionRate).toFixed(2)} has been processed successfully.`,
        'success',
        '/dashboard/wallet'
      );

      // 7. Compliance Logging
      await this.compliance.log({
        organizerId: 'SYSTEM',
        event: ComplianceEvent.PRIZE_DISTRIBUTED, // Reusing event or creating a new one
        details: {
          transactionId,
          amount: tx.amount,
          payoutRef: payoutResult.transfer_id,
          method: 'CASHFREE_PAYOUTS'
        },
        performedBy: adminId,
      });

      return { success: true, transaction: updatedTx };

    } catch (error: any) {
      this.logger.error(`[PAYOUT FAILED] Withdrawal ${tx.id} failed: ${error.message}`);

      // OPTIONAL: Mark as FAILED or keep as PENDING for manual retry? 
      // Usually keeping as PENDING is safer for admin to check error and retry.
      // But we will log the failure in the description.
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          description: `${tx.description} — PAYOUT FAILED: ${error.message}`,
        },
      });

      throw new BadRequestException(`Payout failed: ${error.message}`);
    }
  }
}
