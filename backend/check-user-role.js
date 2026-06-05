const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'aman.hooda10001@gmail.com';
    console.log(`Checking role for ${email}...`);

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (user) {
            console.log('--- USER FOUND ---');
            console.log('Name:', user.name);
            console.log('Role:', user.role);
            console.log('Verified:', user.emailVerified);
            console.log('------------------');
        } else {
            console.log('ERROR: User not found in database.');
        }
    } catch (e) {
        console.error('ERROR checking user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
