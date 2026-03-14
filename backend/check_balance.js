
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBalance() {
  const userId = '22f28597-d7bf-40ad-a572-19aaaec50f5d'; // Aman Hooda's likely ID from previous logs
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });
  console.log('User ID:', userId);
  console.log('Current Wallet Balance:', wallet ? wallet.balance : 'Not Found');
}

checkBalance()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
