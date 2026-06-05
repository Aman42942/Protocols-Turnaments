import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'aman.hooda10001@gmail.com';
  
  console.log(`Searching for user: ${email}...`);
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('User not found! Creating the ultimate admin user now...');
    user = await prisma.user.create({
      data: {
        email,
        name: 'Ultimate Admin',
        role: 'ULTIMATE_ADMIN',
        provider: 'GOOGLE'
      },
    });
    console.log(`Created new ULTIMATE_ADMIN successfully!`);
  } else {
    console.log(`User found. Current role: ${user.role}`);
    await prisma.user.update({
      where: { email },
      data: { role: 'ULTIMATE_ADMIN' },
    });
    console.log(`Updated existing user to ULTIMATE_ADMIN successfully!`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
