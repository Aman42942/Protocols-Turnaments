import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Assuming you have an auth guard
// import { RolesGuard } from '../auth/roles.guard';
// import { Roles } from '../auth/roles.decorator';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('insights')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('ADMIN', 'SUPERADMIN', 'ULTIMATE_ADMIN')
  async getInsights() {
    return this.aiService.generateGrowthInsights();
  }

  @Post('diagnose')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('ADMIN', 'SUPERADMIN', 'ULTIMATE_ADMIN')
  async diagnose(@Body() body: { error: string; stack?: string }) {
    return this.aiService.diagnoseError(body.error, body.stack);
  }

  @Post('chat')
  async chat(@Body() body: { message: string }) {
    return this.aiService.processPlayerChat(body.message);
  }

  @Post('marketing')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('ADMIN', 'SUPERADMIN')
  async marketing(@Body() body: { context: string }) {
    return this.aiService.generateMarketingContent(body.context);
  }

  @Get('financials')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('ADMIN', 'SUPERADMIN')
  async financials() {
    return this.aiService.predictFinancials();
  }

  @Get('security-audit')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('ADMIN', 'SUPERADMIN')
  async securityAudit() {
    return this.aiService.auditSecurityLogs();
  }
}
