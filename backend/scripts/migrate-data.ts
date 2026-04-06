import { PrismaClient } from '@prisma/client';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

// Connect to Neon using the robust 'postgres' driver
const sql = postgres(process.env.OLD_DATABASE_URL!, {
  ssl: 'require',
  connect_timeout: 30,
});

const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Starting Data Migration: Neon (Postgres) -> MongoDB Atlas');

  try {
    // Test connection
    console.log('Connecting to Neon...');
    const testResult = await sql`SELECT 1 as result`;
    console.log('✅ Connected to Neon Postgres:', testResult);

    // --- 🧹 CLEAR MONGODB ---
    console.log('🧹 Clearing MongoDB Atlas (Clean Start)...');
    await prisma.transaction.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.tournamentParticipant.deleteMany();
    await prisma.tournament.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ MongoDB Cleared.');

    // Mappings for relational integrity
    const userMap = new Map<number, string>();
    const walletMap = new Map<number, string>();

    // 1. Migrate Users
    console.log('\n--- 👥 Migrating Users ---');
    const users = await sql`SELECT * FROM "User"`;
    console.log(`Successfully fetched ${users.length} users.`);

    for (const user of users) {
      try {
        const newUser = await prisma.user.create({
          data: {
            email: user.email,
            password: user.password,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            banned: user.banned || false,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            provider: user.provider,
            providerId: user.providerId,
            phone: user.phone,
            riotId: user.riotId,
            pubgId: user.pubgId,
            bgmiId: user.bgmiId,
            freeFireId: user.freeFireId,
            country: user.country,
          },
        });
        userMap.set(user.id, newUser.id);
        console.log(`✅ Migrated user: ${user.email}`);
      } catch (err: any) {
        console.error(`❌ User ${user.email} failed:`, err.message);
      }
    }

    // 2. Migrate Wallets
    console.log('\n--- 💰 Migrating Wallets ---');
    const wallets = await sql`SELECT * FROM "Wallet"`;
    for (const wallet of wallets) {
      try {
        const newUserId = userMap.get(wallet.userId);
        if (!newUserId) continue;

        const newWallet = await prisma.wallet.create({
          data: {
            userId: newUserId,
            balance: parseFloat(wallet.balance) || 0,
            frozenBalance: parseFloat(wallet.frozenBalance) || 0,
            currency: wallet.currency || 'COIN',
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
          },
        });
        walletMap.set(wallet.id, newWallet.id);
        console.log(`✅ Migrated wallet for user ${wallet.userId}`);
      } catch (err: any) {
        console.error(`❌ Wallet ${wallet.id} failed:`, err.message);
      }
    }

    // 3. Migrate Transactions
    console.log('\n--- 📊 Migrating Transactions ---');
    const transactions = await sql`SELECT * FROM "Transaction"`;
    for (const tx of transactions) {
      try {
        const newWalletId = walletMap.get(tx.walletId);
        if (!newWalletId) continue;

        await prisma.transaction.create({
          data: {
            walletId: newWalletId,
            type: tx.type,
            amount: parseFloat(tx.amount) || 0,
            status: tx.status,
            method: tx.method,
            reference: tx.reference,
            description: tx.description,
            metadata: tx.metadata ? (typeof tx.metadata === 'string' ? tx.metadata : JSON.stringify(tx.metadata)) : null,
            createdAt: tx.createdAt,
          },
        });
      } catch (err: any) {
        console.error(`❌ Transaction ${tx.id} failed:`, err.message);
      }
    }
    console.log(`✅ Done migrating ${transactions.length} transactions.`);

    console.log('\n🎉 ALL DONE! Migration finished successfully.');
  } catch (error) {
    console.error('💥 Critical Error during migration:', error);
  } finally {
    await sql.end();
    await prisma.$disconnect();
  }
}

migrate();
