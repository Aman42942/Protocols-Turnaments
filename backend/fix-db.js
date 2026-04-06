const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Attempting to patch database schema manually...');

    try {
        // Add provider fields
        console.log('Adding provider column...');
        await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "provider" TEXT;');

        console.log('Adding providerId column...');
        await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "providerId" TEXT;');

        // Add reset token fields
        console.log('Adding resetToken column...');
        await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;');

        console.log('Adding resetTokenExpiry column...');
        await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);');

        console.log('DATABASE PATCH SECUSSFULLY APPLIED! 🚀');
    } catch (e) {
        console.error('PATCH FAILED:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
