import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) { }

  getHello(): string {
    return 'Hello World!';
  }

  async getMaintenanceStatus(): Promise<any> {
    const configs = await this.prisma.systemConfig.findMany({
      where: { key: { startsWith: 'MAINTENANCE_' } },
    });

    // Convert to a dictionary
    const configMap = configs.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return {
      isMaintenanceMode: configMap['MAINTENANCE_MODE'] === 'true',
      title: configMap['MAINTENANCE_TITLE'] || '',
      message: configMap['MAINTENANCE_MESSAGE'] || '',
      endTime: configMap['MAINTENANCE_END_TIME'] || '',
      showTimer: configMap['MAINTENANCE_SHOW_TIMER'] !== 'false', // Default true
      animations: configMap['MAINTENANCE_ANIMATIONS'] !== 'false', // Default true
      colorPrimary: configMap['MAINTENANCE_COLOR_PRIMARY'] || '#00E676',
    };
  }

  async setMaintenanceStatus(status: boolean): Promise<{ isMaintenanceMode: boolean }> {
    const config = await this.prisma.systemConfig.upsert({
      where: { key: 'MAINTENANCE_MODE' },
      update: { value: String(status) },
      create: { key: 'MAINTENANCE_MODE', value: String(status) },
    });
    return { isMaintenanceMode: config.value === 'true' };
  }

  async saveMaintenanceConfig(data: any): Promise<any> {
    const keys = [
      { key: 'MAINTENANCE_MODE', value: String(data.isMaintenanceMode) },
      { key: 'MAINTENANCE_TITLE', value: data.title || '' },
      { key: 'MAINTENANCE_MESSAGE', value: data.message || '' },
      { key: 'MAINTENANCE_END_TIME', value: data.endTime || '' },
      { key: 'MAINTENANCE_SHOW_TIMER', value: String(data.showTimer) },
      { key: 'MAINTENANCE_ANIMATIONS', value: String(data.animations) },
      { key: 'MAINTENANCE_COLOR_PRIMARY', value: data.colorPrimary || '#00E676' },
    ];

    // Use transaction to update all keys
    await this.prisma.$transaction(
      keys.map((k) =>
        this.prisma.systemConfig.upsert({
          where: { key: k.key },
          update: { value: k.value },
          create: { key: k.key, value: k.value },
        })
      )
    );

    return this.getMaintenanceStatus();
  }
}
