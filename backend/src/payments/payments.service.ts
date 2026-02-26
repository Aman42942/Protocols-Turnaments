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
    this.env = this.configService.get<string>('CASHFREE_ENV') || 'SANDBOX'; // SANDBOX or PRODUCTION

    if (this.appId && this.secretKey) {
      Cashfree.XClientId = this.appId;
      Cashfree.XClientSecret = this.secretKey;
      // Use string values directly instead of enum which is undefined
      Cashfree.XEnvironment =
        this.env === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
    }
  }

  async createOrder(
    amount: number,
    userId: string,
    userPhone: string = '9999999999',
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (this.appId && this.secretKey) {
      try {
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const request = {
          order_amount: amount,
          order_currency: 'INR',
          order_id: orderId,
          customer_details: {
            customer_id: userId,
            customer_phone: userPhone,
            customer_name: 'Gamer',
            customer_email: 'gamer@example.com',
          },
          order_meta: {
            return_url: `${this.configService.get('FRONTEND_URL')}/dashboard/wallet?order_id={order_id}`,
          },
        };

        console.log(`[CASHFREE] Creating Order: ${orderId} | Env: ${this.env}`);
        console.log(`[CASHFREE] AppId prefix: ${this.appId.substring(0, 5)}...`);

        const response = await Cashfree.PGCreateOrder('2023-08-01', request);

        console.log(`[CASHFREE] Order Created Success: ${response.data.payment_session_id}`);

        return {
          payment_session_id: response.data.payment_session_id,
          order_id: response.data.order_id,
          cf_env: this.env,
        };
      } catch (error: any) {
        console.error(
          '[CASHFREE ERROR] Create Order Failed:',
          error.response?.data || error.message,
        );
        throw new BadRequestException(
          error.response?.data?.message || 'Payment gateway error',
        );
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
            paymentId: order.cf_order_id, // Internal CF ID
            amount: order.order_amount,
          };
        } else {
          console.warn(`[CASHFREE] Order NOT PAID: ${order.order_status}`);
          throw new BadRequestException(
            `Payment status is ${order.order_status}`,
          );
        }
      } catch (error: any) {
        console.error(
          '[CASHFREE ERROR] Verify Failed:',
          error.response?.data || error.message,
        );
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
