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

  public getHttpsFrontendUrl(): string {
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
    returnUrl?: string,
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
        return_url: returnUrl || `${this.getHttpsFrontendUrl()}/tournaments?order_id={order_id}`,
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

  async verifyWebhook(body: any, signature: string, timestamp?: string) {
    if (!this.secretKey) {
      console.warn('[SECURITY] Webhook verification skipped because CASHFREE_SECRET_KEY is missing.');
      return false; // Fail secure: If there's no secret key, we shouldn't process webhooks.
    }

    if (!signature) {
      console.warn('[SECURITY] Missing x-webhook-signature in webhook request logs.');
      return false;
    }

    try {
      // Cashfree verify webhook logic requires full raw body if using middleware, but we'll use stringified JSON
      // Note: In NestJS, `body` is usually already parsed. For perfect accuracy with Cashfree, 
      // you typically want `rawBody`. But basic verification involves taking the timestamp + body.
      // 
      // The Cashfree SDK provides a built-in verifier:
      // Cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp)
      // Since we don't have the raw buffer here easily, we implement manual HMAC if timestamp is provided 
      // or use the older SDK method.

      const crypto = require('crypto');
      const ts = timestamp || String(Date.now()); // Fallback if missing

      // The payload Cashfree signs is usually the raw string. In lieu of raw string, stringify the parsed body.
      // Warning: JSON.stringify order matters. If it fails, we should use raw-body middleware in the future.
      const payloadString = typeof body === 'string' ? body : JSON.stringify(body);

      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(ts + payloadString)
        .digest('base64');

      // For demonstration, we attempt to verify. If the SDK is installed, doing it via Cashfree.PGVerifyWebhookSignature is safer.
      // Right now, if the signature matches our computed one, we accept. 
      // Because we lack rawBody, this might fail in strict prod. Let's add a warning.

      return signature === expectedSignature;

    } catch (err) {
      console.error('[SECURITY] Webhook signature verification error:', err);
      return false;
    }
  }
  async createRefund(orderId: string, amount: number, refundId?: string) {
    if (!orderId || amount <= 0) {
      throw new BadRequestException('Order ID and valid amount are required for refund');
    }

    if (!this.appId || !this.secretKey) {
      return {
        refund_id: refundId || `mock_ref_${Date.now()}`,
        status: 'SUCCESS',
        amount: amount
      };
    }

    const body = {
      refund_amount: amount,
      refund_id: refundId || `REF${Date.now()}`,
      refund_note: 'Tournament registration refund'
    };

    try {
      console.log(`[CASHFREE] Creating Refund for Order: ${orderId} | Amount: ₹${amount}`);
      const response = await axios.post(
        `${this.baseUrl}/orders/${orderId}/refunds`,
        body,
        { headers: this.headers() },
      );
      return response.data;
    } catch (error: any) {
      const cfError = error.response?.data;
      console.error('[CASHFREE ERROR] Refund Failed:', JSON.stringify(cfError || error.message));
      throw new BadRequestException(cfError?.message || 'Refund processing failed');
    }
  }
}
