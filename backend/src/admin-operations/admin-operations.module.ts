import { Module } from '@nestjs/common';
import { OperationsController } from './controllers/operations.controller';
import { OperationsService } from './services/operations.service';
import { OperationsGateway } from './gateways/operations.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [PrismaModule, PaymentsModule, WalletModule],
    controllers: [OperationsController],
    providers: [OperationsService, OperationsGateway],
    exports: [OperationsService],
})
export class AdminOperationsModule { }
