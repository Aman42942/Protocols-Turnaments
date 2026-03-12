
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const appId = process.env.CASHFREE_APP_ID;
const secretKey = process.env.CASHFREE_SECRET_KEY;
const env = process.env.CASHFREE_ENV || 'SANDBOX';
const baseUrl = env === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

async function testCashfree() {
    console.log(`Testing Cashfree...`);
    console.log(`App ID: ${appId ? appId.substring(0, 5) + '...' : 'MISSING'}`);
    console.log(`Env: ${env}`);
    console.log(`Base URL: ${baseUrl}`);

    if (!appId || !secretKey) {
        console.error('ERROR: Missing Cashfree credentials in .env');
        return;
    }

    const headers = {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
    };

    function getHttpsFrontendUrl(): string {
        const envUrl = process.env.FRONTEND_URL;
        const isProduction = env === 'PRODUCTION';

        if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
            return envUrl;
        }

        if (isProduction) {
            return 'https://protocols-turnaments.vercel.app';
        }

        return 'http://localhost:3000';
    }

    const returnUrl = `${getHttpsFrontendUrl()}/test-return`;

    const body = {
        order_amount: 1,
        order_currency: 'INR',
        order_id: `DEBUG_${Date.now()}`,
        customer_details: {
            customer_id: 'debug_user_1',
            customer_phone: '9999999999',
            customer_name: 'Debug User',
            customer_email: 'debug@test.com',
        },
        order_meta: {
            return_url: returnUrl,
        },
    };

    console.log(`Using return_url: ${returnUrl}`);

    try {
        const response = await axios.post(`${baseUrl}/orders`, body, { headers });
        console.log('SUCCESS: Order created!');
        console.log('Payment Session ID:', response.data.payment_session_id);
    } catch (error: any) {
        console.error('ERROR: Order creation failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
    }
}

testCashfree();
