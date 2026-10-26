import { Module, forwardRef } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { OrganizerModule } from '../organizer/organizer.module';
import { UsersModule } from '../users/users.module';
import { AdminOperationsModule } from '../admin-operations/admin-operations.module';
import { LeaderboardGateway } from './leaderboard.gateway';

import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { ScoringService } from './engine/scoring.service';
import { MatchService } from './engine/match.service';
import { MatchController } from './engine/match.controller';

import { TournamentLifecycleService } from './tournament-lifecycle.service';
import { TournamentLifecycleController } from './tournament-lifecycle.controller';
import { EscrowService } from './escrow.service';
import { ResultLockService } from './result-lock.service';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => WalletModule),
    NotificationsModule,
    forwardRef(() => PaymentsModule),
    ActivityLogModule,
    OrganizerModule,
    UsersModule,
    AdminOperationsModule,
    forwardRef(() => AdminOperationsModule),
  ],
  controllers: [
    TournamentsController,
    LeaderboardController,
    MatchController,
    TournamentLifecycleController,
  ],
  providers: [
    TournamentsService,
    LeaderboardService,
    LeaderboardGateway,
    ScoringService,
    MatchService,
    TournamentLifecycleService,
    EscrowService,
    ResultLockService,
  ],
  exports: [TournamentsService, EscrowService, ResultLockService],
})
export class TournamentsModule {}
