"use client";

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface TeamStats {
    name: string;
    matchesPlayed: number;
    wins: number;
    top3: number;
    kills: number;
}

interface TeamComparisonChartProps {
    teamA: TeamStats;
    teamB: TeamStats;
}

export function TeamComparisonChart({ teamA, teamB }: TeamComparisonChartProps) {
    const data = [
        {
            name: 'Win Rate %',
            [teamA.name]: Math.round((teamA.wins / teamA.matchesPlayed) * 100) || 0,
            [teamB.name]: Math.round((teamB.wins / teamB.matchesPlayed) * 100) || 0,
        },
        {
            name: 'Top 3 %',
            [teamA.name]: Math.round((teamA.top3 / teamA.matchesPlayed) * 100) || 0,
            [teamB.name]: Math.round((teamB.top3 / teamB.matchesPlayed) * 100) || 0,
        },
        {
            name: 'Avg Kills',
            [teamA.name]: Math.round(teamA.kills / teamA.matchesPlayed) || 0,
            [teamB.name]: Math.round(teamB.kills / teamB.matchesPlayed) || 0,
        },
    ];

    return (
        <div className="w-full h-[350px] bg-card/50 rounded-xl p-4 border border-border">
            <h4 className="text-sm font-semibold mb-4 text-center text-muted-foreground">Head-to-Head Comparison</h4>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.1} />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                    />
                    <Legend />
                    <Bar dataKey={teamA.name} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={teamB.name} fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
