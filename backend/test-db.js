
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log("Attempting to connect to database...");
    console.log("URL:", process.env.DATABASE_URL ? "Found (Hidden)" : "Missing");

    try {
        await prisma.$connect();
        console.log("✅ Connection Successful!");

        const count = await prisma.user.count();
        console.log(`✅ Database query worked. User count: ${count}`);

    } catch (e) {
        console.error("❌ Connection Failed!");
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
