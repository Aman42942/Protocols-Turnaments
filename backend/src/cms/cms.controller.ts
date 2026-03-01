
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
        const [theme, content, layout, features, slides] = await Promise.all([
            this.cmsService.getGlobalTheme(),
            this.cmsService.getAllContent(),
            this.cmsService.getAllLayouts(),
            this.cmsService.getAllFeatures(true),
            this.cmsService.getAllAdSlides(true),
        ]);

        return {
            theme,
            content,
            layout,
            features,
            slides,
        };
    }

    // ==========================================
    // SECURE ADMIN ENDPOINTS (Only SUPERADMIN)
    // ==========================================

    @Put('theme')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPERADMIN')
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

    @Put('content')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPERADMIN')
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
    @Roles('SUPERADMIN')
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
    @Roles('SUPERADMIN')
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
    @Roles('SUPERADMIN')
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
    @Roles('SUPERADMIN')
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
    @Roles('SUPERADMIN')
    async getAllSlides() {
        return this.cmsService.getAllAdSlides(false);
    }

    @Post('slides')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPERADMIN')
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
    @Roles('SUPERADMIN')
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
    @Roles('SUPERADMIN')
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
