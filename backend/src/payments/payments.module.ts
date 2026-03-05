import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WalletModule } from '../wallet/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PayoutService } from './payout.service';
import { FraudService } from './fraud.service';
import { PaypalService } from './paypal.service';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module';
import { CashfreePayoutsService } from './cashfree-payouts.service';

@Module({
  imports: [ConfigModule, WalletModule, NotificationsModule, PrismaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PayoutService, FraudService, PaypalService, CashfreePayoutsService],
  exports: [PaymentsService, PayoutService, FraudService, PaypalService, CashfreePayoutsService],
})
export class PaymentsModule { }

