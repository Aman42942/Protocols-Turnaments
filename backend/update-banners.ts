import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Updating Ad Banners to Ultra-Premium Landscape versions...');

    // 1. Clear existing slides
    await prisma.adSlide.deleteMany({});
    console.log('🗑️  Existing banners removed.');

    // 2. Add new premium slides
    const newSlides = [
        {
            title: 'Welcome to the Future of Gaming',
            description: 'Join the ultimate esports arena. Compete in high-stakes tournaments and win massive coin prizes daily.',
            mediaType: 'IMAGE',
            mediaUrl: '/banners/landscape_esports.png',
            ctaLink: '/tournaments',
            ctaText: 'BROWSE ARENA',
            isActive: true,
            displayOrder: 0,
        },
        {
            title: 'Valorant Professional League',
            description: 'Tactical combat, extraordinary abilities. Register for our upcoming Valorant Open and prove your skills.',
            mediaType: 'IMAGE',
            mediaUrl: '/banners/landscape_valorant.png',
            ctaLink: '/tournaments',
            ctaText: 'JOIN BATTLE',
            isActive: true,
            displayOrder: 1,
        },
        {
            title: 'Apex Predatory: Mobile Open',
            description: 'Dominate the battlefield in PUBG & BGMI. Strategy meets skill. New mobile tournaments starting every hour.',
            mediaType: 'IMAGE',
            mediaUrl: '/banners/landscape_mobile.png',
            ctaLink: '/tournaments',
            ctaText: 'PLAY NOW',
            isActive: true,
            displayOrder: 2,
        }
    ];

    for (const slide of newSlides) {
        await prisma.adSlide.create({
            data: slide
        });
    }

    console.log('✅ 3 Premium Landscape Banners added successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error updating banners:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
