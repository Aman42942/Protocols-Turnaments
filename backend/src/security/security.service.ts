import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export enum SecuritySeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export enum SecurityEventType {
    SQLI = 'SQLI',
    XSS = 'XSS',
    RATE_LIMIT = 'RATE_LIMIT',
    BRUTE_FORCE = 'BRUTE_FORCE',
    SUSPICIOUS = 'SUSPICIOUS',
}

@Injectable()
export class SecurityService {
    private readonly logger = new Logger(SecurityService.name);

    // In-memory cache for fast lookups
    private bannedIpsCache: Set<string> = new Set();
    private autoBanEnabledCache: boolean = true;
    private lastCacheUpdate = 0;

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async onModuleInit() {
        await this.refreshBannedIpsCache();
    }

    /**
     * Fast check if an IP is banned (returns true if BANNED)
     */
    async isIpBanned(ip: string): Promise<boolean> {
        // Refresh cache every 1 minute to catch DB updates from other instances/admin panel
        if (Date.now() - this.lastCacheUpdate > 60000) {
            await this.refreshBannedIpsCache();
        }
        return this.bannedIpsCache.has(ip);
    }

    private async refreshBannedIpsCache() {
        try {
            const [bans, config] = await Promise.all([
                this.prisma.bannedIp.findMany({ select: { ipAddress: true } }),
                this.prisma.systemConfig.findUnique({ where: { key: 'AUTO_BAN_ENABLED' } })
            ]);

            this.bannedIpsCache = new Set(bans.map((b) => b.ipAddress));
            this.autoBanEnabledCache = config ? config.value === 'true' : true; // Default true if not set
            this.lastCacheUpdate = Date.now();
        } catch (e) {
            this.logger.error('Failed to refresh security caches', e);
        }
    }

    /**
     * Log a security threat and trigger Autopilot if necessary
     */
    async logThreat(data: {
        type: SecurityEventType;
        ipAddress: string;
        userId?: string;
        path: string;
        method: string;
        payload?: string;
        severity: SecuritySeverity;
    }) {
        this.logger.warn(`Security Threat Detected [${data.type}] from IP: ${data.ipAddress} at ${data.path}`);

        try {
            // 1. Log to database
            await this.prisma.securityLog.create({
                data: {
                    type: data.type,
                    ipAddress: data.ipAddress,
                    userId: data.userId,
                    path: data.path,
                    method: data.method,
                    payload: data.payload ? data.payload.substring(0, 1000) : null, // keep payload capped
                    severity: data.severity,
                },
            });

            // 2. Notify Admins if HIGH/CRITICAL
            if (data.severity === SecuritySeverity.HIGH || data.severity === SecuritySeverity.CRITICAL) {
                await this.notifyAdmins(
                    `Critical Security Alert: ${data.type}`,
                    `Malicious activity detected from IP ${data.ipAddress} at ${data.path}. Action was blocked.`
                );
            }

            // 3. AUTOPILOT: Check if this IP should be auto-banned
            await this.evaluateAutopilotBan(data.ipAddress);

        } catch (error) {
            this.logger.error('Failed to process security log', error);
        }
    }

    /**
     * AUTOPILOT LOGIC: Ban IP if too many offenses in the last 15 minutes.
     */
    private async evaluateAutopilotBan(ip: string) {
        if (!this.autoBanEnabledCache) return; // Autopilot Disabled by Admin
        if (this.bannedIpsCache.has(ip)) return; // Already banned

        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

        const recentLogs = await this.prisma.securityLog.findMany({
            where: {
                ipAddress: ip,
                createdAt: { gte: fifteenMinsAgo },
            },
            select: { severity: true },
        });

        // Scoring system: CRITICAL=3, HIGH=2, MEDIUM=1, LOW=0
        let score = 0;
        for (const log of recentLogs) {
            if (log.severity === SecuritySeverity.CRITICAL) score += 3;
            else if (log.severity === SecuritySeverity.HIGH) score += 2;
            else if (log.severity === SecuritySeverity.MEDIUM) score += 1;
        }

        // Threshold is 5 points (e.g., 2 Highs + 1 Med, or 2 Criticals, etc.)
        if (score >= 5) {
            await this.banIp(ip, 'AUTOPILOT: Repeated security violations detected.');
        }
    }

    /**
     * Ban an IP Address (used by Autopilot or Admin manually)
     */
    async banIp(ip: string, reason: string) {
        if (this.bannedIpsCache.has(ip)) return;

        this.logger.error(`AUTOPILOT BAN TRIGGERED for IP: ${ip}. Reason: ${reason}`);

        await this.prisma.bannedIp.upsert({
            where: { ipAddress: ip },
            update: {
                reason,
                attemptCount: { increment: 1 },
            },
            create: {
                ipAddress: ip,
                reason,
                attemptCount: 1,
            },
        });

        this.bannedIpsCache.add(ip);

        await this.notifyAdmins(
            'System Autopilot Action',
            `IP ${ip} has been automatically banned due to repeated malicious activity.`
        );
    }

    /**
     * Unban an IP Address (Admin manual override)
     */
    async unbanIp(ip: string) {
        await this.prisma.bannedIp.deleteMany({
            where: { ipAddress: ip },
        });
        this.bannedIpsCache.delete(ip);

        // Resolve previous active logs for this IP so they don't instantly re-trigger the ban
        await this.prisma.securityLog.updateMany({
            where: { ipAddress: ip, resolved: false },
            data: { resolved: true },
        });
    }

    /**
     * Notify all Admins.
     * Finds all ADMIN users and sends a Notification record.
     */
    private async notifyAdmins(title: string, message: string) {
        const admins = await this.prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true },
        });

        for (const admin of admins) {
            await this.notificationsService.create(admin.id, title, message, 'error', '/admin/security');
        }
    }
}
