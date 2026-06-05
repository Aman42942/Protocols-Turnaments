const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tournaments = await prisma.tournament.findMany({
    select: {
      id: true,
      title: true,
      game: true,
      tier: true,
      status: true,
    }
  });
  console.log('--- TOURNAMENTS IN DB (DETAILED) ---');
  console.log(JSON.stringify(tournaments, null, 2));
  console.log('--------------------------');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
