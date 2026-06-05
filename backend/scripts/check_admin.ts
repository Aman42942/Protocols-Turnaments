import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'aman.hooda10001@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.log(`User with email ${email} not found.`);
    } else {
        console.log("User details:");
        console.log(JSON.stringify(user, null, 2));
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
