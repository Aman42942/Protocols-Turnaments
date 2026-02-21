import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { Role } from '../rbac/roles.enum';
import { CurrentUser } from '../rbac/current-user.decorator';
import { ComplianceService } from './compliance.service';

@Controller('compliance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ComplianceController {
    constructor(private readonly complianceService: ComplianceService) { }

    /**
     * Get full audit trail for MY organizer account.
     * Organizers can only see their own logs.
     */
    @Get('audit-trail')
    getMyAuditTrail(
        @CurrentUser('id') userId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 50,
    ) {
        // Note: OrganizerService.findByUserId used in a real impl would
        // resolve organizerId from userId first. Simplified here for clarity.
        return this.complianceService.getAuditTrail(userId, +page, +limit);
    }

    /**
     * TDS summary report — prizes distributed in a date range.
     * ADMIN and above.
     */
    @Roles(Role.ADMIN)
    @Get('tds-report/:organizerId')
    getTdsReport(
        @Param('organizerId') organizerId: string,
        @Query('from') from: string,
        @Query('to') to: string,
    ) {
        return this.complianceService.getTdsSummary(
            organizerId,
            new Date(from),
            new Date(to),
        );
    }

    /**
     * Platform-wide audit trail — SUPERADMIN only.
     */
    @Roles(Role.SUPERADMIN)
    @Get('admin/audit/:organizerId')
    getOrgAuditTrail(
        @Param('organizerId') organizerId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 50,
    ) {
        return this.complianceService.getAuditTrail(organizerId, +page, +limit);
    }
}
