
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listWallets() {
  const wallets = await prisma.wallet.findMany({
    where: { balance: { gt: 0 } },
    include: { user: true }
  });
  console.log('--- Wallets with Balance > 0 ---');
  wallets.forEach(w => {
    console.log(`User: ${w.user.name} (${w.user.email}) | ID: ${w.userId} | Balance: ${w.balance}`);
  });
}

listWallets()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
