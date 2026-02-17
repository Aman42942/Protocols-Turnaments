const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('Creating Admin User...');
    const email = 'admin@protocol.gg';
    const password = 'Admin@123';

    try {
        // Check if exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            console.log('Admin user already exists. Updating password/role...');
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN',
                    emailVerified: true,
                    lockedUntil: null,
                    loginAttempts: 0
                }
            });
        } else {
            console.log('Creating new Admin user...');
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: 'System Admin',
                    role: 'ADMIN',
                    emailVerified: true,
                }
            });
        }
        console.log(`\nSUCCESS! Admin User Ready:\nEmail: ${email}\nPassword: ${password}\n`);
    } catch (e) {
        console.error('FAILED to create admin:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
