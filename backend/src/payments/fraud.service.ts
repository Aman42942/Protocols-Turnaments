import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Check for duplicate payment references (Replay Attack Prevention)
   */
  async isReferenceDuplicate(reference: string): Promise<boolean> {
    if (!reference) return false;
    const count = await this.prisma.transaction.count({
      where: { reference: reference.trim(), status: 'COMPLETED' },
    });
    return count > 0;
  }

  /**
   * Detect Suspicious Activity
   * - High volume of small deposits
   * - Rapid withdrawals
   */
  async checkSuspiciousActivity(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyTxCount = await this.prisma.transaction.count({
      where: {
        wallet: { userId },
        createdAt: { gte: today },
      },
    });

    if (dailyTxCount > 20) {
      this.logger.warn(
        `Potential spam/fraud detected for user ${userId}: ${dailyTxCount} transactions today.`,
      );
      // Could trigger an alert or lock account
      return { flagged: true, reason: 'High transaction volume' };
    }

    return { flagged: false };
  }
}
