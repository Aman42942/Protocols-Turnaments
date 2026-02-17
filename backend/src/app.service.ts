import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getMaintenanceStatus(): Promise<{ isMaintenanceMode: boolean }> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: 'MAINTENANCE_MODE' },
    });
    return { isMaintenanceMode: config?.value === 'true' };
  }

  async setMaintenanceStatus(
    status: boolean,
  ): Promise<{ isMaintenanceMode: boolean }> {
    const config = await this.prisma.systemConfig.upsert({
      where: { key: 'MAINTENANCE_MODE' },
      update: { value: String(status) },
      create: { key: 'MAINTENANCE_MODE', value: String(status) },
    });
    return { isMaintenanceMode: config.value === 'true' };
  }
}
