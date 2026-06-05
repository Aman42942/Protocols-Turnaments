import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsGateway } from './notifications.gateway';
import { BullModule } from '@nestjs/bullmq';
import { EmailModule } from '../email/email.module';
import { NotificationProcessor } from './notification.processor';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    BullModule.registerQueue({ name: 'notification' }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, NotificationProcessor],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule { }
