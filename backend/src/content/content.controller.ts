import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Controller('content')
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  // Public Endpoints
  @Get('pages/:slug')
  async getPage(@Param('slug') slug: string) {
    return this.contentService.getPage(slug);
  }

  @Get('announcements')
  async getAnnouncements() {
    return this.contentService.getActiveAnnouncements();
  }

  // Admin Endpoints - Pages
  @Get('admin/pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAllPages() {
    return this.contentService.getAllPages();
  }

  @Post('admin/pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updatePage(
    @Body()
    body: {
      slug: string;
      title: string;
      content: string;
      isPublished?: boolean;
    },
    @Request() req,
  ) {
    const result = await this.contentService.updatePage(body.slug, body);
    await this.activityLogService.log(
      req.user.userId,
      'UPDATE_PAGE',
      { slug: body.slug },
      result.id,
      req.ip,
    );
    return result;
  }

  @Delete('admin/pages/:slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deletePage(@Param('slug') slug: string, @Request() req) {
    const result = await this.contentService.deletePage(slug);
    await this.activityLogService.log(
      req.user.userId,
      'DELETE_PAGE',
      { slug },
      result.id,
      req.ip,
    );
    return result;
  }

  // Admin Endpoints - Announcements
  @Get('admin/announcements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAllAnnouncements() {
    return this.contentService.getAllAnnouncements();
  }

  @Post('admin/announcements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createAnnouncement(
    @Body() body: { title: string; message: string; type: string },
    @Request() req,
  ) {
    const result = await this.contentService.createAnnouncement(body);
    await this.activityLogService.log(
      req.user.userId,
      'CREATE_ANNOUNCEMENT',
      { title: body.title },
      result.id,
      req.ip,
    );
    return result;
  }

  @Patch('admin/announcements/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req,
  ) {
    const result = await this.contentService.updateAnnouncement(id, body);
    await this.activityLogService.log(
      req.user.userId,
      'UPDATE_ANNOUNCEMENT',
      null,
      id,
      req.ip,
    );
    return result;
  }

  @Delete('admin/announcements/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteAnnouncement(@Param('id') id: string, @Request() req) {
    const result = await this.contentService.deleteAnnouncement(id);
    await this.activityLogService.log(
      req.user.userId,
      'DELETE_ANNOUNCEMENT',
      null,
      id,
      req.ip,
    );
    return result;
  }
}
