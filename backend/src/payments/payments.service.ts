import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PaymentsService {
  private readonly appId: string;
  private readonly secretKey: string;
  private readonly isProduction: boolean;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('CASHFREE_APP_ID') || '';
    this.secretKey = this.configService.get<string>('CASHFREE_SECRET_KEY') || '';
    const env = this.configService.get<string>('CASHFREE_ENV') || 'SANDBOX';
    this.isProduction = env === 'PRODUCTION';
    this.baseUrl = this.isProduction
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
  }

  private headers() {
    return {
      'x-client-id': this.appId,
      'x-client-secret': this.secretKey,
      'x-api-version': '2023-08-01',
      'Content-Type': 'application/json',
    };
  }

  private getHttpsFrontendUrl(): string {
    const url = this.configService.get<string>('FRONTEND_URL') || '';
    // Cashfree requires HTTPS — fallback to production Vercel URL if local/http
    if (!url || url.startsWith('http://') || url.includes('localhost') || url.includes('127.0.0.1')) {
      return 'https://protocols-turnaments.vercel.app';
    }
    return url;
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

    // No Cashfree keys set — mock for local dev
    if (!this.appId || !this.secretKey) {
      return {
        payment_session_id: `mock_session_${Date.now()}`,
        order_id: `order_${Date.now()}`,
        cf_env: 'SANDBOX',
      };
    }

    const orderId = `ORD${Date.now()}`;
    const safeCustomerId = userId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 50) || 'user001';

    const body = {
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
        return_url: `${this.getHttpsFrontendUrl()}/tournaments?order_id={order_id}`,
      },
    };

    console.log(`[CASHFREE] Creating Order: ${orderId} | Env: ${this.baseUrl} | Amount: ₹${amount}`);

    try {
      const response = await axios.post(
        `${this.baseUrl}/orders`,
        body,
        { headers: this.headers() },
      );
      const data = response.data;
      console.log(`[CASHFREE] Order Created: ${data.payment_session_id}`);
      return {
        payment_session_id: data.payment_session_id,
        order_id: data.order_id,
        cf_env: this.isProduction ? 'PRODUCTION' : 'SANDBOX',
      };
    } catch (error: any) {
      const cfError = error.response?.data;
      console.error('[CASHFREE ERROR] Create Order Failed:', JSON.stringify(cfError || error.message));
      const msg = cfError?.message || cfError?.error || error.message || 'Payment gateway error';
      throw new BadRequestException(msg);
    }
  }

  async verifyPayment(orderId: string) {
    if (!orderId) throw new BadRequestException('Order ID is required');

    if (!this.appId || !this.secretKey) {
      return { success: true, message: 'Payment mock verified', orderId, paymentId: 'mock_payment_id', amount: 100 };
    }

    try {
      console.log(`[CASHFREE] Verifying Order: ${orderId}`);
      const response = await axios.get(
        `${this.baseUrl}/orders/${orderId}`,
        { headers: this.headers() },
      );
      const order = response.data;
      console.log(`[CASHFREE] Order Status: ${order.order_status}`);

      if (order.order_status === 'PAID') {
        return {
          success: true,
          message: 'Payment verified successfully',
          orderId: order.order_id,
          paymentId: order.cf_order_id,
          amount: order.order_amount,
        };
      }
      throw new BadRequestException(`Payment status is ${order.order_status}`);
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      console.error('[CASHFREE ERROR] Verify Failed:', error.response?.data || error.message);
      throw new BadRequestException('Payment verification failed');
    }
  }

  async verifyWebhook(body: any, signature: string) {
    return true;
  }
}
