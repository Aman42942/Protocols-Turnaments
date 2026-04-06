
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRole() {
    const user = await prisma.user.findUnique({
        where: { email: 'aman.hooda10001@gmail.com' },
    });
    console.log('User Role in DB:', user ? user.role : 'User not found');
}

checkRole()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
