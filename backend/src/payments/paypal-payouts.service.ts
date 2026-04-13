import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * PaypalPayoutsService
 * Sends USD / GBP payouts directly to a user's PayPal email
 * using the PayPal Payouts API v1 (mass payout endpoint).
 */
@Injectable()
export class PaypalPayoutsService {
    private readonly logger = new Logger(PaypalPayoutsService.name);
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly mode: 'sandbox' | 'live';
    private readonly baseUrl: string;

    constructor(private configService: ConfigService) {
        this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID') || '';
        this.clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET') || '';
        const rawMode = this.configService.get<string>('PAYPAL_MODE') || 'sandbox';
        this.mode = rawMode === 'live' ? 'live' : 'sandbox';
        this.baseUrl = this.mode === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    /** Get a fresh OAuth access token from PayPal */
    private async getAccessToken(): Promise<string> {
        const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        const response = await axios.post(
            `${this.baseUrl}/v1/oauth2/token`,
            'grant_type=client_credentials',
            {
                headers: {
                    Authorization: `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            },
        );
        return response.data.access_token;
    }

    /**
     * Send a payout to a single PayPal email.
     * Used for USD/GBP withdrawal approvals.
     *
     * @param paypalEmail  Recipient's PayPal email address
     * @param amount       Monetary amount (in the given currency)
     * @param currency     'USD' or 'GBP'
     * @param senderItemId Unique ID for this payout (use withdrawal transaction ID)
     * @param note         Optional note to recipient
     */
    async sendPayout(params: {
        paypalEmail: string;
        amount: number;
        currency: 'USD' | 'GBP';
        senderItemId: string;
        note?: string;
    }) {
        const { paypalEmail, amount, currency, senderItemId, note = 'Protocol Tournament Withdrawal' } = params;

        if (!this.clientId || !this.clientSecret) {
            this.logger.warn('[MOCK] PayPal keys missing — returning mock success.');
            return {
                success: true,
                batchId: `MOCK_BATCH_${Date.now()}`,
                status: 'SUCCESS',
                message: 'Mock PayPal payout (no keys)',
            };
        }

        try {
            const accessToken = await this.getAccessToken();

            const body = {
                sender_batch_header: {
                    sender_batch_id: `PROTOCOL_${senderItemId}_${Date.now()}`,
                    email_subject: 'You have a withdrawal from Protocol Tournament!',
                    email_message: 'Your tournament winnings have been sent to your PayPal account.',
                },
                items: [
                    {
                        recipient_type: 'EMAIL',
                        amount: {
                            value: amount.toFixed(2),
                            currency,
                        },
                        receiver: paypalEmail,
                        note,
                        sender_item_id: senderItemId,
                    },
                ],
            };

            this.logger.log(`[PAYPAL PAYOUT] Sending ${amount} ${currency} → ${paypalEmail} | ItemID: ${senderItemId}`);

            const response = await axios.post(
                `${this.baseUrl}/v1/payments/payouts`,
                body,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            const batchId = response.data.batch_header?.payout_batch_id;
            this.logger.log(`[PAYPAL PAYOUT] Batch created: ${batchId}`);

            return {
                success: true,
                batchId,
                status: response.data.batch_header?.batch_status || 'PENDING',
                rawData: response.data,
            };
        } catch (error: any) {
            const ppError = error.response?.data;
            this.logger.error('[PAYPAL PAYOUT ERROR]', JSON.stringify(ppError || error.message));
            throw new BadRequestException(
                ppError?.message || ppError?.name || 'PayPal payout failed',
            );
        }
    }

    /**
     * Get status of a PayPal payout batch
     */
    async getPayoutStatus(batchId: string) {
        try {
            const accessToken = await this.getAccessToken();
            const response = await axios.get(
                `${this.baseUrl}/v1/payments/payouts/${batchId}`,
                { headers: { Authorization: `Bearer ${accessToken}` } },
            );
            return response.data;
        } catch (error: any) {
            this.logger.error('[PAYPAL PAYOUT STATUS ERROR]', error.response?.data || error.message);
            throw new BadRequestException('Failed to fetch PayPal payout status');
        }
    }
}
