
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Updating active theme to Blue...');

    // Find the active theme
    const theme = await prisma.themeSettings.findFirst({
        where: { isActive: true }
    });

    if (theme) {
        await prisma.themeSettings.update({
            where: { id: theme.id },
            data: {
                primaryColor: '#3b82f6', // Blue
                accentColor: '#f59e0b',  // Amber (Complementary)
                // Keep others as is
            }
        });
        console.log('Theme updated successfully to Blue (#3b82f6).');
    } else {
        console.log('No active theme found. One will be created with new defaults on next server start.');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
