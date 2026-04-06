const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDatabase() {
    try {
        console.log('Testing database connection...');
        await prisma.$connect();
        console.log('✅ Database Connected Successfully');

        const userCount = await prisma.user.count();
        console.log(`✅ Total Users: ${userCount}`);

        const tournamentCount = await prisma.tournament.count();
        console.log(`✅ Total Tournaments: ${tournamentCount}`);

        const teamCount = await prisma.team.count();
        console.log(`✅ Total Teams: ${teamCount}`);

        await prisma.$disconnect();
        console.log('✅ All Database Tests Passed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database Test Failed:', error.message);
        process.exit(1);
    }
}

testDatabase();
