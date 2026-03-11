import { Controller, Get, Post, Param, Delete, Query, UseGuards, Patch } from '@nestjs/common';
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

    @Post('banned-ips')
    @Roles('ADMIN')
    async banIpManually(@Query('ip') ip: string, @Query('reason') reason?: string) {
        if (!ip) throw new Error('IP is required');
        await this.securityService.banIp(ip, reason || 'Manually banned by Admin');
        return { success: true, message: `IP ${ip} has been blocked.` };
    }

    @Get('banned-page-config')
    @Roles('ADMIN')
    async getBannedPageConfig() {
        return this.securityService.getBannedPageConfig();
    }

    @Patch('banned-page-config')
    @Roles('ADMIN')
    async updateBannedPageConfig(@Query('title') title: string, @Query('message') message: string) {
        if (!title || !message) throw new Error('Title and Message are required');
        await this.securityService.updateBannedPageConfig(title, message);
        return { success: true, message: 'Banned page content updated.' };
    }

    @Get('autopilot-config')
    @Roles('ADMIN', 'SUPERADMIN')
    async getAutopilotConfig() {
        return { enabled: this.securityService.isAutopilotEnabled() };
    }

    @Patch('autopilot-config')
    @Roles('ADMIN', 'SUPERADMIN')
    async updateAutopilotConfig(@Query('enabled') enabled: string) {
        const isEnabled = enabled === 'true';
        await this.securityService.updateAutopilotConfig(isEnabled);
        return { success: true, enabled: isEnabled, message: `Autopilot ${isEnabled ? 'Enabled' : 'Disabled'}` };
    }
}
