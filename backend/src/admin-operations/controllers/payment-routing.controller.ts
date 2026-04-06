import { Controller, Get, Post, Body, Delete, Param, UseGuards } from '@nestjs/common';
import { PaymentRoutingService } from '../services/payment-routing.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('admin/payment-routing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class PaymentRoutingController {
  constructor(private readonly routingService: PaymentRoutingService) {}

  @Get()
  async getAll() {
    return this.routingService.getAllRoutes();
  }

  @Post()
  async setRoute(@Body() body: { country: string; gateways: string[] }) {
    return this.routingService.setRoute(body.country, body.gateways);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.routingService.deleteRoute(id);
  }
}
