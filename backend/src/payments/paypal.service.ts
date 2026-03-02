import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PaypalService {
    private readonly logger = new Logger(PaypalService.name);
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly isProduction: boolean;
    private readonly baseUrl: string;

    constructor(private configService: ConfigService) {
        this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID') || '';
        this.clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET') || '';
        const env = this.configService.get<string>('PAYPAL_MODE') || 'sandbox';
        this.isProduction = env === 'live';
        this.baseUrl = this.isProduction
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    private async getAccessToken(): Promise<string> {
        if (!this.clientId || !this.clientSecret) {
            throw new BadRequestException('PayPal credentials are not configured.');
        }

        const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        try {
            const response = await axios.post(
                `${this.baseUrl}/v1/oauth2/token`,
                'grant_type=client_credentials',
                {
                    headers: {
                        Authorization: `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );
            return response.data.access_token;
        } catch (error: any) {
            this.logger.error('Failed to get PayPal Access Token', error?.response?.data || error.message);
            throw new BadRequestException('Failed to authenticate with PayPal.');
        }
    }

    async createOrder(amount: number, currencyCode: string = 'USD'): Promise<{ id: string }> {
        if (amount <= 0) {
            throw new BadRequestException('Order amount must be greater than 0');
        }

        const accessToken = await this.getAccessToken();

        const body = {
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: currencyCode,
                        value: Number(amount).toFixed(2),
                    },
                },
            ],
            application_context: {
                shipping_preference: 'NO_SHIPPING',
            }
        };

        try {
            const response = await axios.post(
                `${this.baseUrl}/v2/checkout/orders`,
                body,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            return { id: response.data.id };
        } catch (error: any) {
            this.logger.error('Failed to create PayPal Order', error?.response?.data || error.message);
            throw new BadRequestException('Failed to generate PayPal order.');
        }
    }

    async captureOrder(orderId: string): Promise<{ success: boolean; data: any }> {
        const accessToken = await this.getAccessToken();

        try {
            const response = await axios.post(
                `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            const captureData = response.data;
            if (captureData.status === 'COMPLETED') {
                const purchaseUnit = captureData.purchase_units[0];
                const capture = purchaseUnit.payments.captures[0];
                return {
                    success: true,
                    data: {
                        amount: parseFloat(capture.amount.value),
                        currency: capture.amount.currency_code,
                        captureId: capture.id,
                    },
                };
            } else {
                throw new BadRequestException(`Order capture status is ${captureData.status}`);
            }
        } catch (error: any) {
            this.logger.error(`Failed to capture PayPal Order ${orderId}`, error?.response?.data || error.message);
            const isCardDeclined = error?.response?.data?.details?.[0]?.issue === 'INSTRUMENT_DECLINED';
            if (isCardDeclined) {
                throw new BadRequestException('The payment was declined by the card issuer.');
            }
            throw new BadRequestException('Failed to capture PayPal order.');
        }
    }
}
