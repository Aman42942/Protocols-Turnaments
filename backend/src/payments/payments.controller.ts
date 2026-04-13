import { Controller, Post, Body, UseGuards, Request, Get, Param, RawBodyRequest, Inject, forwardRef } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaypalService } from './paypal.service';
import { CashfreePayoutsService } from './cashfree-payouts.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/role.enum';
import { BadRequestException, Logger } from '@nestjs/common';
import { TournamentsService } from '../tournaments/tournaments.service';
import { PaymentRoutingService } from '../admin-operations/services/payment-routing.service';
import { WiseService } from './services/wise.service';
import { PayoneerService } from './services/payoneer.service';
import axios from 'axios';

import { Admin2faGuard } from '../auth/admin-2fa.guard';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
    private readonly paypalService: PaypalService,
    private readonly cashfreePayoutsService: CashfreePayoutsService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => TournamentsService))
    private readonly tournamentsService: TournamentsService,
    private readonly routingService: PaymentRoutingService,
    private readonly wiseService: WiseService,
    private readonly payoneerService: PayoneerService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('available-methods')
  async getAvailableMethods(@Request() req) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    
    let country = 'Other';
    if (ip !== '::1' && ip !== '127.0.0.1') {
      try {
        const { data } = await axios.get(`http://ip-api.com/json/${ip}`);
        if (data.status === 'success') {
          country = data.country;
        }
      } catch (e) {
        this.logger.error(`Geo-lookup failed for payment routing: ${e.message}`);
      }
    }

    const gateways = await this.routingService.getGatewaysForCountry(country);
    
    return {
      country,
      methods: gateways,
      allMethods: ['CASHFREE', 'PAYPAL', 'PAYONEER', 'WISE'],
    };
  }

  @UseGuards(JwtAuthGuard)

  @Post('create-order')
  async createOrder(
    @Request() req, 
    @Body('amount') amount: number,
    @Body('phone') phone?: string
  ) {
    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required');
    }
    // Pass User ID and Phone for Cashfree Customer Details
    return this.paymentsService.createOrder(amount, req.user.userId, undefined, phone);
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

  @UseGuards(JwtAuthGuard, RolesGuard, Admin2faGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.ULTIMATE_ADMIN)
  @Post('admin/refund')
  async adminRefund(
    @Body('order_id') orderId: string,
    @Body('amount') amount: number,
    @Body('userId') userId: string,
    @Body('tournamentId') tournamentId?: string,
    @Body('tournamentTitle') tournamentTitle?: string,
    @Body('refund_to_wallet') refundToWallet?: boolean,
    @Request() req?,
  ) {
    this.logger.log(`[ADMIN REFUND] Request for User: ${userId} | Order: ${orderId} | Tournament: ${tournamentId} | ToWallet: ${refundToWallet}`);

    // 0. GLOBAL DUPLICATE PROTECTION: Check if any refund already exists for this orderId
    if (orderId && orderId !== 'N/A') {
      const existingRefund = await this.prisma.transaction.findFirst({
        where: {
          type: 'REFUND',
          status: 'COMPLETED',
          reference: orderId,
        },
      });

      if (existingRefund) {
        throw new BadRequestException('A refund for this transaction reference has already been processed.');
      }
    }

    // 1. Auto-detect Tournament if not provided (via Reference)
    if (!tournamentId && orderId) {
      const originalTx = await this.prisma.transaction.findFirst({
        where: { reference: orderId, type: 'DEPOSIT' },
      });

      if (originalTx?.metadata) {
        try {
          const meta = JSON.parse(originalTx.metadata);
          tournamentId = meta.tournamentId;
        } catch (e) { /* ignore */ }
      }
    }

    // 2. UNIFIED FLOW: If linked to a tournament, use the tournament refund service
    if (tournamentId) {
      const participant = await this.prisma.tournamentParticipant.findFirst({
        where: { tournamentId, userId, paymentStatus: 'PAID' },
      });

      if (participant) {
        const result = await this.tournamentsService.refundParticipant(
          tournamentId,
          participant.id,
          req?.user?.userId || 'ADMIN',
          req?.ip || '0.0.0.0',
          !!refundToWallet
        );
        return {
          success: true,
          message: `Successfully refunded ₹${result.amount} to ${refundToWallet ? 'Wallet' : 'Original Source'} and removed user from tournament.`,
          participant: result.updatedParticipant,
        };
      }
    }

    // 3. FALLBACK: Direct Fiat/Wallet Refund (if no tournament active status found)
    
    // If admin explicitly chose to refund to wallet, bypass gateway logic
    if (refundToWallet) {
        await this.walletService.refundTournamentEntry(userId, amount, 'N/A', tournamentTitle || 'Wallet Refund (Manual)', orderId, true);
        return { success: true, message: 'Refunded to user wallet successfully.' };
    }

    if (!orderId || (!orderId.startsWith('ORD') && !orderId.startsWith('PAYPAL'))) {
        // Manual Wallet Balance adjustment refund (default for non-gateway refs)
        await this.walletService.refundTournamentEntry(userId, amount, 'N/A', tournamentTitle || 'Manual Refund', orderId);
        return { success: true, message: 'Wallet balance adjusted successfully (Manual).' };
    }

    // Direct Gateway Refund
    if (orderId.startsWith('PAYPAL')) {
        await this.paypalService.refundCapture(orderId, amount);
        // Record Gateway Refund in DB (No Wallet Credit)
        await this.walletService.refundTournamentEntry(userId, amount, 'N/A', 'PayPal Gateway Refund', orderId, false);
        return { success: true, message: 'PayPal gateway refund processed.' };
    }

    const refundResult = await this.paymentsService.createRefund(orderId, amount);
    // Record Gateway Refund in DB (No Wallet Credit)
    await this.walletService.refundTournamentEntry(userId, amount, 'N/A', 'Cashfree Gateway Refund', orderId, false);
    return {
      success: true,
      message: 'Cashfree gateway refund processed.',
      cashfree: refundResult,
    };
  }

  // --- PAYPAL ENDPOINTS --- //

  @UseGuards(JwtAuthGuard)
  @Post('paypal/create-order')
  async createPaypalOrder(
    @Request() req,
    @Body('usdAmount') amount: number,
    @Body('currency') currency?: string
  ) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Valid payment amount is required');
    }
    return this.paypalService.createOrder(amount, currency || 'USD');
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
      const currency = captureResult.data.currency; // 'USD' or 'GBP'

      // Fetch rate from CMS or fallback
      const rateConfigKey = currency === 'GBP' ? 'GBP_TO_COIN_RATE' : 'PAYPAL_EXCHANGE_RATE';
      const cmsRate = await this.prisma.siteContent.findUnique({ where: { key: rateConfigKey } });

      let rate = 85; // Default for USD
      if (currency === 'GBP') rate = 110; // Default for GBP

      if (cmsRate && cmsRate.value) {
        rate = Number(cmsRate.value) || rate;
      } else if (currency === 'USD') {
        rate = Number(this.configService.get<string>('PAYPAL_EXCHANGE_RATE')) || rate;
      }

      const paidAmount = captureResult.data.amount;
      const calculatedCoins = paidAmount * rate;

      // Ensure that the coins requested by the frontend match the amount actually paid on PayPal.
      if (Math.abs(calculatedCoins - expectedCoins) > 1) { // 1 coin buffer for floats
        throw new BadRequestException(
          `Payment amount mismatch. Paid ${paidAmount} ${currency} which equals ${calculatedCoins} Coins, but requested ${expectedCoins} Coins.`
        );
      }

      // Safe to credit
      await this.walletService.deposit(
        req.user.userId,
        calculatedCoins,          // Amount (Coins)
        'PAYPAL',                 // Method
        captureResult.data.captureId, // Reference
        JSON.stringify({ paypalOrderId: orderId, paidAmount, rate, currency }), // Metadata
        currency,                    // Original Currency
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
        usdPaid: paidAmount,
        currency
      };
    }

    throw new BadRequestException('Payment capture failed.');
  }

  /**
   * POST /payments/payout-webhook
   * Cashfree sends async payout event updates here.
   * Events handled: TRANSFER_SUCCESS, TRANSFER_FAILED
   */
  @Post('payout-webhook')
  async handlePayoutWebhook(@Request() req, @Body() body: any) {
    const signature = req.headers['x-webhook-signature'] as string;
    const timestamp = req.headers['x-webhook-timestamp'] as string;

    // Verify webhook authenticity
    const rawBody = JSON.stringify(body);
    const isValid = this.cashfreePayoutsService.verifyWebhookSignature(rawBody, signature || '', timestamp || '');

    if (!isValid) {
      this.logger.warn('[PAYOUT WEBHOOK] Invalid signature — ignoring event');
      // Return 200 to prevent Cashfree from retrying with invalid signature
      return { status: 'ignored', reason: 'invalid_signature' };
    }

    const eventType: string = body.type || body.event || '';
    const transferData = body.data?.transfer || body.transfer || body.data || {};
    const transferId: string = transferData.transfer_id || transferData.transferId || '';
    const utr: string = transferData.utr || '';

    this.logger.log(`[PAYOUT WEBHOOK] Event: ${eventType} | TransferID: ${transferId}`);

    if (!transferId) {
      return { status: 'ok', note: 'no_transfer_id' };
    }

    // Find the matching transaction by reference
    const tx = await this.prisma.transaction.findFirst({
      where: { reference: { contains: transferId } },
      include: { wallet: { include: { user: true } } },
    });

    if (!tx) {
      this.logger.warn(`[PAYOUT WEBHOOK] No transaction found for transferId: ${transferId}`);
      return { status: 'ok', note: 'transaction_not_found' };
    }

    if (eventType === 'TRANSFER_SUCCESS' || eventType === 'transfer.success') {
      await this.prisma.transaction.update({
        where: { id: tx.id },
        data: {
          status: 'COMPLETED',
          description: `${tx.description} — CONFIRMED via webhook (UTR: ${utr})`,
        },
      });
      // Deduct from frozenBalance now
      await this.prisma.wallet.update({
        where: { id: tx.walletId },
        data: { frozenBalance: { decrement: tx.amount } },
      });
      await this.notificationsService.create(
        tx.wallet.user.id,
        'Withdrawal Confirmed ✅',
        `Your withdrawal has been successfully credited! UTR: ${utr}`,
        'success',
        '/dashboard/wallet',
      );
      this.logger.log(`[PAYOUT WEBHOOK] Transfer ${transferId} SUCCEEDED. TX ${tx.id} marked COMPLETED.`);

    } else if (eventType === 'TRANSFER_FAILED' || eventType === 'transfer.failed') {
      await this.prisma.transaction.update({
        where: { id: tx.id },
        data: {
          status: 'FAILED',
          description: `${tx.description} — FAILED via webhook`,
        },
      });
      // Unlock frozen coins back to balance
      await this.prisma.wallet.update({
        where: { id: tx.walletId },
        data: {
          balance: { increment: tx.amount },
          frozenBalance: { decrement: tx.amount },
        },
      });
      await this.notificationsService.create(
        tx.wallet.user.id,
        'Withdrawal Failed ❌',
        `Your withdrawal failed and ${tx.amount} coins have been returned to your wallet.`,
        'error',
        '/dashboard/wallet',
      );
      this.logger.log(`[PAYOUT WEBHOOK] Transfer ${transferId} FAILED. Coins refunded to user.`);
    }

    return { status: 'ok' };
  }

  /**
   * GET /payments/payout-status/:transferId
   * Admin manually polls Cashfree for the latest transfer status
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.ULTIMATE_ADMIN)
  @Get('payout-status/:transferId')
  async getPayoutStatus(@Param('transferId') transferId: string) {
    const cfStatus = await this.cashfreePayoutsService.getTransferStatus(transferId);

    // Update DB if status changed to SUCCESS or FAILED
    const tx = await this.prisma.transaction.findFirst({
      where: { reference: { contains: transferId } },
      include: { wallet: true },
    });

    if (tx && tx.status === 'PENDING') {
      if (cfStatus.status === 'SUCCESS' || cfStatus.status === 'COMPLETED') {
        await this.prisma.transaction.update({
          where: { id: tx.id },
          data: { status: 'COMPLETED', description: `${tx.description} — Confirmed by admin poll` },
        });
        await this.prisma.wallet.update({
          where: { id: tx.walletId },
          data: { frozenBalance: { decrement: tx.amount } },
        });
      } else if (cfStatus.status === 'FAILED' || cfStatus.status === 'REVERSED') {
        await this.prisma.transaction.update({
          where: { id: tx.id },
          data: { status: 'FAILED', description: `${tx.description} — Failed confirmed by admin poll` },
        });
        await this.prisma.wallet.update({
          where: { id: tx.walletId },
          data: { balance: { increment: tx.amount }, frozenBalance: { decrement: tx.amount } },
        });
      }
    }

    return { transferId, cashfreeStatus: cfStatus, transactionId: tx?.id };
  }
}
