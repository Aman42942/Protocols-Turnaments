"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PlayerStatsChart } from '@/components/charts/PlayerStatsChart';
import { TeamComparisonChart } from '@/components/charts/TeamComparisonChart';
import { Users, Crosshair, Trophy } from 'lucide-react';

export default function TeamDetailsPage() {
    const params = useParams();
    const teamId = params.id as string;

    // Mock Data
    const teamStats = {
        name: 'Team Alpha',
        matchesPlayed: 45,
        wins: 12,
        top3: 25,
        kills: 340,
    };

    const rivalStats = {
        name: 'League Avg',
        matchesPlayed: 45,
        wins: 5,
        top3: 15,
        kills: 210,
    };

    const playerStats = {
        kdRatio: 4.5,
        headshotRate: 42,
        winRate: 65,
        survivalTime: 88,
        damageDealt: 92,
    };

    return (
        <div className="container max-w-6xl py-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Team Alpha</h1>
                    <p className="text-muted-foreground flex items-center gap-2 mt-2">
                        <Users className="w-4 h-4" /> 4 Members • Founded 2024
                    </p>
                </div>
                {/* Add Invite/Join buttons here later */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-xl">
                            <Crosshair className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Kills</p>
                            <h3 className="text-3xl font-bold">{teamStats.kills}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/10 rounded-xl">
                            <Trophy className="w-8 h-8 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Wins</p>
                            <h3 className="text-3xl font-bold">{teamStats.wins}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Users className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Win Rate</p>
                            <h3 className="text-3xl font-bold">
                                {Math.round((teamStats.wins / teamStats.matchesPlayed) * 100)}%
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Team Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Team Performance vs Average</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TeamComparisonChart teamA={teamStats} teamB={rivalStats} />
                    </CardContent>
                </Card>

                {/* Player Spotlight (Captain/MVP) */}
                <Card>
                    <CardHeader>
                        <CardTitle>MVP Performance (Captain)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PlayerStatsChart stats={playerStats} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
