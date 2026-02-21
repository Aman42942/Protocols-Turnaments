import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ComplianceService — India Skill-Gaming Compliance
 *
 * Under India's skill-gaming framework, it is critical to:
 * 1. Prove game outcome is based on skill (not chance)
 * 2. Maintain immutable audit trails for all financial transactions
 * 3. Show proper PAN/GST collection for payouts > ₹10,000
 * 4. Generate TDS-compliant reports for prize distributions
 *
 * This service creates immutable compliance logs for every key event.
 */
@Injectable()
export class ComplianceService {
    private readonly logger = new Logger(ComplianceService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Log any compliance-relevant event.
     * Called from EscrowService, ResultLockService, and PayoutService.
     */
    async log(params: {
        organizerId: string;
        tournamentId?: string;
        event: ComplianceEvent;
        details: Record<string, unknown>;
        performedBy: string;
        ipAddress?: string;
    }): Promise<void> {
        try {
            await this.prisma.complianceAuditLog.create({
                data: {
                    organizerId: params.organizerId,
                    tournamentId: params.tournamentId,
                    event: params.event,
                    details: JSON.stringify(params.details),
                    performedBy: params.performedBy,
                    ipAddress: params.ipAddress,
                },
            });
        } catch (err) {
            // Never let compliance logging break the main flow
            this.logger.error(`Failed to write compliance log: ${err.message}`);
        }
    }

    /**
     * Get full compliance audit trail for an organizer.
     * Used for TDS/GST reports and legal audits.
     */
    async getAuditTrail(organizerId: string, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            this.prisma.complianceAuditLog.findMany({
                where: { organizerId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.complianceAuditLog.count({ where: { organizerId } }),
        ]);
        return { logs, total, page, pages: Math.ceil(total / limit) };
    }

    /**
     * Generate TDS summary for organizer (prizes paid > ₹10,000 require TDS @ 30%).
     * Returns list of winners and taxable amounts for each tournament.
     */
    async getTdsSummary(organizerId: string, fromDate: Date, toDate: Date) {
        const logs = await this.prisma.complianceAuditLog.findMany({
            where: {
                organizerId,
                event: ComplianceEvent.PRIZE_DISTRIBUTED,
                createdAt: { gte: fromDate, lte: toDate },
            },
        });

        const summary: Array<{
            tournamentId: string;
            userId: string;
            grossAmount: number;
            tdsAmount: number;
            netAmount: number;
        }> = [];

        for (const log of logs) {
            const details = JSON.parse(log.details) as {
                winners?: Array<{ userId: string; amount: number }>;
                tournamentId?: string;
            };

            if (details.winners) {
                for (const winner of details.winners) {
                    if (winner.amount > 10000) {
                        const tds = winner.amount * 0.3; // 30% TDS under section 194B
                        summary.push({
                            tournamentId: log.tournamentId ?? '',
                            userId: winner.userId,
                            grossAmount: winner.amount,
                            tdsAmount: tds,
                            netAmount: winner.amount - tds,
                        });
                    }
                }
            }
        }

        return {
            period: { from: fromDate, to: toDate },
            totalTaxable: summary.length,
            totalTds: summary.reduce((s, r) => s + r.tdsAmount, 0),
            records: summary,
        };
    }
}

export enum ComplianceEvent {
    ORGANIZER_CREATED = 'ORGANIZER_CREATED',
    TOURNAMENT_CREATED = 'TOURNAMENT_CREATED',
    RESULT_LOCKED = 'RESULT_LOCKED',
    RESULT_OVERRIDDEN = 'RESULT_OVERRIDDEN',
    PRIZE_DISTRIBUTED = 'PRIZE_DISTRIBUTED',
    REFUND_ISSUED = 'REFUND_ISSUED',
    POOL_LOCKED = 'POOL_LOCKED',
    PLAYER_REGISTERED = 'PLAYER_REGISTERED',
    ORGANIZER_VERIFIED = 'ORGANIZER_VERIFIED',
    ORGANIZER_SUSPENDED = 'ORGANIZER_SUSPENDED',
}
