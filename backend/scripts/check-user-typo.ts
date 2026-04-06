
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email1 = 'aman.hooda10001@gmail.com';
    const email2 = 'amanhudda.10001@gmail.com';

    console.log('Checking for users...');

    const user1 = await prisma.user.findUnique({ where: { email: email1 } });
    const user2 = await prisma.user.findUnique({ where: { email: email2 } });

    console.log(`\nEmail: ${email1}`);
    if (user1) {
        console.log(`- ID: ${user1.id}`);
        console.log(`- Role: ${user1.role}`);
        console.log(`- Provider: ${user1.provider}`);
        console.log(`- Password Set: ${!!user1.password}`);
    } else {
        console.log('- Not found');
    }

    console.log(`\nEmail: ${email2}`);
    if (user2) {
        console.log(`- ID: ${user2.id}`);
        console.log(`- Role: ${user2.role}`);
        console.log(`- Provider: ${user2.provider}`);
        console.log(`- Password Set: ${!!user2.password}`);
    } else {
        console.log('- Not found');
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
