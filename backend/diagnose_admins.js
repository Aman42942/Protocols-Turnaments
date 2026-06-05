const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: { not: 'USER' }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    console.log('ADMIN_COUNT:' + admins.length);
    admins.forEach(user => {
      console.log(`USER: ${user.name} | EMAIL: ${user.email} | ROLE: ${user.role} | ID: ${user.id}`);
    });

  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
