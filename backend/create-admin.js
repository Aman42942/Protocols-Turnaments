const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('Creating Admin User...');
    const email = 'aman.hooda10001@gmail.com';
    const password = 'Admin@123';

    try {
        // Check if exists
        let user;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            console.log('Admin user already exists. Updating password/role...');
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await prisma.user.update({
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
            user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: 'System Admin',
                    role: 'ADMIN',
                    emailVerified: true,
                }
            });
        }

        // Ensure wallet exists for this admin
        const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
        if (!wallet) {
            console.log('Initializing Admin Wallet...');
            await prisma.wallet.create({
                data: {
                    userId: user.id,
                    balance: 0,
                    frozenBalance: 0,
                    currency: 'INR'
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
