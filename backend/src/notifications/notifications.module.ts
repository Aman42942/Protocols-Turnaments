import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsGateway } from './notifications.gateway';
import { EmailModule } from '../email/email.module';
import { NotificationProcessor } from './notification.processor';

const redisHost = process.env.REDIS_HOST;
const isRealRedis = Boolean(redisHost && redisHost !== '127.0.0.1' && redisHost !== 'localhost');

@Module({
  imports: [
    PrismaModule,
    EmailModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    ...(isRealRedis ? [NotificationProcessor] : []),
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule { }
