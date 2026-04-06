import { Controller, Get, Post, Body, Patch, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { RegionControlService } from '../services/region-control.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('admin/regions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class RegionControlController {
  constructor(private readonly regionService: RegionControlService) {}

  @Get()
  async getAll() {
    return this.regionService.getAllRegions();
  }

  @Post()
  async add(@Body() body: { name: string; type: 'COUNTRY' | 'STATE' }) {
    return this.regionService.addRegion(body.name, body.type);
  }

  @Patch(':id/toggle')
  async toggle(@Param('id') id: string, @Body() body: { isEnabled: boolean }) {
    return this.regionService.toggleRegion(id, body.isEnabled);
  }

  @Post('seed')
  async seed() {
    return this.regionService.seedRegions();
  }
}
