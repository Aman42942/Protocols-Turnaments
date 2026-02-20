import {
    Injectable,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Valid state transitions for a tournament
const VALID_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ['OPEN'],
    OPEN: ['LIVE', 'CANCELLED'],
    LIVE: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [], // Terminal state — no further transitions
    CANCELLED: [], // Terminal state
};

@Injectable()
export class TournamentLifecycleService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Transition a tournament to newStatus.
     * Enforces the state machine and records an audit log.
     */
    async transition(
        tournamentId: string,
        newStatus: string,
        adminId: string,
        reason?: string,
    ) {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { _count: { select: { teams: true } } },
        });

        if (!tournament) throw new BadRequestException('Tournament not found');

        const currentStatus = tournament.status;
        const allowed = VALID_TRANSITIONS[currentStatus] || [];

        if (!allowed.includes(newStatus)) {
            throw new ForbiddenException(
                `Cannot transition tournament from "${currentStatus}" to "${newStatus}". Allowed: [${allowed.join(', ')}]`,
            );
        }

        // Guard: Cannot go LIVE without minimum teams
        if (newStatus === 'LIVE') {
            const minTeams = tournament.minTeams ?? 2;
            if (tournament._count.teams < minTeams) {
                throw new BadRequestException(
                    `Cannot go LIVE: needs at least ${minTeams} registered teams, currently has ${tournament._count.teams}.`,
                );
            }
        }

        // Guard: Cannot go OPEN if already past start date by >1 hour
        if (newStatus === 'OPEN' && currentStatus === 'DRAFT') {
            const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
            if (tournament.startDate < hourAgo) {
                throw new BadRequestException(
                    'Start date has already passed. Update the start date before opening.',
                );
            }
        }

        // Perform transition + audit in a single Prisma transaction
        const [updated] = await this.prisma.$transaction([
            this.prisma.tournament.update({
                where: { id: tournamentId },
                data: { status: newStatus },
            }),
            this.prisma.activityLog.create({
                data: {
                    adminId,
                    action: `TOURNAMENT_STATUS_CHANGED`,
                    targetId: tournamentId,
                    details: JSON.stringify({
                        from: currentStatus,
                        to: newStatus,
                        reason: reason || null,
                    }),
                },
            }),
        ]);

        return updated;
    }

    /**
     * Auto-transition: Mark tournament LIVE when start date is reached.
     * Called by a scheduler or manually.
     */
    async autoOpenDueTournaments(adminId: string) {
        const now = new Date();

        const dueTournaments = await this.prisma.tournament.findMany({
            where: {
                status: 'OPEN',
                startDate: { lte: now },
            },
        });

        const results = await Promise.allSettled(
            dueTournaments.map((t) =>
                this.transition(t.id, 'LIVE', adminId, 'Auto-transitioned at start time'),
            ),
        );

        const succeeded = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;

        return { succeeded, failed, total: dueTournaments.length };
    }

    /**
     * Get current status + allowed next transitions for the frontend.
     */
    async getLifecycleState(tournamentId: string) {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: { id: true, status: true, title: true, startDate: true },
        });
        if (!tournament) throw new BadRequestException('Tournament not found');

        return {
            ...tournament,
            allowedTransitions: VALID_TRANSITIONS[tournament.status] || [],
        };
    }
}
