import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Trophy, Medal, Star, Shield, Crosshair, Zap, Flame, Crown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Badge Types
type BadgeTier = 'legendary' | 'epic' | 'rare' | 'common';

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    tier: BadgeTier;
    earnedDate?: string;
}

const allBadges: Badge[] = [
    {
        id: '1',
        name: 'Tournament King',
        description: 'Won 5 Tournaments in a row',
        icon: <Crown className="w-8 h-8 text-yellow-400" />,
        tier: 'legendary',
        earnedDate: 'Dec 2024'
    },
    {
        id: '2',
        name: 'Sharpshooter',
        description: 'Achieved 50% Headshot rate in a season',
        icon: <Crosshair className="w-8 h-8 text-red-500" />,
        tier: 'epic',
        earnedDate: 'Jan 2025'
    },
    {
        id: '3',
        name: 'Early Adopter',
        description: 'Joined during the beta phase',
        icon: <Star className="w-8 h-8 text-blue-400" />,
        tier: 'rare',
        earnedDate: 'Nov 2023'
    },
    {
        id: '4',
        name: 'MVP',
        description: 'Awarded Most Valuable Player in a match',
        icon: <Trophy className="w-8 h-8 text-amber-500" />,
        tier: 'epic',
        earnedDate: 'Feb 2025'
    },
    {
        id: '5',
        name: 'Community Pillar',
        description: 'Helpful community member',
        icon: <Shield className="w-8 h-8 text-green-500" />,
        tier: 'common'
    },
    {
        id: '6',
        name: 'Win Streak',
        description: 'Won 10 matches consecutively',
        icon: <Flame className="w-8 h-8 text-orange-500" />,
        tier: 'rare'
    },
];

export function BadgeShowcase() {
    return (
        <Card className="border-border/50 shadow-md">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl">Badges & Achievements</CardTitle>
                        <CardDescription>Showcase your gaming milestones</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">View All</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {allBadges.map((badge) => (
                        <div
                            key={badge.id}
                            className={`group relative flex flex-col items-center p-4 rounded-xl border transition-all duration-300 hover:scale-105 cursor-pointer ${badge.earnedDate
                                    ? 'bg-card border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10'
                                    : 'opacity-50 grayscale border-transparent bg-muted/30'
                                }`}
                        >
                            <div className={`
                                w-16 h-16 rounded-full flex items-center justify-center mb-3 ring-2 ring-offset-2 ring-offset-background
                                ${badge.tier === 'legendary' ? 'bg-yellow-500/10 ring-yellow-500/50' :
                                    badge.tier === 'epic' ? 'bg-purple-500/10 ring-purple-500/50' :
                                        badge.tier === 'rare' ? 'bg-blue-500/10 ring-blue-500/50' :
                                            'bg-gray-500/10 ring-gray-500/50'}
                            `}>
                                {badge.icon}
                            </div>
                            <span className="text-xs font-bold text-center line-clamp-1">{badge.name}</span>
                            <span className="text-[10px] text-muted-foreground mt-1 text-center line-clamp-2 px-1">
                                {badge.earnedDate ? badge.earnedDate : 'Locked'}
                            </span>

                            {/* Tooltip-like details on hover could go here or be handled by a UI library */}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
