"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trophy, Target, Zap, Calendar, Medal, MapPin, Link as LinkIcon, Github, Twitter, Twitch } from 'lucide-react';
import { Badge } from '@/components/ui/Badge'; // Need to ensure this exists or use standard badge
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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

export default function ProfilePage() {
    const [activityData, setActivityData] = React.useState<{ date: Date, count: number }[]>([]);

    React.useEffect(() => {
        const data = Array.from({ length: 365 }, (_, i) => ({
            date: new Date(Date.now() - (364 - i) * 24 * 60 * 60 * 1000),
            count: Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0,
        }));
        setActivityData(data);
    }, []);

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Sidebar - User Info */}
                    {/* Left Sidebar - Profile Header (Sticky on Mobile) */}
                    <div className="lg:col-span-1 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-[2.5rem] overflow-hidden shadow-2xl">
                                <div className="h-24 bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent relative">
                                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
                                </div>
                                <CardContent className="pt-0 flex flex-col items-center text-center -mt-12 relative z-10 px-6 pb-8">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-background bg-muted shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                            <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-background rounded-full" title="Online" />
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tighter mt-4 italic">{userProfile.username.toUpperCase()}</h2>
                                    <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary border-primary/20 font-black tracking-[0.2em] uppercase text-[10px] px-3 py-1">
                                        {userProfile.rank}
                                    </Badge>

                                    <div className="w-full grid grid-cols-2 gap-3 mt-8">
                                        <Button className="rounded-2xl h-12 font-black tracking-widest uppercase text-xs shadow-lg shadow-primary/20">Edit</Button>
                                        <Button variant="outline" className="rounded-2xl h-12 font-black tracking-widest uppercase text-xs border-border/40 bg-background/50">Share</Button>
                                    </div>

                                    <div className="w-full text-left space-y-4 pt-8 mt-8 border-t border-border/20">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <div className="p-2 rounded-lg bg-muted mr-3"><MapPin className="w-4 h-4" /></div>
                                            {userProfile.location}
                                        </div>
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <div className="p-2 rounded-lg bg-muted mr-3"><Calendar className="w-4 h-4" /></div>
                                            Join {userProfile.joined}
                                        </div>
                                    </div>

                                    <div className="w-full pt-8">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Core Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {userProfile.skills.map((skill, i) => (
                                                <Badge key={i} variant="outline" className="bg-muted/50 border-border/40 text-[10px] font-bold rounded-lg px-2 py-0.5">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Right Content - Stats & Activity */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Stats Row (LeetCode Style Circles) */}
                        {/* Master Stats - Horizontal Snap on Mobile */}
                        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x">
                            {[
                                { label: 'Tournaments', value: userProfile.stats.totalTournaments, icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                                { label: 'Total Wins', value: userProfile.stats.wins, icon: Medal, color: 'text-green-500', bg: 'bg-green-500/10' },
                                { label: 'Win Rate', value: `${userProfile.stats.winRate}%`, icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    className="snap-start shrink-0 min-w-[200px] md:min-w-0 md:flex-1"
                                >
                                    <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden group">
                                        <CardContent className="p-6">
                                            <div className={cn("inline-flex p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-500", stat.bg)}>
                                                <stat.icon className={cn("h-6 w-6", stat.color)} />
                                            </div>
                                            <p className="text-3xl font-black tracking-tighter italic">{stat.value}</p>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
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
