import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

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
        this.isProduction = env === 'PRODUCTION';

        // Using Payouts V2 base URLs
        this.baseUrl = this.isProduction
            ? 'https://api.cashfree.com/payout'
            : 'https://sandbox.cashfree.com/payout';
    }

    private headers() {
        return {
            'x-client-id': this.appId,
            'x-client-secret': this.secretKey,
            'x-api-version': '2024-01-01', // Recommended version for Payouts V2
            'Content-Type': 'application/json',
        };
    }

    /**
     * Request a single transfer (Direct Transfer V2)
     * This is used for automated withdrawals to UPI or Bank.
     */
    async requestTransfer(params: {
        transferId: string;
        amount: number;
        beneficiaryId: string;
        transferMode?: 'upi' | 'imps' | 'neft' | 'rtgs';
        remark?: string;
    }) {
        const { transferId, amount, beneficiaryId, transferMode = 'upi', remark = 'Wallet Withdrawal' } = params;

        if (!this.appId || !this.secretKey) {
            this.logger.warn('[MOCK] Payouts keys missing. Returning mock success.');
            return { success: true, transferId, status: 'SUCCESS', message: 'Mock Transfer Successful' };
        }

        const body = {
            transfer_id: transferId,
            transfer_amount: amount,
            transfer_currency: 'INR',
            beneficiary_details: {
                beneficiary_id: beneficiaryId,
            },
            transfer_mode: transferMode,
            transfer_remarks: remark,
        };

        try {
            this.logger.log(`[CASHFREE PAYOUTS] Initiating Transfer: ${transferId} | Amount: ₹${amount} | Mode: ${transferMode}`);
            const response = await axios.post(
                `${this.baseUrl}/transfers`,
                body,
                { headers: this.headers() }
            );

            return response.data;
        } catch (error: any) {
            const cfError = error.response?.data;
            this.logger.error('[CASHFREE PAYOUTS ERROR] Transfer Failed:', JSON.stringify(cfError || error.message));
            throw new BadRequestException(cfError?.message || 'Payout transfer failed');
        }
    }

    /**
     * Get Transfer Status
     */
    async getTransferStatus(transferId: string) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/transfers/${transferId}`,
                { headers: this.headers() }
            );
            return response.data;
        } catch (error: any) {
            this.logger.error('[CASHFREE PAYOUTS ERROR] Status Check Failed:', error.response?.data || error.message);
            throw new BadRequestException('Failed to fetch payout status');
        }
    }

    /**
     * Add Beneficiary (Required before transfer for some flows, 
     * or use beneficiary_details directly in transfer if supported)
     */
    async addBeneficiary(params: {
        beneficiaryId: string;
        name: string;
        email?: string;
        phone?: string;
        bankAccount?: string;
        ifsc?: string;
        vpa?: string; // UPI ID
    }) {
        const { beneficiaryId, name, email, phone, bankAccount, ifsc, vpa } = params;

        const body: any = {
            beneficiary_id: beneficiaryId,
            beneficiary_name: name,
            beneficiary_contact_details: {
                beneficiary_email: email || 'user@protocol.app',
                beneficiary_phone: phone || '9999999999',
            },
        };

        if (vpa) {
            body.beneficiary_instrument_details = {
                vpa: vpa,
            };
        } else if (bankAccount && ifsc) {
            body.beneficiary_instrument_details = {
                bank_account_number: bankAccount,
                ifsc: ifsc,
            };
        }

        try {
            this.logger.log(`[CASHFREE PAYOUTS] Adding Beneficiary: ${beneficiaryId}`);
            const response = await axios.post(
                `${this.baseUrl}/beneficiaries`,
                body,
                { headers: this.headers() }
            );
            return response.data;
        } catch (error: any) {
            const cfError = error.response?.data;
            this.logger.error('[CASHFREE PAYOUTS ERROR] Add Beneficiary Failed:', JSON.stringify(cfError || error.message));
            throw new BadRequestException(cfError?.message || 'Failed to add beneficiary');
        }
    }
}
