import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentRoutingService {
  constructor(private prisma: PrismaService) {}

  async getAllRoutes() {
    return this.prisma.paymentRouting.findMany({
      orderBy: { country: 'asc' },
    });
  }

  async setRoute(country: string, gateways: string[]) {
    return this.prisma.paymentRouting.upsert({
      where: { country },
      update: { gateways },
      create: { country, gateways },
    });
  }

  async getGatewaysForCountry(country: string) {
    const route = await this.prisma.paymentRouting.findUnique({
      where: { country },
    });

    if (route && route.gateways.length > 0) {
      return route.gateways;
    }

    // Default logic if no specific route is set
    if (country === 'India') return ['CASHFREE'];
    if (country.includes('United States') || country === 'USA') return ['PAYPAL'];
    if (country === 'UK' || country === 'United Kingdom') return ['WISE'];
    
    return ['PAYONEER', 'WISE']; // Global default fallback
  }

  async deleteRoute(id: string) {
    return this.prisma.paymentRouting.delete({
      where: { id },
    });
  }
}
