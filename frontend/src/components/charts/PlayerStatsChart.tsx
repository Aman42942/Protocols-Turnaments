"use client";

import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

interface PlayerStats {
    kdRatio: number; // 0-10
    headshotRate: number; // 0-100%
    winRate: number; // 0-100%
    survivalTime: number; // Normalized 0-100
    damageDealt: number; // Normalized 0-100
}

interface PlayerStatsChartProps {
    stats?: PlayerStats;
}

const mockStats = [
    { subject: 'K/D Ratio', A: 80, fullMark: 100 }, // Scaled
    { subject: 'Headshots', A: 45, fullMark: 100 },
    { subject: 'Win Rate', A: 60, fullMark: 100 },
    { subject: 'Survival', A: 90, fullMark: 100 },
    { subject: 'Damage', A: 75, fullMark: 100 },
];

export function PlayerStatsChart({ stats }: PlayerStatsChartProps) {
    // Transform props to chart data if provided
    const data = stats ? [
        { subject: 'K/D Ratio', A: Math.min(stats.kdRatio * 10, 100), fullMark: 100 },
        { subject: 'Headshots', A: stats.headshotRate, fullMark: 100 },
        { subject: 'Win Rate', A: stats.winRate, fullMark: 100 },
        { subject: 'Survival', A: stats.survivalTime, fullMark: 100 },
        { subject: 'Damage', A: stats.damageDealt, fullMark: 100 },
    ] : mockStats;

    return (
        <div className="w-full h-[300px] bg-card/50 rounded-xl p-4 border border-border">
            <h4 className="text-sm font-semibold mb-2 text-center text-muted-foreground">Performance Radar</h4>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Player"
                        dataKey="A"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="hsl(var(--primary))"
                        fillOpacity={0.4}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
