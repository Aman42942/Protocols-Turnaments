import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './prisma/prisma.service';
import { NotificationsService } from './notifications/notifications.service';
import { NotificationsGateway } from './notifications/notifications.gateway';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
  ) { }

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
    const current = await this.prisma.systemConfig.findUnique({ where: { key: 'MAINTENANCE_MODE' } });
    const currentlyOn = current?.value === 'true';

    const config = await this.prisma.systemConfig.upsert({
      where: { key: 'MAINTENANCE_MODE' },
      update: { value: String(status) },
      create: { key: 'MAINTENANCE_MODE', value: String(status) },
    });

    const isOn = config.value === 'true';

    // Notify users if status changed
    if (isOn !== currentlyOn) {
      this.notificationsGateway.broadcastMaintenanceStatus({ isMaintenanceMode: isOn });
      if (isOn) {
        await this.notificationsService.broadcast(
          'Site Under Maintenance 🛠️',
          'We are upgrading the system to enhance your experience. See you soon!',
          'warning',
          '/maintenance',
        );
      } else {
        await this.notificationsService.broadcast(
          'Servers are Back Online! 🚀',
          'Maintenance is complete. Join the lobby and start winning now!',
          'success',
          '/',
        );
      }
    }

    return { isMaintenanceMode: isOn };
  }

  async saveMaintenanceConfig(data: any): Promise<any> {
    const currentStatus = await this.prisma.systemConfig.findUnique({ where: { key: 'MAINTENANCE_MODE' } });
    const currentlyOn = currentStatus?.value === 'true';
    const newStatus = !!data.isMaintenanceMode;

    const keys = [
      { key: 'MAINTENANCE_MODE', value: String(newStatus) },
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

    // Notify if status changed
    if (newStatus !== currentlyOn) {
      this.notificationsGateway.broadcastMaintenanceStatus({ isMaintenanceMode: newStatus });
      if (newStatus) {
        await this.notificationsService.broadcast(
          'Site Under Maintenance 🛠️',
          'We are upgrading the system to enhance your experience. See you soon!',
          'warning',
          '/maintenance',
        );
      } else {
        await this.notificationsService.broadcast(
          'Servers are Back Online! 🚀',
          'Maintenance is complete. Join the lobby and start winning now!',
          'success',
          '/',
        );
      }
    }

    return this.getMaintenanceStatus();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleMaintenanceAutoExpiry() {
    const status = await this.getMaintenanceStatus();

    if (status.isMaintenanceMode && status.endTime) {
      const expirationDate = new Date(status.endTime);
      const now = new Date();

      if (now >= expirationDate) {
        this.logger.log('Maintenance period expired. Turning off maintenance mode automatically.');
        await this.setMaintenanceStatus(false);
      }
    }
  }
}
