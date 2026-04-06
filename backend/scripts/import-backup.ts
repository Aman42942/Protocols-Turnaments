import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importData() {
    try {
        console.log('🚀 Starting Manual Data Import...');

        const backupDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupDir)) {
            console.error('❌ Backup directory not found. Please create a "backups" folder in the backend root.');
            return;
        }

        // Helper to read JSON or CSV files
        const readData = (fileBasename: string): any[] | null => {
            const jsonPath = path.join(backupDir, `${fileBasename}.json`);
            const csvPath = path.join(backupDir, `${fileBasename}.csv`);

            if (fs.existsSync(jsonPath)) {
                console.log(`📖 Reading ${fileBasename}.json...`);
                return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            }

            if (fs.existsSync(csvPath)) {
                console.log(`📖 Reading ${fileBasename}.csv...`);
                const content = fs.readFileSync(csvPath, 'utf8');
                const lines = content.split('\n').filter((l: string) => l.trim());
                if (lines.length < 2) return [];
                const headers = lines[0].split(',').map((h: string) => h.trim().replace(/^"|"$/g, ''));
                return lines.slice(1).map((line: string) => {
                    const values = line.split(',').map((v: string) => v.trim().replace(/^"|"$/g, ''));
                    const obj: any = {};
                    headers.forEach((h: string, i: number) => obj[h] = values[i]);
                    return obj;
                });
            }

            return null;
        };

        const users = readData('users');
        const wallets = readData('wallets');
        const transactions = readData('transactions');

        if (!users) {
            console.error('❌ users.json or users.csv not found in backups folder.');
            return;
        }

        console.log('🧹 Clearing existing MongoDB data...');
        await prisma.transaction.deleteMany();
        await prisma.wallet.deleteMany();
        await prisma.user.deleteMany();

        const userMap = new Map<number | string, string>(); // Old ID -> New ID
        const walletMap = new Map<number | string, string>(); // Old User ID -> New Wallet ID

        console.log(`👥 Importing ${users.length} Users...`);
        for (const user of users) {
            const newUser = await prisma.user.create({
                data: {
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    role: user.role || 'USER',
                    provider: user.provider || 'EMAIL',
                    providerId: user.providerId ? String(user.providerId) : null,
                    emailVerified: user.emailVerified === 'true' || user.emailVerified === true,
                    password: user.password || '',
                    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
                }
            });
            userMap.set(user.id, newUser.id);
        }

        if (wallets) {
            console.log(` Importing ${wallets.length} Wallets...`);
            for (const wallet of wallets) {
                const newUserId = userMap.get(wallet.userId);
                if (newUserId) {
                    const newWallet = await prisma.wallet.create({
                        data: {
                            userId: newUserId,
                            balance: parseFloat(wallet.balance) || 0,
                            frozenBalance: parseFloat(wallet.frozenBalance) || 0,
                            currency: wallet.currency || 'INR',
                            createdAt: wallet.createdAt ? new Date(wallet.createdAt) : new Date(),
                            updatedAt: wallet.updatedAt ? new Date(wallet.updatedAt) : new Date(),
                        }
                    });
                    walletMap.set(wallet.userId, newWallet.id);
                }
            }
        }

        if (transactions) {
            console.log(`💸 Importing ${transactions.length} Transactions...`);
            for (const tx of transactions) {
                const newWalletId = walletMap.get(tx.userId) || walletMap.get(tx.walletId);
                if (newWalletId) {
                    await prisma.transaction.create({
                        data: {
                            walletId: newWalletId,
                            amount: parseFloat(tx.amount) || 0,
                            type: tx.type,
                            status: tx.status,
                            reference: tx.reference || tx.referenceId,
                            description: tx.description,
                            createdAt: tx.createdAt ? new Date(tx.createdAt) : new Date(),
                        }
                    });
                }
            }
        }

        console.log('✅ Manual Migration Completed Successfully!');
    } catch (error) {
        console.error('❌ Migration Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importData();
