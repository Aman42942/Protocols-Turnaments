
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as crypto from 'crypto';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000';

async function main() {
    console.log('🧪 Starting Password Reset Verification...');

    const email = 'test_reset@protocal.gg';
    const rawToken = 'test-token-' + crypto.randomBytes(8).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    try {
        // 1. Setup User
        console.log(`1. Setting up test user: ${email}`);
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                resetToken: hashedToken,
                resetTokenExpiry: expiry,
                password: 'old-password-hash' // Invalid hash but ok for test
            },
            create: {
                email,
                name: 'Test Reset User',
                password: 'old-password-hash',
                role: 'USER',
                resetToken: hashedToken,
                resetTokenExpiry: expiry,
            },
        });
        console.log('   ✅ User prepared with reset token in DB.');

        // 2. Call Reset Password API
        console.log(`2. calling POST /auth/reset-password with token: ${rawToken}`);

        // Note: The endpoint path might be /auth/reset-password or similar. Checking auth.controller...
        // Assuming /auth/reset-password

        try {
            const response = await axios.post(`${API_URL}/auth/reset-password`, {
                email,
                token: rawToken,
                newPassword: 'new-secure-password-123'
            });
            console.log('   ✅ API Response:', response.data);
        } catch (error: any) {
            console.error('   ❌ API Call Failed:', error.code || error.message);
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', JSON.stringify(error.response.data, null, 2));
            }
            process.exit(1);
        }

        // 3. Verify in DB
        console.log('3. Verifying DB state...');
        const updatedUser = await prisma.user.findUnique({ where: { email } });

        if (!updatedUser) throw new Error('User missing');
        if (updatedUser.resetToken !== null) throw new Error('Reset token should be null');
        if (updatedUser.password === 'old-password-hash') throw new Error('Password was not changed');

        console.log('   ✅ DB Verification Passed: Token cleared, password updated.');
        console.log('🎉 Password Reset System Verified!');

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
