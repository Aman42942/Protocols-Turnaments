import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { AdminTransactionsController } from './admin-transactions.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [PrismaModule, ConfigModule, ActivityLogModule],
  controllers: [WalletController, AdminTransactionsController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
