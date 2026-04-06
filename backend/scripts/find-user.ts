
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Searching for users with "aman" in email...');
    const users = await prisma.user.findMany({
        where: {
            email: {
                contains: 'aman',
                mode: 'insensitive'
            }
        },
        select: {
            id: true,
            email: true,
            role: true,
            provider: true
        }
    });

    console.log('Found users:');
    console.table(users);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
