import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentGatewayService } from '../services/payment-gateway.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('admin/payment-gateways')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class PaymentGatewayController {
  constructor(private readonly gatewayService: PaymentGatewayService) {}

  @Get()
  async getAll() {
    return this.gatewayService.getAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.gatewayService.getById(id);
  }

  @Post()
  async create(@Body() body: {
    name: string;
    provider: string;
    type?: string;
    mode?: string;
    apiKey?: string;
    apiSecret?: string;
    webhookSecret?: string;
    extraConfig?: any;
    supportedCurrencies?: string[];
    description?: string;
    iconUrl?: string;
    displayOrder?: number;
  }) {
    return this.gatewayService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.gatewayService.update(id, body);
  }

  @Patch(':id/toggle')
  async toggleEnabled(@Param('id') id: string) {
    return this.gatewayService.toggleEnabled(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.gatewayService.delete(id);
  }
}
