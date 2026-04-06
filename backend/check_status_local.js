const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'aman.hooda10001@gmail.com' },
        select: {
            id: true,
            email: true,
            role: true,
            twoFactorEnabled: true,
            emailVerified: true
        }
    });
    console.log('Admin User Info:', JSON.stringify(user, null, 2));
    await prisma.$disconnect();
}

main().catch(console.error);
