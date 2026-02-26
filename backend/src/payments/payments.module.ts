import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WalletModule } from '../wallet/wallet.module';
import { PayoutService } from './payout.service';
import { FraudService } from './fraud.service';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ConfigModule, WalletModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PayoutService, FraudService],
  exports: [PaymentsService, PayoutService, FraudService],
})
export class PaymentsModule {}
