const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'aman.hooda10001@gmail.com';
    const role = 'ULTIMATE_ADMIN';
    console.log(`Promoting ${email} to ${role}...`);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                role: role,
                emailVerified: true
            },
            create: {
                email,
                name: 'Aman Hooda',
                role: role,
                emailVerified: true,
                provider: 'GOOGLE', 
            }
        });

        console.log('SUCCESS! User updated:', user);
    } catch (e) {
        console.error('ERROR promoting user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
