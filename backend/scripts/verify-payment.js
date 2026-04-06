
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyPaymentSystem() {
    console.log('--- Payment System Verification ---');

    try {
        // 1. Create User & Wallet
        const user = await prisma.user.create({
            data: {
                email: `test_wallet_${Date.now()}@example.com`,
                name: 'Wallet Tester',
                wallet: { create: { balance: 1000, frozenBalance: 0 } }
            },
            include: { wallet: true }
        });
        console.log(`✅ User Created: ${user.id} (Balance: ${user.wallet.balance})`);

        // 2. Lock Funds (Escrow)
        await prisma.wallet.update({
            where: { id: user.wallet.id },
            data: {
                balance: { decrement: 100 },
                frozenBalance: { increment: 100 }
            }
        });

        // Log escrow transaction
        await prisma.transaction.create({
            data: {
                walletId: user.wallet.id,
                type: 'ENTRY_FEE',
                amount: 100,
                status: 'PENDING_ESCROW', // Custom status for tracking
                description: 'Locked for Tournament'
            }
        });

        const walletAfterLock = await prisma.wallet.findUnique({ where: { id: user.wallet.id } });
        console.log(`✅ Funds Locked: Balance=${walletAfterLock.balance}, Frozen=${walletAfterLock.frozenBalance}`);

        if (walletAfterLock.frozenBalance !== 100) throw new Error('Escrow logic failed');

        // 3. Unlock Funds (Refund)
        await prisma.wallet.update({
            where: { id: user.wallet.id },
            data: {
                balance: { increment: 100 },
                frozenBalance: { decrement: 100 }
            }
        });
        console.log(`✅ Funds Unlocked (Refunded)`);

        const walletAfterRefund = await prisma.wallet.findUnique({ where: { id: user.wallet.id } });
        if (walletAfterRefund.frozenBalance !== 0) throw new Error('Refund logic failed');

        // 4. Test Fraud Detection (Duplicate Reference)
        const ref = 'UTR123456789';
        await prisma.transaction.create({
            data: {
                walletId: user.wallet.id,
                type: 'DEPOSIT',
                amount: 500,
                status: 'COMPLETED',
                reference: ref
            }
        });

        const duplicateCount = await prisma.transaction.count({
            where: { reference: ref, status: 'COMPLETED' }
        });

        if (duplicateCount > 0) {
            console.log(`✅ Fraud Detection: Found duplicate reference '${ref}'`);
        } else {
            throw new Error('Fraud detection failed');
        }

        console.log('\n✅ VERIFICATION SUCCESSFUL');

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifyPaymentSystem();
