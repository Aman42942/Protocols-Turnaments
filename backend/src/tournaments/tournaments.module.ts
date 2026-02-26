import { Module } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LeaderboardGateway } from './leaderboard.gateway';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { OrganizerModule } from '../organizer/organizer.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

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
    WalletModule,
    NotificationsModule,
    PaymentsModule,
    ActivityLogModule,
    OrganizerModule,
    UsersModule,
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
  exports: [
    TournamentsService,
    LeaderboardService,
    MatchService,
    EscrowService,
    ResultLockService,
  ],
})
export class TournamentsModule { }
