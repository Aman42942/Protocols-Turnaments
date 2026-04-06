
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'aman.hooda10001@gmail.com'; // Corrected email from user input
    console.log(`Promoting ${email} to ULTIMATE_ADMIN...`);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                role: 'ULTIMATE_ADMIN',
                emailVerified: true
            },
            create: {
                email,
                name: 'Aman Hudda',
                role: 'ULTIMATE_ADMIN',
                emailVerified: true,
                provider: 'GOOGLE',
                password: '', // OAuth users don't need a password
            }
        });

        console.log('✅ SUCCESS! User updated:', user);
    } catch (e) {
        console.error('❌ ERROR promoting user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
