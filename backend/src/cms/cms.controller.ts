
import {
    Controller,
    Get,
    Put,
    Post,
    Delete,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { CmsService } from './cms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Controller('cms')
export class CmsController {
    constructor(
        private readonly cmsService: CmsService,
        private readonly activityLogService: ActivityLogService,
    ) { }

    // ==========================================
    // PUBLIC ENDPOINTS (Loaded by frontend on boot)
    // ==========================================

    @Get('config')
    async getGlobalConfig() {
        return this.cmsService.getFullConfig();
    }

    @Get('content/:key')
    async getContentByKey(@Param('key') key: string) {
        return this.cmsService.getContentByKey(key);
    }

    // ==========================================
    // SECURE ADMIN ENDPOINTS (Only SUPERADMIN)
    // ==========================================

    @Put('theme')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(
        'ULTIMATE_ADMIN',
        'SUPERADMIN',
        'ADMIN',
        'SENIOR_ADMIN',
        'JUNIOR_ADMIN',
        'EMPLOYEE',
        'SENIOR_CHIEF_SECURITY_ADMIN',
        'CHIEF_DEVELOPMENT_ADMIN',
        'CHIEF_SECURITY_ADMIN',
        'VICE_CHIEF_SECURITY_ADMIN',
    )
    async updateTheme(@Body() body: any, @Request() req) {
        const updatedTheme = await this.cmsService.updateGlobalTheme(body);
        await this.activityLogService.log(
            req.user.userId,
            'UPDATE_GLOBAL_THEME',
            body,
            undefined,
            req.ip,
        );
        return { success: true, theme: updatedTheme };
    }

    @Post('theme/reset')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(
        'ULTIMATE_ADMIN',
        'SUPERADMIN',
        'ADMIN',
        'SENIOR_ADMIN',
        'JUNIOR_ADMIN',
        'EMPLOYEE',
        'SENIOR_CHIEF_SECURITY_ADMIN',
        'CHIEF_DEVELOPMENT_ADMIN',
        'CHIEF_SECURITY_ADMIN',
        'VICE_CHIEF_SECURITY_ADMIN',
    )
    async resetTheme(@Request() req) {
        const theme = await this.cmsService.resetToDefaultTheme();
        await this.activityLogService.log(
            req.user.userId,
            'RESET_GLOBAL_THEME',
            {},
            undefined,
            req.ip,
        );
        return { success: true, theme };
    }

    // ==========================================
    // THEME PRESETS (SUPERADMIN ONLY)
    // ==========================================

    @Get('presets')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(
        'ULTIMATE_ADMIN',
        'SUPERADMIN',
        'ADMIN',
        'SENIOR_ADMIN',
        'JUNIOR_ADMIN',
        'EMPLOYEE',
        'SENIOR_CHIEF_SECURITY_ADMIN',
        'CHIEF_DEVELOPMENT_ADMIN',
        'CHIEF_SECURITY_ADMIN',
        'VICE_CHIEF_SECURITY_ADMIN',
    )
    async getPresets() {
        return this.cmsService.getAllPresets();
    }

    @Post('presets')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(
        'ULTIMATE_ADMIN',
        'SUPERADMIN',
        'ADMIN',
        'SENIOR_ADMIN',
        'JUNIOR_ADMIN',
        'EMPLOYEE',
        'SENIOR_CHIEF_SECURITY_ADMIN',
        'CHIEF_DEVELOPMENT_ADMIN',
        'CHIEF_SECURITY_ADMIN',
        'VICE_CHIEF_SECURITY_ADMIN',
    )
    async createPreset(@Body() body: { name: string; theme: any }, @Request() req) {
        const preset = await this.cmsService.createPreset(body.name, body.theme);
        await this.activityLogService.log(
            req.user.userId,
            'CREATE_THEME_PRESET',
            { name: body.name },
            undefined,
            req.ip,
        );
        return { success: true, preset };
    }

    @Post('presets/:id/apply')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(
        'ULTIMATE_ADMIN',
        'SUPERADMIN',
        'ADMIN',
        'SENIOR_ADMIN',
        'JUNIOR_ADMIN',
        'EMPLOYEE',
        'SENIOR_CHIEF_SECURITY_ADMIN',
        'CHIEF_DEVELOPMENT_ADMIN',
        'CHIEF_SECURITY_ADMIN',
        'VICE_CHIEF_SECURITY_ADMIN',
    )
    async applyPreset(@Param('id') id: string, @Request() req) {
        const theme = await this.cmsService.applyPreset(id);
        await this.activityLogService.log(
            req.user.userId,
            'APPLY_THEME_PRESET',
            { presetId: id },
            undefined,
            req.ip,
        );
        return { success: true, theme };
    }

    @Delete('presets/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(
        'ULTIMATE_ADMIN',
        'SUPERADMIN',
        'ADMIN',
        'SENIOR_ADMIN',
        'JUNIOR_ADMIN',
        'EMPLOYEE',
        'SENIOR_CHIEF_SECURITY_ADMIN',
        'CHIEF_DEVELOPMENT_ADMIN',
        'CHIEF_SECURITY_ADMIN',
        'VICE_CHIEF_SECURITY_ADMIN',
    )
    async deletePreset(@Param('id') id: string, @Request() req) {
        await this.cmsService.deletePreset(id);
        await this.activityLogService.log(
            req.user.userId,
            'DELETE_THEME_PRESET',
            { presetId: id },
            undefined,
            req.ip,
        );
        return { success: true };
    }

    @Put('content')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(
        'ULTIMATE_ADMIN',
        'SUPERADMIN',
        'ADMIN',
        'SENIOR_ADMIN',
        'JUNIOR_ADMIN',
        'EMPLOYEE',
        'SENIOR_CHIEF_SECURITY_ADMIN',
        'CHIEF_DEVELOPMENT_ADMIN',
        'CHIEF_SECURITY_ADMIN',
        'VICE_CHIEF_SECURITY_ADMIN',
    )
    async updateContent(@Body() body: { items: { key: string; value: string; type?: string }[] }, @Request() req) {
        const result = await this.cmsService.setMultipleContent(body.items);
        await this.activityLogService.log(
            req.user.userId,
            'UPDATE_SITE_CONTENT',
            { keysAffected: body.items.map(i => i.key) },
            undefined,
            req.ip,
        );
        return { success: true, content: result };
    }

    @Put('layout')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(
        'ULTIMATE_ADMIN',
        'SUPERADMIN',
        'ADMIN',
        'SENIOR_ADMIN',
        'JUNIOR_ADMIN',
        'EMPLOYEE',
        'SENIOR_CHIEF_SECURITY_ADMIN',
        'CHIEF_DEVELOPMENT_ADMIN',
        'CHIEF_SECURITY_ADMIN',
        'VICE_CHIEF_SECURITY_ADMIN',
    )
    async updateLayout(
        @Body() body: { componentId: string; isVisible: boolean; displayOrder: number },
        @Request() req,
    ) {
        const result = await this.cmsService.setLayout(body.componentId, body.isVisible, body.displayOrder);
        await this.activityLogService.log(
            req.user.userId,
            'UPDATE_COMPONENT_LAYOUT',
            body,
            undefined,
            req.ip,
        );
        return { success: true, layout: result };
    }

    // ==========================================
    // CUSTOM FEATURES (SUPERADMIN ONLY)
    // ==========================================

    @Post('features')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(
        'ULTIMATE_ADMIN',
        'SUPERADMIN',
        'ADMIN',
        'SENIOR_ADMIN',
        'JUNIOR_ADMIN',
        'EMPLOYEE',
        'SENIOR_CHIEF_SECURITY_ADMIN',
        'CHIEF_DEVELOPMENT_ADMIN',
        'CHIEF_SECURITY_ADMIN',
        'VICE_CHIEF_SECURITY_ADMIN',
    )
    async createFeature(@Body() body: any, @Request() req) {
        const feature = await this.cmsService.createFeature(body);
        await this.activityLogService.log(
            req.user.userId,
            'CREATE_CUSTOM_FEATURE',
            { featureId: feature.id, title: feature.title },
            undefined,
            req.ip,
        );
        return { success: true, feature };
    }

    @Put('features/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(
        'ULTIMATE_ADMIN',
        'SUPERADMIN',
        'ADMIN',
        'SENIOR_ADMIN',
        'JUNIOR_ADMIN',
        'EMPLOYEE',
        'SENIOR_CHIEF_SECURITY_ADMIN',
        'CHIEF_DEVELOPMENT_ADMIN',
        'CHIEF_SECURITY_ADMIN',
        'VICE_CHIEF_SECURITY_ADMIN',
    )
    async updateFeature(@Param('id') id: string, @Body() body: any, @Request() req) {
        const feature = await this.cmsService.updateFeature(id, body);
        await this.activityLogService.log(
            req.user.userId,
            'UPDATE_CUSTOM_FEATURE',
            { featureId: feature.id },
            undefined,
            req.ip,
        );
        return { success: true, feature };
    }

    @Delete('features/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(
        'ULTIMATE_ADMIN',
        'SUPERADMIN',
        'ADMIN',
        'SENIOR_ADMIN',
        'JUNIOR_ADMIN',
        'EMPLOYEE',
        'SENIOR_CHIEF_SECURITY_ADMIN',
        'CHIEF_DEVELOPMENT_ADMIN',
        'CHIEF_SECURITY_ADMIN',
        'VICE_CHIEF_SECURITY_ADMIN',
    )
    async deleteFeature(@Param('id') id: string, @Request() req) {
        await this.cmsService.deleteFeature(id);
        await this.activityLogService.log(
            req.user.userId,
            'DELETE_CUSTOM_FEATURE',
            { featureId: id },
            undefined,
            req.ip,
        );
        return { success: true };
    }

    // ==========================================
    // AD SLIDES (SUPERADMIN ONLY)
    // ==========================================

    @Get('slides')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(
        'ULTIMATE_ADMIN',
        'SUPERADMIN',
        'ADMIN',
        'SENIOR_ADMIN',
        'JUNIOR_ADMIN',
        'EMPLOYEE',
        'SENIOR_CHIEF_SECURITY_ADMIN',
        'CHIEF_DEVELOPMENT_ADMIN',
        'CHIEF_SECURITY_ADMIN',
        'VICE_CHIEF_SECURITY_ADMIN',
    )
    async getAllSlides() {
        return this.cmsService.getAllAdSlides(false);
    }

    @Post('slides')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(
        'ULTIMATE_ADMIN',
        'SUPERADMIN',
        'ADMIN',
        'SENIOR_ADMIN',
        'JUNIOR_ADMIN',
        'EMPLOYEE',
        'SENIOR_CHIEF_SECURITY_ADMIN',
        'CHIEF_DEVELOPMENT_ADMIN',
        'CHIEF_SECURITY_ADMIN',
        'VICE_CHIEF_SECURITY_ADMIN',
    )
    async createSlide(@Body() body: any, @Request() req) {
        const slide = await this.cmsService.createAdSlide(body);
        await this.activityLogService.log(
            req.user.userId,
            'CREATE_AD_SLIDE',
            { slideId: slide.id, title: slide.title },
            undefined,
            req.ip,
        );
        return { success: true, slide };
    }

    @Put('slides/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(
        'ULTIMATE_ADMIN',
        'SUPERADMIN',
        'ADMIN',
        'SENIOR_ADMIN',
        'JUNIOR_ADMIN',
        'EMPLOYEE',
        'SENIOR_CHIEF_SECURITY_ADMIN',
        'CHIEF_DEVELOPMENT_ADMIN',
        'CHIEF_SECURITY_ADMIN',
        'VICE_CHIEF_SECURITY_ADMIN',
    )
    async updateSlide(@Param('id') id: string, @Body() body: any, @Request() req) {
        const slide = await this.cmsService.updateAdSlide(id, body);
        await this.activityLogService.log(
            req.user.userId,
            'UPDATE_AD_SLIDE',
            { slideId: slide.id },
            undefined,
            req.ip,
        );
        return { success: true, slide };
    }

    @Delete('slides/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(
        'ULTIMATE_ADMIN',
        'SUPERADMIN',
        'ADMIN',
        'SENIOR_ADMIN',
        'JUNIOR_ADMIN',
        'EMPLOYEE',
        'SENIOR_CHIEF_SECURITY_ADMIN',
        'CHIEF_DEVELOPMENT_ADMIN',
        'CHIEF_SECURITY_ADMIN',
        'VICE_CHIEF_SECURITY_ADMIN',
    )
    async deleteSlide(@Param('id') id: string, @Request() req) {
        await this.cmsService.deleteAdSlide(id);
        await this.activityLogService.log(
            req.user.userId,
            'DELETE_AD_SLIDE',
            { slideId: id },
            undefined,
            req.ip,
        );
        return { success: true };
    }
}
