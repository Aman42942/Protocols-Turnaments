const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function unbanAll() {
    console.log('Connecting to database to remove IP bans...');
    try {
        const deleted = await prisma.bannedIp.deleteMany({});
        console.log(`Successfully removed ${deleted.count} banned IPs structure.`);

        // Also clear out the security logs for the user to start fresh
        const logs = await prisma.securityLog.deleteMany({});
        console.log(`Cleared ${logs.count} security logs.`);

        console.log('\n✅ You are now UNBANNED.');
        console.log('You can refresh your site now.');
    } catch (e) {
        console.error('Error unbanning IPs:', e);
    } finally {
        await prisma.$disconnect();
    }
}

unbanAll();
