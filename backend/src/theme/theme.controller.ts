import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ThemeService } from './theme.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Controller('theme')
export class ThemeController {
  constructor(
    private readonly themeService: ThemeService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  // Public endpoint for frontend to load theme
  @Get()
  async getTheme() {
    return this.themeService.getActiveTheme();
  }

  // Admin only endpoint to update theme
  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateTheme(@Body() body: any, @Request() req) {
    const result = await this.themeService.updateTheme(body);
    // Log the activity
    await this.activityLogService.log(
      req.user.userId,
      'UPDATE_THEME',
      null,
      result.id,
      req.ip,
    );
    return result;
  }
}
