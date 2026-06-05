import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentGatewayService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.paymentGateway.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getById(id: string) {
    const gateway = await this.prisma.paymentGateway.findUnique({ where: { id } });
    if (!gateway) throw new NotFoundException('Payment gateway not found');
    return gateway;
  }

  async getEnabled(type?: string) {
    const where: any = { isEnabled: true };
    if (type) where.type = { in: [type, 'BOTH'] };
    return this.prisma.paymentGateway.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    });
  }

  async create(data: {
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
    // Check for duplicate name
    const existing = await this.prisma.paymentGateway.findUnique({
      where: { name: data.name },
    });
    if (existing) throw new ConflictException(`Gateway "${data.name}" already exists`);

    return this.prisma.paymentGateway.create({
      data: {
        name: data.name,
        provider: data.provider.toUpperCase(),
        type: data.type || 'BOTH',
        mode: data.mode || 'SANDBOX',
        apiKey: data.apiKey || null,
        apiSecret: data.apiSecret || null,
        webhookSecret: data.webhookSecret || null,
        extraConfig: data.extraConfig || null,
        supportedCurrencies: data.supportedCurrencies || [],
        description: data.description || null,
        iconUrl: data.iconUrl || null,
        displayOrder: data.displayOrder || 0,
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    provider?: string;
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
    isEnabled?: boolean;
  }) {
    const gateway = await this.prisma.paymentGateway.findUnique({ where: { id } });
    if (!gateway) throw new NotFoundException('Payment gateway not found');

    // If renaming, check uniqueness
    if (data.name && data.name !== gateway.name) {
      const existing = await this.prisma.paymentGateway.findUnique({
        where: { name: data.name },
      });
      if (existing) throw new ConflictException(`Gateway "${data.name}" already exists`);
    }

    return this.prisma.paymentGateway.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.provider && { provider: data.provider.toUpperCase() }),
        ...(data.type && { type: data.type }),
        ...(data.mode && { mode: data.mode }),
        ...(data.apiKey !== undefined && { apiKey: data.apiKey || null }),
        ...(data.apiSecret !== undefined && { apiSecret: data.apiSecret || null }),
        ...(data.webhookSecret !== undefined && { webhookSecret: data.webhookSecret || null }),
        ...(data.extraConfig !== undefined && { extraConfig: data.extraConfig }),
        ...(data.supportedCurrencies && { supportedCurrencies: data.supportedCurrencies }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.iconUrl !== undefined && { iconUrl: data.iconUrl || null }),
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
      },
    });
  }

  async toggleEnabled(id: string) {
    const gateway = await this.prisma.paymentGateway.findUnique({ where: { id } });
    if (!gateway) throw new NotFoundException('Payment gateway not found');

    return this.prisma.paymentGateway.update({
      where: { id },
      data: { isEnabled: !gateway.isEnabled },
    });
  }

  async delete(id: string) {
    const gateway = await this.prisma.paymentGateway.findUnique({ where: { id } });
    if (!gateway) throw new NotFoundException('Payment gateway not found');

    return this.prisma.paymentGateway.delete({ where: { id } });
  }
}
