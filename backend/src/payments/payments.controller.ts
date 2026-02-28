import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/role.enum';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('create-order')
  async createOrder(@Request() req, @Body('amount') amount: number) {
    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required');
    }
    // Pass User ID for Cashfree Customer Details
    return this.paymentsService.createOrder(amount, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verifyPayment(@Request() req, @Body('order_id') orderId: string) {
    const result = await this.paymentsService.verifyPayment(orderId);

    if (result.success && result.amount > 0) {
      // Credit the wallet after successful payment verification
      await this.walletService.deposit(
        req.user.userId,
        result.amount,
        'CASHFREE',
        result.paymentId ? String(result.paymentId) : 'mock_id',
      );

      // Send notification
      await this.notificationsService.create(
        req.user.userId,
        'Payment Successful 💳',
        `₹${result.amount} has been added to your wallet.`,
        'success',
        '/dashboard/wallet',
      );
    }

    return result;
  }

  @Post('webhook')
  async handleWebhook(@Request() req, @Body() body: any) {
    // Note: Cashfree webhooks should be verified here using their specific signature
    // For now, we use a basic placeholder as requested by the transition
    const isValid = await this.paymentsService.verifyWebhook(
      body,
      req.headers['x-webhook-signature'],
    );

    if (!isValid) {
      return { status: 'failed', message: 'Invalid signature' };
    }

    // Cashfree Webhook logic for 'ORDER_PAID'
    if (body.type === 'ORDER_PAID' || body.event === 'order.paid') {
      const orderId = body.data?.order?.order_id || body.order_id;
      const amount = body.data?.order?.order_amount || body.order_amount;
      const userId = body.data?.customer_details?.customer_id || body.customer_id;

      if (userId && amount) {
        await this.walletService.deposit(
          userId,
          amount,
          'CASHFREE_WEBHOOK',
          orderId,
        );
      }
    }

    return { status: 'ok' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.ULTIMATE_ADMIN)
  @Post('admin/refund')
  async adminRefund(
    @Body('order_id') orderId: string,
    @Body('amount') amount: number,
    @Body('userId') userId: string,
    @Body('tournamentId') tournamentId?: string,
    @Body('tournamentTitle') tournamentTitle?: string,
  ) {
    // 1. Process Refund via Cashfree
    const refundResult = await this.paymentsService.createRefund(orderId, amount);

    // 2. Update Wallet
    if (tournamentId && tournamentTitle) {
      await this.walletService.refundTournamentEntry(
        userId,
        amount,
        tournamentId,
        tournamentTitle,
      );
    } else {
      // General refund to wallet
      await this.walletService.deposit(
        userId,
        amount,
        'CASHFREE_REFUND',
        orderId,
        `Refund for order ${orderId}`,
      );
    }

    return {
      success: true,
      message: 'Refund processed successfully',
      cashfree: refundResult,
    };
  }
}
