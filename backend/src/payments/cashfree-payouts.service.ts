import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface CashfreeTransferParams {
    transferId: string;
    amount: number;           // Real-world INR amount (NOT coins)
    name: string;
    email?: string;
    phone?: string;
    // UPI
    vpa?: string;
    // Bank
    bankAccount?: string;
    ifsc?: string;
    transferMode?: 'upi' | 'imps' | 'neft' | 'rtgs';
    remark?: string;
}

@Injectable()
export class CashfreePayoutsService {
    private readonly logger = new Logger(CashfreePayoutsService.name);
    private readonly appId: string;
    private readonly secretKey: string;
    private readonly isProduction: boolean;
    private readonly baseUrl: string;

    constructor(private configService: ConfigService) {
        this.appId = this.configService.get<string>('CASHFREE_APP_ID') || '';
        this.secretKey = this.configService.get<string>('CASHFREE_SECRET_KEY') || '';
        const env = this.configService.get<string>('CASHFREE_ENV') || 'SANDBOX';
        this.isProduction = env === 'PRODUCTION' || env === 'PROD';

        // Cashfree Payouts V2 base URLs
        this.baseUrl = this.isProduction
            ? 'https://api.cashfree.com/payout'
            : 'https://sandbox.cashfree.com/payout';
    }

    private headers() {
        return {
            'x-client-id': this.appId,
            'x-client-secret': this.secretKey,
            'x-api-version': '2024-01-01',
            'Content-Type': 'application/json',
        };
    }

    /**
     * Request a direct transfer using Cashfree Payouts V2
     * Uses INLINE beneficiary details — no pre-registration required.
     *
     * Supports:
     *   - UPI (requires vpa)
     *   - Bank (requires bankAccount + ifsc, mode = imps/neft/rtgs)
     */
    async requestTransfer(params: CashfreeTransferParams) {
        const {
            transferId,
            amount,
            name,
            email = 'user@protocol.app',
            phone = '9999999999',
            vpa,
            bankAccount,
            ifsc,
            transferMode,
            remark = 'Protocol Tournament Withdrawal',
        } = params;

        // Determine mode
        let mode = transferMode;
        if (!mode) {
            mode = vpa ? 'upi' : 'imps';
        }

        if (!this.appId || !this.secretKey) {
            this.logger.warn('[MOCK] Cashfree Payouts keys missing — returning mock success.');
            return {
                success: true,
                transferId,
                cf_transfer_id: `MOCK_${Date.now()}`,
                status: 'SUCCESS',
                message: 'Mock Transfer Successful (no keys)',
            };
        }

        // Build inline beneficiary instrument details
        const beneficiaryInstrumentDetails: any = {};
        if (mode === 'upi' && vpa) {
            beneficiaryInstrumentDetails.vpa = vpa;
        } else if (bankAccount && ifsc) {
            beneficiaryInstrumentDetails.bank_account_number = bankAccount;
            beneficiaryInstrumentDetails.ifsc = ifsc;
        } else {
            throw new BadRequestException('Either UPI VPA or Bank Account + IFSC must be provided for payout');
        }

        const body = {
            transfer_id: transferId,
            transfer_amount: amount,
            transfer_currency: 'INR',
            transfer_mode: mode,
            transfer_remarks: remark,
            beneficiary_details: {
                beneficiary_id: `BEN_${transferId.substring(0, 20)}`,
                beneficiary_name: name,
                beneficiary_contact_details: {
                    beneficiary_email: email,
                    beneficiary_phone: phone,
                },
                beneficiary_instrument_details: beneficiaryInstrumentDetails,
            },
        };

        try {
            this.logger.log(`[CASHFREE PAYOUTS] Initiating Transfer | ID: ${transferId} | ₹${amount} | Mode: ${mode} | To: ${vpa || bankAccount}`);
            const response = await axios.post(
                `${this.baseUrl}/transfers`,
                body,
                { headers: this.headers() },
            );

            this.logger.log(`[CASHFREE PAYOUTS] Transfer response: ${JSON.stringify(response.data)}`);
            return response.data;
        } catch (error: any) {
            const cfError = error.response?.data;
            this.logger.error('[CASHFREE PAYOUTS ERROR] Transfer Failed:', JSON.stringify(cfError || error.message));
            throw new BadRequestException(
                cfError?.message || cfError?.sub_code || 'Cashfree payout transfer failed',
            );
        }
    }

    /**
     * Get real-time status of a transfer by transferId
     */
    async getTransferStatus(transferId: string): Promise<{
        transferId: string;
        status: string;
        amount?: number;
        utr?: string;
        rawData: any;
    }> {
        if (!this.appId || !this.secretKey) {
            return { transferId, status: 'MOCK_SUCCESS', rawData: {} };
        }

        try {
            const response = await axios.get(
                `${this.baseUrl}/transfers/${transferId}`,
                { 
                    headers: this.headers(),
                    timeout: 10000 // 10s timeout
                },
            );
            const data = response.data;
            return {
                transferId,
                status: data.transfer_status || data.status || 'UNKNOWN',
                amount: data.transfer_amount,
                utr: data.utr,
                rawData: data,
            };
        } catch (error: any) {
            this.logger.error('[CASHFREE PAYOUTS ERROR] Status Check Failed:', error.response?.data || error.message);
            throw new BadRequestException('Failed to fetch payout transfer status from Cashfree');
        }
    }

    /**
     * Verify Cashfree Payout webhook signature
     */
    verifyWebhookSignature(rawBody: string, signature: string, timestamp: string): boolean {
        try {
            const crypto = require('crypto');
            const data = timestamp + rawBody;
            const computedSignature = crypto
                .createHmac('sha256', this.secretKey)
                .update(data)
                .digest('base64');
            return computedSignature === signature;
        } catch {
            return false;
        }
    }
}
