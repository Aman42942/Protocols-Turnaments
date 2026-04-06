import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.monitoringService.getDashboardStats();
  }

  @Get('security-logs')
  async getSecurityLogs(@Query('limit') limit?: string) {
    return this.monitoringService.getSecurityLogs(limit ? parseInt(limit) : 50);
  }

  @Get('health')
  getHealth() {
    return this.monitoringService.getSystemHealth();
  }
}
