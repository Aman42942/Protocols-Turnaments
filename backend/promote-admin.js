const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'aman.hooda10001@gmail.com';
    console.log(`Promoting ${email} to ADMIN...`);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                role: 'ADMIN',
                emailVerified: true
            },
            create: {
                email,
                name: 'Aman Hooda',
                role: 'ADMIN',
                emailVerified: true,
                provider: 'GOOGLE', // Pre-mark as Google so if they login via Google it matches
                // Password can be null/empty for OAuth users
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
