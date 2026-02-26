import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
  ) {}

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
    const signature = req.headers['x-razorpay-signature'];
    const isValid = await this.paymentsService.verifyWebhook(body, signature);

    if (!isValid) {
      return { status: 'failed', message: 'Invalid signature' };
    }

    // Handle specific events like payment.captured
    if (body.event === 'payment.captured') {
      const paymentId = body.payload.payment.entity.id;
      const amount = body.payload.payment.entity.amount / 100; // to INR
      const userId = body.payload.payment.entity.notes?.userId;

      if (userId) {
        // Only credit if not already done via verify (idempotency check in deposit)
        await this.walletService.deposit(
          userId,
          amount,
          'RAZORPAY_WEBHOOK',
          paymentId,
        );
      }
    }

    return { status: 'ok' };
  }
}
