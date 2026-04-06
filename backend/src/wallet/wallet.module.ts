import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { AdminTransactionsController } from './admin-transactions.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { ActivityLogModule } from '../activity-log/activity-log.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, ConfigModule, ActivityLogModule, forwardRef(() => PaymentsModule)],
  controllers: [WalletController, AdminTransactionsController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule { }
