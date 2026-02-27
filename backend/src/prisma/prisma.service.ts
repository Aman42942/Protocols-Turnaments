import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
  }

  async onModuleInit() {
    let retries = 3; // Reduced for faster feedback
    while (retries > 0) {
      try {
        await this.$connect();
        this.logger.log('Successfully connected to the database.');
        break;
      } catch (err) {
        retries--;
        this.logger.error(
          `Failed to connect to the database. Retries left: ${retries}`,
          err,
        );
        if (retries === 0) {
          this.logger.warn('Database unavailable. App might be limited.');
          // Do not throw error here, let the app start in degraded mode if possible
          // Some health checks will report this.
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }
}
