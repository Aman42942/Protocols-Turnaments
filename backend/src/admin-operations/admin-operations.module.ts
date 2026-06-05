import { Module, forwardRef } from '@nestjs/common';
import { OperationsController } from './controllers/operations.controller';
import { OperationsService } from './services/operations.service';
import { OperationsGateway } from './gateways/operations.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';
import { OrganizerModule } from '../organizer/organizer.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FinancialController } from './controllers/financial.controller';
import { FinancialService } from './services/financial.service';
import { RegionControlService } from './services/region-control.service';
import { RegionControlController } from './controllers/region-control.controller';
import { PaymentRoutingService } from './services/payment-routing.service';
import { PaymentRoutingController } from './controllers/payment-routing.controller';
import { PaymentGatewayService } from './services/payment-gateway.service';
import { PaymentGatewayController } from './controllers/payment-gateway.controller';


@Module({
  imports: [
    PrismaModule,
    forwardRef(() => PaymentsModule),
    forwardRef(() => WalletModule),
    forwardRef(() => AuthModule),
    OrganizerModule,
    NotificationsModule,
  ],
  controllers: [OperationsController, FinancialController, RegionControlController, PaymentRoutingController, PaymentGatewayController],
  providers: [OperationsService, OperationsGateway, FinancialService, RegionControlService, PaymentRoutingService, PaymentGatewayService],
  exports: [OperationsService, FinancialService, RegionControlService, PaymentRoutingService, PaymentGatewayService],
})
export class AdminOperationsModule { }

