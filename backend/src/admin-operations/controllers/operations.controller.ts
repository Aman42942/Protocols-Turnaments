import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { OperationsService } from '../services/operations.service';

// import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
// import { RolesGuard } from '../../auth/roles.guard';
// import { Roles } from '../../auth/roles.decorator';

@Controller('admin/ops')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('ADMIN')
export class OperationsController {
    constructor(private readonly operationsService: OperationsService) { }

    @Get('dashboard')
    async getDashboard() {
        return this.operationsService.getDashboardStats();
    }

    @Get('live-matches')
    async getLiveMatches() {
        return this.operationsService.getLiveMatches();
    }

    @Post('match/:matchId/override')
    async overrideScore(
        @Param('matchId') matchId: string,
        @Body() body: { teamId: string; placement: number; kills: number },
        @Request() req
    ) {
        // Mock admin ID from request user or hardcoded for now if auth disabled
        const adminId = req.user?.id || 'admin-id-placeholder';
        return this.operationsService.overrideMatchScore(matchId, body.teamId, body.placement, body.kills, adminId);
    }

    @Post('tournament/:id/payout')
    async triggerPayout(@Param('id') id: string, @Request() req) {
        const adminId = req.user?.id || 'admin-id-placeholder';
        return this.operationsService.triggerManualPayout(id, adminId);
    }
}
