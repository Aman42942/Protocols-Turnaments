import { Module, forwardRef } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WalletModule } from '../wallet/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PayoutService } from './payout.service';
import { FraudService } from './fraud.service';
import { PaypalService } from './paypal.service';
import { PaypalPayoutsService } from './paypal-payouts.service';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module';
import { CashfreePayoutsService } from './cashfree-payouts.service';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { AdminOperationsModule } from '../admin-operations/admin-operations.module';
import { WiseService } from './services/wise.service';
import { PayoneerService } from './services/payoneer.service';


@Module({
  imports: [ConfigModule, forwardRef(() => WalletModule), NotificationsModule, PrismaModule, forwardRef(() => TournamentsModule), forwardRef(() => AdminOperationsModule)],
  controllers: [PaymentsController],
  providers: [PaymentsService, PayoutService, FraudService, PaypalService, CashfreePayoutsService, PaypalPayoutsService, WiseService, PayoneerService],
  exports: [PaymentsService, PayoutService, FraudService, PaypalService, CashfreePayoutsService, PaypalPayoutsService, WiseService, PayoneerService],
})
export class PaymentsModule { }


