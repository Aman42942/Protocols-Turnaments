const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Deployment Seeding...');

  const tournaments = [
    {
      title: 'Valorant Elite Pro Cup',
      description: 'Competitive 5v5 tactical shooter tournament. Prove your skills on the big stage.',
      game: 'VALORANT',
      tier: 'HIGH',
      entryFeePerPerson: 500,
      prizePool: 10000,
      startDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
      maxTeams: 32,
      gameMode: 'SQUAD',
      status: 'UPCOMING',
      region: 'INDIA',
      banner: 'https://res.cloudinary.com/dojhm96m3/image/upload/v1712255000/valorant-banner.jpg',
    },
    {
      title: 'PUBG Mobile: Zero Fear',
      description: 'Battle Royale at its finest. Last squad standing wins the lion share of the prize.',
      game: 'PUBG',
      tier: 'MEDIUM',
      entryFeePerPerson: 200,
      prizePool: 5000,
      startDate: new Date(Date.now() + 86400000 * 5), // 5 days from now
      maxTeams: 25,
      gameMode: 'SQUAD',
      status: 'UPCOMING',
      region: 'SA',
      banner: 'https://res.cloudinary.com/dojhm96m3/image/upload/v1712255000/pubg-banner.jpg',
    },
    {
      title: 'BGMI Clash of Titans',
      description: 'The ultimate survival test. Compete against India\'s best mobile gamers.',
      game: 'BGMI',
      tier: 'HIGH',
      entryFeePerPerson: 100,
      prizePool: 2500,
      startDate: new Date(Date.now() - 3600000 * 2), // Started 2 hours ago (Live)
      maxTeams: 50,
      gameMode: 'SQUAD',
      status: 'LIVE',
      region: 'INDIA',
      banner: 'https://res.cloudinary.com/dojhm96m3/image/upload/v1712255000/bgmi-banner.jpg',
    },
    {
      title: 'Free Fire: Firestorm',
      description: 'Fast-paced survival combat. Show your dexterity and aiming skills.',
      game: 'FREEFIRE',
      tier: 'LOW',
      entryFeePerPerson: 50,
      prizePool: 1000,
      startDate: new Date(Date.now() + 86400000), // Tomorrow
      maxTeams: 48,
      gameMode: 'SQUAD',
      status: 'UPCOMING',
      region: 'GLOBAL',
      banner: 'https://res.cloudinary.com/dojhm96m3/image/upload/v1712255000/freefire-banner.jpg',
    },
    {
        title: 'Valorant 1v1 Aim Challenge',
        description: 'No team? No problem. Test your individual aim in this 1v1 bracket.',
        game: 'VALORANT',
        tier: 'MEDIUM',
        entryFeePerPerson: 150,
        prizePool: 3000,
        startDate: new Date(Date.now() + 86400000 * 2),
        maxTeams: 64,
        gameMode: 'SOLO',
        status: 'UPCOMING',
        region: 'INDIA',
    }
  ];

  for (const t of tournaments) {
    const existing = await prisma.tournament.findFirst({
      where: { title: t.title }
    });

    if (!existing) {
      await prisma.tournament.create({ data: t });
      console.log(`✅ Created Tournament: ${t.title}`);
    } else {
      console.log(`⏩ Skipping: ${t.title} (Already exists)`);
    }
  }

  console.log('✨ Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
