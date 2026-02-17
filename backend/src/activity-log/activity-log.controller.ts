import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  async findAll(@Query('page') page: string, @Query('limit') limit: string) {
    return this.activityLogService.findAll(
      Number(page) || 1,
      Number(limit) || 50,
    );
  }
}
