import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const { Cashfree } = require('cashfree-pg');
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly appId: string;
  private readonly secretKey: string;
  private readonly env: string;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('CASHFREE_APP_ID') || '';
    this.secretKey =
      this.configService.get<string>('CASHFREE_SECRET_KEY') || '';
    this.env = this.configService.get<string>('CASHFREE_ENV') || 'SANDBOX';

    if (this.appId && this.secretKey) {
      Cashfree.XClientId = this.appId;
      Cashfree.XClientSecret = this.secretKey;
      // Use the Cashfree SDK Environment enum correctly
      Cashfree.XEnvironment =
        this.env === 'PRODUCTION'
          ? Cashfree.Environment?.PRODUCTION ?? 'https://api.cashfree.com/pg'
          : Cashfree.Environment?.SANDBOX ?? 'https://sandbox.cashfree.com/pg';
    }
  }

  async createOrder(
    amount: number,
    userId: string,
    userEmail?: string,
    userPhone?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (this.appId && this.secretKey) {
      try {
        const orderId = `ORD${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        // Cashfree requires customer_id to be alphanumeric, max 50 chars
        const safeCustomerId = userId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 50) || 'user001';

        const request = {
          order_amount: amount,
          order_currency: 'INR',
          order_id: orderId,
          customer_details: {
            customer_id: safeCustomerId,
            customer_phone: userPhone || '9999999999',
            customer_name: 'Gamer',
            customer_email: userEmail || 'gamer@protocol.app',
          },
          order_meta: {
            return_url: `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/tournaments?order_id={order_id}`,
          },
        };

        console.log(`[CASHFREE] Creating Order: ${orderId} | Env: ${this.env} | Amount: ₹${amount}`);

        const response = await Cashfree.PGCreateOrder('2023-08-01', request);

        console.log(`[CASHFREE] Order Created: ${response.data?.payment_session_id}`);

        return {
          payment_session_id: response.data.payment_session_id,
          order_id: response.data.order_id,
          cf_env: this.env,
        };
      } catch (error: any) {
        const cfError = error.response?.data;
        console.error(
          '[CASHFREE ERROR] Create Order Failed:',
          JSON.stringify(cfError || error.message),
        );
        const userMsg =
          cfError?.message ||
          cfError?.error ||
          error.message ||
          'Payment gateway error';
        throw new BadRequestException(userMsg);
      }
    }

    // Fallback: Mock order for dev
    return {
      payment_session_id: `mock_session_${Date.now()}`,
      order_id: `order_${Date.now()}`,
      cf_env: 'SANDBOX',
    };
  }

  async verifyPayment(orderId: string) {
    if (!orderId) {
      throw new BadRequestException('Order ID is required');
    }

    if (this.appId && this.secretKey) {
      try {
        console.log(`[CASHFREE] Verifying Order: ${orderId}`);
        const response = await Cashfree.PGFetchOrder('2023-08-01', orderId);
        const order = response.data;

        console.log(`[CASHFREE] Order Status: ${order.order_status} | Amount: ${order.order_amount}`);

        if (order.order_status === 'PAID') {
          return {
            success: true,
            message: 'Payment verified successfully',
            orderId: order.order_id,
            paymentId: order.cf_order_id,
            amount: order.order_amount,
          };
        } else {
          throw new BadRequestException(
            `Payment status is ${order.order_status}`,
          );
        }
      } catch (error: any) {
        console.error(
          '[CASHFREE ERROR] Verify Failed:',
          error.response?.data || error.message,
        );
        if (error instanceof BadRequestException) throw error;
        throw new BadRequestException('Payment verification failed');
      }
    }

    // Mock Verify
    return {
      success: true,
      message: 'Payment mock verified',
      orderId: orderId,
      paymentId: 'mock_payment_id',
      amount: 100,
    };
  }

  async verifyWebhook(body: any, signature: string) {
    return true;
  }
}
