import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding default content...');

    const defaults = [
        { key: 'PAYPAL_EXCHANGE_RATE', value: '85', type: 'NUMBER' },
        { key: 'GBP_TO_COIN_RATE', value: '110', type: 'NUMBER' },
        { key: 'PAYPAL_ENABLED', value: 'true', type: 'BOOLEAN' },
    ];

    for (const item of defaults) {
        const existing = await prisma.siteContent.findUnique({
            where: { key: item.key }
        });

        if (!existing) {
            await prisma.siteContent.create({
                data: item
            });
            console.log(`Created ${item.key}`);
        } else {
            console.log(`${item.key} already exists`);
        }
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
