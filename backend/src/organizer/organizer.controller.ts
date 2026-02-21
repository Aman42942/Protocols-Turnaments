import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    UseGuards,
    Query,
} from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { Role } from '../rbac/roles.enum';
import { CurrentUser } from '../rbac/current-user.decorator';

@Controller('organizers')
export class OrganizerController {
    constructor(private readonly organizerService: OrganizerService) { }

    // ─── Public ──────────────────────────────────────────────────────────────

    /** List all active organizers */
    @Get()
    listAll(@Query('page') page = 1, @Query('limit') limit = 20) {
        return this.organizerService.listAll(+page, +limit);
    }

    /** Get organizer public profile + theme by slug */
    @Get(':slug/profile')
    getProfile(@Param('slug') slug: string) {
        return this.organizerService.findBySlug(slug);
    }

    /** Get white-label theme CSS vars for a slug */
    @Get(':slug/theme')
    getTheme(@Param('slug') slug: string) {
        return this.organizerService.getTheme(slug);
    }

    // ─── Authenticated User ───────────────────────────────────────────────────

    /** Create my organizer account */
    @UseGuards(AuthGuard('jwt'))
    @Post('me')
    create(
        @CurrentUser('id') userId: string,
        @Body() body: {
            name: string;
            slug: string;
            description?: string;
            website?: string;
            contactEmail?: string;
            panNumber?: string;
            gstNumber?: string;
        },
    ) {
        return this.organizerService.create(userId, body);
    }

    /** Get my organizer account */
    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getMyOrganizer(@CurrentUser('id') userId: string) {
        return this.organizerService.findByUserId(userId);
    }

    /** Update my organizer profile */
    @UseGuards(AuthGuard('jwt'))
    @Patch('me')
    updateMyOrganizer(
        @CurrentUser('id') userId: string,
        @Body() body: Partial<{
            name: string;
            description: string;
            website: string;
            contactEmail: string;
            panNumber: string;
            gstNumber: string;
            tnc: string;
        }>,
    ) {
        return this.organizerService.update(userId, body);
    }

    /** Update my white-label theme */
    @UseGuards(AuthGuard('jwt'))
    @Patch('me/theme')
    updateTheme(
        @CurrentUser('id') userId: string,
        @Body() themeData: Partial<{
            primaryColor: string;
            accentColor: string;
            bgColor: string;
            textColor: string;
            logoUrl: string;
            faviconUrl: string;
            bannerUrl: string;
            fontFamily: string;
            heroTitle: string;
            heroSubtitle: string;
            footerText: string;
        }>,
    ) {
        return this.organizerService.upsertTheme(userId, themeData);
    }

    /** My organizer dashboard — revenue, stats, recent tournaments */
    @UseGuards(AuthGuard('jwt'))
    @Get('me/dashboard')
    getDashboard(@CurrentUser('id') userId: string) {
        return this.organizerService.getDashboard(userId);
    }

    // ─── Admin Only ───────────────────────────────────────────────────────────

    /** Admin: verify an organizer */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id/verify')
    verifyOrganizer(
        @Param('id') organizerId: string,
        @CurrentUser('id') adminId: string,
    ) {
        return this.organizerService.verify(organizerId, adminId);
    }

    /** Admin: suspend an organizer */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id/suspend')
    suspendOrganizer(@Param('id') organizerId: string) {
        return this.organizerService.suspend(organizerId);
    }
}
