import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
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
import { CmsModule } from './cms/cms.module';
import { SecurityModule } from './security/security.module';
import { GlobalSecurityGuard } from './security/global-security.guard';
import { SecurityThrottlerGuard } from './security/security-throttler.guard';
import { MonitoringModule } from './monitoring/monitoring.module';
import { RequestLoggerMiddleware } from './monitoring/request-logger.middleware';
import { AllExceptionsFilter } from './monitoring/all-exceptions.filter';
import { EmailTemplatesModule } from './email-templates/email-templates.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { GeoFencingMiddleware } from './common/middleware/geo-fencing.middleware';
import { AiModule } from './ai/ai.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
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
    CmsModule,
    SecurityModule,
    MonitoringModule,
    EmailTemplatesModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: SecurityThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: GlobalSecurityGuard,
    },
    {
      provide: 'APP_FILTER',
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {
  configure(consumer: import('@nestjs/common').MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
    consumer.apply(GeoFencingMiddleware).forRoutes(
      'auth/(.*)',
      'payments/(.*)',
      'tournaments/(.*)',
      'teams/(.*)',
      'wallet/(.*)',
      'admin-operations/(.*)',
      'organizer/(.*)',
    );
  }
}
