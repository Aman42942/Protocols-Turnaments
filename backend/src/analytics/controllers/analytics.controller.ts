import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
// import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
// import { RolesGuard } from '../../auth/roles.guard';
// import { Roles } from '../../auth/roles.decorator';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('dashboard')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles('ADMIN')
    async getDashboardStats() {
        return this.analyticsService.getDashboardStats();
    }

    @Get('player/:playerId')
    async getPlayerStats(@Param('playerId') playerId: string) {
        return this.analyticsService.getPlayerStats(playerId);
    }

    @Get('team/:teamId')
    async getTeamStats(@Param('teamId') teamId: string) {
        return this.analyticsService.getTeamStats(teamId);
    }
}
