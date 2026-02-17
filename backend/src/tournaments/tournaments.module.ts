import { Module } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LeaderboardGateway } from './leaderboard.gateway';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';

@Module({
  imports: [
    PrismaModule,
    WalletModule,
    NotificationsModule,
    PaymentsModule,
    ActivityLogModule,
  ],
  controllers: [TournamentsController, LeaderboardController],
  providers: [TournamentsService, LeaderboardGateway, LeaderboardService],
})
export class TournamentsModule {}
