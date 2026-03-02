import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { NotificationsService } from './notifications/notifications.service';

@Injectable()
export class AppService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
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

    const isMaintenanceMode = configMap['MAINTENANCE_MODE'] === 'true';
    const endTime = configMap['MAINTENANCE_END_TIME'] || '';

    // AUTO-EXPIRY LOGIC: If currently ON and we have an end time, check if it's passed
    if (isMaintenanceMode && endTime) {
      const now = new Date();
      const end = new Date(endTime);

      // We add a 60-second "Grace Period" to prevent instant shutoff if the admin sets a past time accidentally
      // This is handled by checking the 'updatedAt' of the MAINTENANCE_MODE key if possible, 
      // but for simplicity, we'll assume if it's ON and passed, we check if it's "Live".
      // A better way is to check when the mode was last set.

      if (now > end) {
        // Fetch the last update time for the MAINTENANCE_MODE key to ensure we don't kill it immediately after it's turned on
        const modeConfig = configs.find(c => c.key === 'MAINTENANCE_MODE');
        const lastUpdate = modeConfig?.updatedAt || new Date(0);
        const secondsSinceUpdate = (now.getTime() - lastUpdate.getTime()) / 1000;

        if (secondsSinceUpdate > 60) {
          // Time has passed and grace period (60s) is over! Auto-disable maintenance
          await this.setMaintenanceStatus(false);
          return {
            isMaintenanceMode: false,
            title: configMap['MAINTENANCE_TITLE'] || '',
            message: configMap['MAINTENANCE_MESSAGE'] || '',
            endTime: endTime,
            showTimer: configMap['MAINTENANCE_SHOW_TIMER'] !== 'false',
            animations: configMap['MAINTENANCE_ANIMATIONS'] !== 'false',
            colorPrimary: configMap['MAINTENANCE_COLOR_PRIMARY'] || '#00E676',
          };
        }
      }
    }

    return {
      isMaintenanceMode: isMaintenanceMode,
      title: configMap['MAINTENANCE_TITLE'] || '',
      message: configMap['MAINTENANCE_MESSAGE'] || '',
      endTime: endTime,
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
}
