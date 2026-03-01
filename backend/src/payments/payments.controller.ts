import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaypalService } from './paypal.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/role.enum';
import { BadRequestException } from '@nestjs/common';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
    private readonly paypalService: PaypalService,
    private readonly configService: ConfigService,
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
      req.headers['x-webhook-timestamp'],
    );

    if (!isValid) {
      return { status: 'failed', message: 'Invalid signature' };
    }

    // Cashfree Webhook logic
    const event = body.type || body.event;
    const orderId = body.data?.order?.order_id || body.order_id;
    const amount = body.data?.order?.order_amount || body.order_amount;
    const userId = body.data?.customer_details?.customer_id || body.customer_id;

    if (event === 'ORDER_PAID' || event === 'order.paid') {
      if (userId && amount) {
        await this.walletService.deposit(
          userId,
          amount,
          'CASHFREE_WEBHOOK',
          orderId,
        );
      }
    }
    else if (event === 'refund.processed') {
      console.log(`[WEBHOOK] Refund processed for order: ${orderId}`);
      // Wallet update is usually done synchronously, but we could add extra logging here
    }
    else if (event === 'refund.cancelled') {
      console.log(`[WEBHOOK] Refund cancelled for order: ${orderId}`);
      // Notify Admin or log error
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

  // --- PAYPAL ENDPOINTS --- //

  @UseGuards(JwtAuthGuard)
  @Post('paypal/create-order')
  async createPaypalOrder(@Request() req, @Body('usdAmount') usdAmount: number) {
    if (!usdAmount || usdAmount <= 0) {
      throw new BadRequestException('Valid USD amount is required');
    }
    return this.paypalService.createOrder(usdAmount);
  }

  @UseGuards(JwtAuthGuard)
  @Post('paypal/capture-order')
  async capturePaypalOrder(
    @Request() req,
    @Body('orderId') orderId: string,
    @Body('expectedCoins') expectedCoins: number,
  ) {
    if (!orderId) {
      throw new BadRequestException('Order ID is required');
    }

    const captureResult = await this.paypalService.captureOrder(orderId);

    if (captureResult.success) {
      // Get the admin-defined rate or fallback to .env/default 85
      const rate = Number(this.configService.get<string>('PAYPAL_EXCHANGE_RATE')) || 85;
      const usdPaid = captureResult.data.amount;
      const calculatedCoins = usdPaid * rate;

      // Ensure that the coins requested by the frontend match the amount actually paid on PayPal.
      // E.g., if user modifies frontend to ask for 10000 coins but only paid $1, this blocks it.
      if (Math.abs(calculatedCoins - expectedCoins) > 1) { // 1 coin buffer for floats
        throw new BadRequestException(
          `Payment amount mismatch. Paid $${usdPaid} which equals ${calculatedCoins} Coins, but requested ${expectedCoins} Coins.`
        );
      }

      // Safe to credit
      await this.walletService.deposit(
        req.user.userId,
        calculatedCoins,          // Amount (Coins)
        'PAYPAL',                 // Method
        captureResult.data.captureId, // Reference
        JSON.stringify({ paypalOrderId: orderId, usdPaid, rate }), // Metadata
        'USD',                    // Original Currency
        rate                      // Conversion Rate Used
      );

      await this.notificationsService.create(
        req.user.userId,
        'International Deposit Successful 🌎💳',
        `${calculatedCoins} Coins have been securely added to your wallet.`,
        'success',
        '/dashboard/wallet',
      );

      return {
        success: true,
        message: 'Payment verified and coins added.',
        coinsAdded: calculatedCoins,
        usdPaid,
      };
    }

    throw new BadRequestException('Payment capture failed.');
  }
}
