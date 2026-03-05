import { Controller, Get, Post, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SecurityController {
    constructor(
        private readonly securityService: SecurityService,
        private readonly prisma: PrismaService,
    ) { }

    @Get('dashboard')
    @Roles('ADMIN')
    async getDashboardStats() {
        const totalLogs = await this.prisma.securityLog.count();
        const activeBans = await this.prisma.bannedIp.count({
            where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }
        });
        const criticalThreats = await this.prisma.securityLog.count({
            where: { severity: 'CRITICAL', resolved: false }
        });

        const recentLogs = await this.prisma.securityLog.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' }
        });

        return { totalLogs, activeBans, criticalThreats, recentLogs };
    }

    @Get('banned-ips')
    @Roles('ADMIN')
    async getBannedIps() {
        return this.prisma.bannedIp.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    @Delete('banned-ips/:ip')
    @Roles('ADMIN')
    async unbanIp(@Param('ip') ip: string) {
        // Basic IP param sanitization since IPs usually don't have spaces, but URL params might be encoded
        const cleanIp = decodeURIComponent(ip);
        await this.securityService.unbanIp(cleanIp);
        return { success: true, message: `IP ${cleanIp} has been unblocked.` };
    }

    @Post('resolve-log/:id')
    @Roles('ADMIN')
    async resolveLog(@Param('id') id: string) {
        await this.prisma.securityLog.update({
            where: { id },
            data: { resolved: true }
        });
        return { success: true };
    }
}
