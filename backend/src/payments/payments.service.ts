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
    const envUrl = this.configService.get<string>('FRONTEND_URL');

    // Prioritize explicit https URLs from environment (e.g. ngrok or production domains)
    if (envUrl && envUrl.startsWith('https://')) {
      return envUrl;
    }

    // Cashfree PRODUCTION mode strictly requires HTTPS for return URLs.
    if (this.isProduction) {
      if (envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
        console.warn('[CASHFREE] Detected localhost in PRODUCTION mode. Using FRONTEND_URL env fallback.');
        const fallback = this.configService.get<string>('FRONTEND_URL_PROD') || 'https://protocols-turnaments.vercel.app';
        return fallback;
      }
      if (!envUrl) {
        const fallback = this.configService.get<string>('FRONTEND_URL_PROD') || 'https://protocols-turnaments.vercel.app';
        return fallback;
      }
      return envUrl.startsWith('http://') ? envUrl.replace('http://', 'https://') : `https://${envUrl}`;
    }

    return envUrl || 'http://localhost:3000';
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

    // Ensure return URL is HTTPS if in PRODUCTION
    let finalReturnUrl = returnUrl || `${this.getHttpsFrontendUrl()}/dashboard/wallet?order_id={order_id}`;
    if (this.isProduction && !finalReturnUrl.startsWith('https://')) {
      console.warn(`[CASHFREE] Production mode requires HTTPS return URL. Converting ${finalReturnUrl} to https if possible.`);
      finalReturnUrl = finalReturnUrl.replace('http://', 'https://');
    }

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
        return_url: finalReturnUrl,
      },
    };

    console.log(`[CASHFREE] Creating Order: ${orderId} | Env: ${this.baseUrl} | Amount: ₹${amount}`);

    try {
      const response = await axios.post(
        `${this.baseUrl}/orders`,
        body,
        { 
          headers: this.headers(),
          timeout: 10000 // 10 second timeout
        },
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

      let msg = cfError?.message || cfError?.error || error.message || 'Payment gateway error';
      if (cfError?.code === 'order_meta.return_url_invalid') {
        msg = 'Cashfree Production requires an HTTPS return URL. For local testing, please use ngrok or switch to SANDBOX mode.';
      }

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
        { 
          headers: this.headers(),
          timeout: 10000 
        },
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

  async verifyWebhook(body: any, signature: string, timestamp: string, rawBody?: string) {
    if (!this.secretKey) {
      console.warn('[SECURITY] Webhook verification skipped because CASHFREE_SECRET_KEY is missing.');
      return false; // Fail secure: If there's no secret key, we shouldn't process webhooks.
    }

    if (!signature) {
      console.warn('[SECURITY] Missing x-webhook-signature in webhook request logs.');
      return false;
    }

    try {
      const crypto = require('crypto');
      const ts = timestamp || String(Date.now()); // Fallback if missing

      // FOR PERFECT ACCURACY:
      // We prioritize the raw buffer (rawBody) provided by NestJS middleware.
      // If not available, we fall back to stringifying the body (less reliable).
      const payloadString = rawBody || (typeof body === 'string' ? body : JSON.stringify(body));

      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(ts + payloadString)
        .digest('base64');

      const isWaitMatch = signature === expectedSignature;

      if (!isWaitMatch && !rawBody) {
        console.warn('[SECURITY] Webhook signature mismatch. Note: rawBody was missing, which may cause stringification issues.');
      }

      return isWaitMatch;

    } catch (err: any) {
      console.error('[SECURITY] Webhook signature verification error:', err.message);
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
        { 
          headers: this.headers(),
          timeout: 15000 // Refunds can take slightly longer
        },
      );
      return response.data;
    } catch (error: any) {
      const cfError = error.response?.data;
      console.error('[CASHFREE ERROR] Refund Failed:', JSON.stringify(cfError || error.message));
      throw new BadRequestException(cfError?.message || 'Refund processing failed');
    }
  }
}
