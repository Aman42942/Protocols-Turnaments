const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log('Testing database connection and user logic...');
    try {
        const email = 'debug_test_user_' + Date.now() + '@example.com';
        const profile = {
            email: email,
            firstName: 'Debug',
            lastName: 'User',
            picture: 'http://example.com/pic.jpg',
            provider: 'GOOGLE',
            providerId: 'debug_12345'
        };

        console.log('Simulating validateOAuthUser with:', profile);

        // Logic copied from AuthService.validateOAuthUser
        let user = await prisma.user.findUnique({ where: { email: profile.email } });

        if (!user) {
            console.log('User not found, creating...');
            // Note: we are simulating the create call from AuthService
            user = await prisma.user.create({
                data: {
                    email: profile.email,
                    name: `${profile.firstName} ${profile.lastName}`.trim(),
                    avatar: profile.picture,
                    password: '',
                    role: 'USER',
                    provider: profile.provider,
                    providerId: profile.providerId,
                    emailVerified: true,
                }
            });
            console.log('User created:', user.id);
        } else {
            console.log('User found:', user.id);
        }

        console.log('Success! User provider:', user.provider);

        // Clean up
        await prisma.user.delete({ where: { email } });
        console.log('Cleaned up debug user.');

    } catch (e) {
        console.error('TEST FAILED:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
