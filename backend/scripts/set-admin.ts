import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'aman.hooda10001@gmail.com' },
  });

  if (!user) {
    console.log('User not found! Make sure you have logged in first.');
    return;
  }

  const updated = await prisma.user.update({
    where: { email: 'aman.hooda10001@gmail.com' },
    data: { role: 'ULTIMATE_ADMIN' },
  });

  console.log(`SUCCESS! ${updated.email} is now ${updated.role}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
