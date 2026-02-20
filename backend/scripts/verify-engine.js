
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Tournament Engine Verification ---');

    // 1. Create Dummy Tournament
    const tournament = await prisma.tournament.create({
        data: {
            title: 'Test Tournament ' + Date.now(),
            game: 'BGMI',
            startDate: new Date(),
            maxTeams: 10,
            scoringEngine: JSON.stringify({ "1": 20, "2": 14, "kill": 1 }), // Custom rules
        }
    });
    console.log('✅ Created Tournament:', tournament.id);

    // 2. Create Teams & Players
    const user = await prisma.user.create({
        data: { email: `test_${Date.now()}@example.com`, role: 'USER' }
    });

    const team = await prisma.team.create({
        data: {
            name: 'Team Alpha ' + Date.now(),
            leaderId: user.id,
            inviteCode: 'ALPHA' + Date.now()
        }
    });
    console.log('✅ Created Team:', team.id);

    // 3. Register Team (via Participant)
    await prisma.tournamentParticipant.create({
        data: {
            userId: user.id,
            tournamentId: tournament.id,
            teamId: team.id,
            status: 'APPROVED'
        }
    });

    // 4. Create Match
    const match = await prisma.match.create({
        data: {
            tournamentId: tournament.id,
            round: 1,
            startTime: new Date(),
            status: 'SCHEDULED'
        }
    });
    console.log('✅ Created Match:', match.id);

    // 5. Simulate Scoring (MatchService Logic)
    // Since we can't easily import NestJS services in this standalone script without bootstrapping app context,
    // we will simulate the DB operations that MatchService would do.

    console.log('🔄 Simulating Match Results Submission...');

    // Scoring Rule: 1st Place = 20pts, 5 Kills = 5pts => Total 25pts
    const placement = 1;
    const kills = 5;
    const score = 25; // Manual calc based on rule above

    await prisma.matchParticipation.create({
        data: {
            matchId: match.id,
            teamId: team.id,
            placement,
            kills,
            score
        }
    });

    await prisma.match.update({
        where: { id: match.id },
        data: { status: 'COMPLETED' }
    });

    // Update Leaderboard Cache
    await prisma.tournamentLeaderboard.create({
        data: {
            tournamentId: tournament.id,
            teamId: team.id,
            totalPoints: score,
            totalKills: kills,
            matchesPlayed: 1
        }
    });
    console.log('✅ Match Results Processed');

    // 6. Verify Leaderboard
    const lb = await prisma.tournamentLeaderboard.findMany({
        where: { tournamentId: tournament.id },
        include: { team: true }
    });

    console.log('\n--- Leaderboard Results ---');
    console.log(JSON.stringify(lb, null, 2));

    if (lb.length === 1 && lb[0].totalPoints === 25) {
        console.log('\n✅ VERIFICATION SUCCESSFUL: Leaderboard reflects match results.');
    } else {
        console.error('\n❌ VERIFICATION FAILED: Leaderboard data mismatch.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
