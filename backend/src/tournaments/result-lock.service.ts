import {
    Injectable,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResultLockService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Lock a match result after submission.
     * Once locked, the result cannot be changed without a SUPERADMIN override.
     */
    async lockResult(matchId: string, adminId: string) {
        const existing = await this.prisma.resultLock.findUnique({
            where: { matchId },
        });

        if (existing && !existing.isOverridden) {
            throw new ForbiddenException(
                'Result is already locked. Contact a SUPERADMIN to override.',
            );
        }

        // Verify match exists
        const match = await this.prisma.match.findUnique({ where: { id: matchId } });
        if (!match) throw new BadRequestException('Match not found');

        const lock = await this.prisma.$transaction([
            this.prisma.resultLock.upsert({
                where: { matchId },
                create: { matchId, lockedBy: adminId },
                update: {
                    lockedBy: adminId,
                    lockedAt: new Date(),
                    isOverridden: false,
                    overrideBy: null,
                    overrideAt: null,
                    overrideReason: null,
                },
            }),
            this.prisma.activityLog.create({
                data: {
                    adminId,
                    action: 'RESULT_LOCKED',
                    targetId: matchId,
                    details: JSON.stringify({ matchId, lockedBy: adminId }),
                },
            }),
        ]);

        return { message: 'Result locked successfully', lock: lock[0] };
    }

    /**
     * Override a locked result (SUPERADMIN only).
     * Creates an immutable audit trail — cannot be deleted.
     */
    async overrideResult(
        matchId: string,
        superAdminId: string,
        reason: string,
    ) {
        if (!reason || reason.trim().length < 10) {
            throw new BadRequestException(
                'Override reason must be at least 10 characters.',
            );
        }

        const lock = await this.prisma.resultLock.findUnique({
            where: { matchId },
        });

        if (!lock) {
            throw new BadRequestException('No result lock found for this match');
        }

        const [updated] = await this.prisma.$transaction([
            this.prisma.resultLock.update({
                where: { matchId },
                data: {
                    isOverridden: true,
                    overrideBy: superAdminId,
                    overrideAt: new Date(),
                    overrideReason: reason.trim(),
                },
            }),
            this.prisma.activityLog.create({
                data: {
                    adminId: superAdminId,
                    action: 'RESULT_OVERRIDE',
                    targetId: matchId,
                    details: JSON.stringify({
                        matchId,
                        originalLockedBy: lock.lockedBy,
                        overrideBy: superAdminId,
                        reason: reason.trim(),
                    }),
                },
            }),
        ]);

        return { message: 'Result override recorded. Re-submit scores now.', lock: updated };
    }

    /**
     * Check if a match result is locked.
     */
    async isLocked(matchId: string): Promise<boolean> {
        const lock = await this.prisma.resultLock.findUnique({
            where: { matchId },
        });
        return !!(lock && !lock.isOverridden);
    }

    /**
     * Get the lock status and audit info for a match.
     */
    async getLockAudit(matchId: string) {
        return this.prisma.resultLock.findUnique({ where: { matchId } });
    }
}
