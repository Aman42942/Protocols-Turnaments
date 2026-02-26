import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { TeamsModule } from './teams/teams.module';
import { GamesModule } from './games/games.module';
import { PaymentsModule } from './payments/payments.module';
import { WalletModule } from './wallet/wallet.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmailModule } from './email/email.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { ThemeModule } from './theme/theme.module';
import { ContentModule } from './content/content.module';
import { HealthModule } from './health/health.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminOperationsModule } from './admin-operations/admin-operations.module';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from './redis/redis.module';
import { RbacModule } from './rbac/rbac.module';
import { OrganizerModule } from './organizer/organizer.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    EmailModule,
    AuthModule,
    PrismaModule,
    UsersModule,
    TournamentsModule,
    TeamsModule,
    GamesModule,
    PaymentsModule,
    WalletModule,
    NotificationsModule,
    ActivityLogModule,
    ThemeModule,
    ContentModule,
    HealthModule,
    AnalyticsModule,
    AdminOperationsModule,
    RedisModule,
    QueueModule,
    RbacModule,
    OrganizerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
