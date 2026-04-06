import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('maintenance')
  getMaintenanceStatus() {
    return this.appService.getMaintenanceStatus();
  }

  @Post('maintenance')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('EMPLOYEE')
  setMaintenanceStatus(@Body('status') status: boolean) {
    return this.appService.setMaintenanceStatus(status);
  }

  @Post('maintenance/config')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('EMPLOYEE')
  saveMaintenanceConfig(@Body() body: any) {
    return this.appService.saveMaintenanceConfig(body);
  }
}
