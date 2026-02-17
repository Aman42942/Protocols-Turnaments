"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trophy, Target, Zap, Calendar, Medal, MapPin, Link as LinkIcon, Github, Twitter, Twitch } from 'lucide-react';
import { Badge } from '@/components/ui/Badge'; // Need to ensure this exists or use standard badge
import Link from 'next/link';
import { BadgeShowcase } from '@/components/profile/BadgeShowcase';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';

// Mock Data (will be replaced by API)
const userProfile = {
    username: "NightStalker",
    rank: "Ascendant II",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NightStalker",
    bio: "Pro Valorant Player | IGL for Team Liquid | Streamer",
    location: "Mumbai, India",
    joined: "January 2024",
    socials: { twitter: "#", twitch: "#", github: "#" },
    skills: ["Valorant", "IGL", "Sniper", "Entry Fragger"],
    stats: {
        totalTournaments: 142,
        wins: 45,
        top10: 89,
        winRate: 68.5,
        kdRatio: 1.45,
        headshot: 32
    }
};

const activityData = Array.from({ length: 365 }, (_, i) => ({
    date: new Date(Date.now() - (364 - i) * 24 * 60 * 60 * 1000),
    count: Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0,
}));

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-background py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Sidebar - User Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-border/50 shadow-lg">
                            <CardContent className="pt-6 flex flex-col items-center text-center">
                                <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-primary mb-4 bg-muted">
                                    <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <h2 className="text-2xl font-bold">{userProfile.username}</h2>
                                <p className="text-muted-foreground text-sm mb-4">{userProfile.rank}</p>
                                <Button className="w-full mb-4">Edit Profile</Button>

                                <div className="w-full text-left space-y-3 pt-4 border-t border-border">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <MapPin className="w-4 h-4 mr-2" /> {userProfile.location}
                                    </div>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Calendar className="w-4 h-4 mr-2" /> Joined {userProfile.joined}
                                    </div>
                                    <div className="flex gap-3 mt-4 justify-center">
                                        {userProfile.socials.twitter && <Twitter className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />}
                                        {userProfile.socials.twitch && <Twitch className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />}
                                        {userProfile.socials.github && <Github className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />}
                                    </div>
                                </div>

                                <div className="w-full text-left pt-6">
                                    <h3 className="font-semibold mb-2 text-sm">Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {userProfile.skills.map((skill, i) => (
                                            <span key={i} className="px-2 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Content - Stats & Activity */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Stats Row (LeetCode Style Circles) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="border-border/50">
                                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Tournaments Played</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{userProfile.stats.totalTournaments}</div>
                                    <div className="text-xs text-muted-foreground mt-1">Top 5% of players</div>
                                </CardContent>
                            </Card>
                            <Card className="border-border/50">
                                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Wins</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-green-500">{userProfile.stats.wins}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Win Rate: <span className="text-foreground font-medium">{userProfile.stats.winRate}%</span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-border/50">
                                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">K/D Ratio</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-blue-500">{userProfile.stats.kdRatio}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Headshot: <span className="text-foreground font-medium">{userProfile.stats.headshot}%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Activity Heatmap */}
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="text-lg">Activity Calendar</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-1">
                                    {activityData.map((day, i) => (
                                        <div
                                            key={i}
                                            className={`w-3 h-3 rounded-sm ${day.count === 0 ? 'bg-muted' :
                                                day.count < 2 ? 'bg-green-900/40' :
                                                    day.count < 4 ? 'bg-green-600/60' :
                                                        'bg-green-500'
                                                }`}
                                            title={`${day.date.toDateString()}: ${day.count} matches`}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                                    <span>Less</span>
                                    <div className="flex gap-1">
                                        <div className="w-3 h-3 rounded-sm bg-muted" />
                                        <div className="w-3 h-3 rounded-sm bg-green-900/40" />
                                        <div className="w-3 h-3 rounded-sm bg-green-600/60" />
                                        <div className="w-3 h-3 rounded-sm bg-green-500" />
                                    </div>
                                    <span>More</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Badges Section - Enhanced */}
                        <div className="mb-6">
                            <BadgeShowcase />
                        </div>

                        {/* Recent Matches */}
                        <div className="grid grid-cols-1 gap-6">
                            <Card className="border-border/50">
                                <CardHeader><CardTitle className="text-lg">Recent Matches</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium text-sm">Valorant Weekly Cup</p>
                                                <p className="text-xs text-muted-foreground">2 days ago</p>
                                            </div>
                                            <span className="text-xs font-bold text-green-500">Won</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
