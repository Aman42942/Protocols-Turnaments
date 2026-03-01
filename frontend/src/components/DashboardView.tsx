"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trophy, Crosshair, Users, Timer, ArrowUpRight, Wallet, Loader2, Bell, Calendar, Gamepad2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import api from '@/lib/api';
import { motion } from 'framer-motion';

interface DashboardData {
    userName: string;
    walletBalance: number;
    tournamentsCount: number;
    teamsCount: number;
    notifications: any[];
    upcomingTournaments: any[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100
        }
    }
};

export function DashboardView() {
    const [data, setData] = useState<DashboardData>({
        userName: '',
        walletBalance: 0,
        tournamentsCount: 0,
        teamsCount: 0,
        notifications: [],
        upcomingTournaments: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [userRes, walletRes, tournamentsRes, teamsRes, notificationsRes] = await Promise.allSettled([
                api.get('/users/me'),
                api.get('/wallet'),
                api.get('/tournaments'),
                api.get('/teams'),
                api.get('/notifications?limit=5'),
            ]);

            const user = userRes.status === 'fulfilled' ? userRes.value.data : null;
            const wallet = walletRes.status === 'fulfilled' ? walletRes.value.data : null;
            const tournaments = tournamentsRes.status === 'fulfilled' ? tournamentsRes.value.data : [];
            const teams = teamsRes.status === 'fulfilled' ? teamsRes.value.data : [];
            const notifications = notificationsRes.status === 'fulfilled' ? notificationsRes.value.data : { notifications: [] };

            const upcoming = tournaments
                .filter((t: any) => t.status === 'UPCOMING' && new Date(t.startDate) > new Date())
                .slice(0, 3);

            setData({
                userName: user?.name || JSON.parse(localStorage.getItem('user') || '{}')?.name || 'Gamer',
                walletBalance: wallet?.balance || 0,
                tournamentsCount: tournaments.length,
                teamsCount: teams.length,
                notifications: notifications?.notifications || notifications || [],
                upcomingTournaments: upcoming,
            });
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setData(prev => ({ ...prev, userName: JSON.parse(storedUser).name || 'Gamer' }));
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = d.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days === 0 && hours > 0) return `Today, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        if (days === 1) return `Tomorrow, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="pt-8 pb-12 relative overflow-hidden"
        >
            {/* Background Aesthetic Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -z-10 -translate-x-1/2 translate-y-1/2" />

            <div className="container px-4 sm:px-6 lg:px-8">
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">
                            Combat Center
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">Welcome back, <span className="text-primary font-semibold">{data.userName}</span></p>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/dashboard/wallet">
                            <Button className="h-12 px-6 rounded-xl border-2 border-primary/40 bg-background hover:bg-muted transition-all duration-300 shadow-sm">
                                <Wallet className="mr-2 h-5 w-5 text-primary" />
                                <span className="font-orbitron font-bold text-foreground">{data.walletBalance.toFixed(2)} Coins</span>
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="h-full">
                        <Card className="bg-card border border-green-500/30 neon-green transition-all duration-300 h-full overflow-hidden group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">Treasury</CardTitle>
                                <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                                    <Wallet className="h-5 w-5 text-green-500" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold font-orbitron text-foreground">{data.walletBalance.toFixed(2)} Coins</div>
                                <div className="mt-4">
                                    <Link href="/dashboard/wallet" className="text-green-600 dark:text-green-500/80 hover:text-green-500 text-xs font-semibold flex items-center gap-1 group/link">
                                        REPLENISH FUNDS <ArrowUpRight className="h-3 w-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="h-full">
                        <Card className="bg-card border border-primary/30 neon-blue transition-all duration-300 h-full overflow-hidden group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-primary uppercase tracking-wider">Campaigns</CardTitle>
                                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                    <Trophy className="h-5 w-5 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold font-orbitron text-foreground">{data.tournamentsCount}</div>
                                <div className="mt-4">
                                    <Link href="/tournaments" className="text-primary/80 hover:text-primary text-xs font-semibold flex items-center gap-1 group/link">
                                        BATTLE LOBBY <ArrowUpRight className="h-3 w-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="h-full">
                        <Card className="bg-card border border-purple-500/30 neon-purple transition-all duration-300 h-full overflow-hidden group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">Alliances</CardTitle>
                                <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                    <Users className="h-5 w-5 text-purple-500" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold font-orbitron text-foreground">{data.teamsCount}</div>
                                <div className="mt-4">
                                    <Link href="/dashboard/teams" className="text-purple-600 dark:text-purple-500/80 hover:text-purple-500 text-xs font-semibold flex items-center gap-1 group/link">
                                        SQUAD COMMAND <ArrowUpRight className="h-3 w-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="h-full">
                        <Card className="bg-card border border-yellow-500/30 neon-gold transition-all duration-300 h-full overflow-hidden group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-500 uppercase tracking-wider">Comms</CardTitle>
                                <div className="p-2 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                                    <Bell className="h-5 w-5 text-yellow-500" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold font-orbitron text-foreground">{Array.isArray(data.notifications) ? data.notifications.filter((n: any) => !n.read).length : 0}</div>
                                <div className="mt-4">
                                    <Link href="/notifications" className="text-yellow-600 dark:text-yellow-500/80 hover:text-yellow-500 text-xs font-semibold flex items-center gap-1 group/link">
                                        INTEL FEED <ArrowUpRight className="h-3 w-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
                        {/* Upcoming Tournaments */}
                        <Card className="bg-card border border-border overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-xl font-orbitron tracking-tight">Active Deployments</CardTitle>
                                </div>
                                <Link href="/tournaments">
                                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">Browse All</Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {data.upcomingTournaments.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
                                        <Gamepad2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p className="font-orbitron text-sm">NO ACTIVE MISSIONS</p>
                                        <Link href="/tournaments" className="text-primary text-xs hover:underline mt-2 block">FIND COMBAT →</Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {data.upcomingTournaments.map((t: any) => (
                                            <Link key={t.id} href={`/tournaments/${t.id}`}>
                                                <motion.div
                                                    whileHover={{ x: 5 }}
                                                    className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/20 hover:bg-muted/50 transition-all cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 group-hover:scale-110 transition-transform">
                                                            <Trophy className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold font-orbitron text-lg group-hover:text-primary transition-colors">{t.title}</h3>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                                <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {formatDate(t.startDate)}</span>
                                                                <span className="text-muted-foreground/30">|</span>
                                                                <span className="uppercase tracking-widest text-primary/70">{t.game}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <Badge className="bg-primary hover:bg-primary text-white font-orbitron px-3 py-1">{t.prizePool} Coins</Badge>
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Entry: {t.entryFeePerPerson} Coins</span>
                                                    </div>
                                                </motion.div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Notifications */}
                        <Card className="bg-card border border-border">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                                <div className="flex items-center gap-2">
                                    <Crosshair className="h-5 w-5 text-yellow-500" />
                                    <CardTitle className="text-xl font-orbitron tracking-tight">Intel Log</CardTitle>
                                </div>
                                <Link href="/notifications">
                                    <Button variant="ghost" size="sm" className="hover:bg-muted/50">View History</Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {!Array.isArray(data.notifications) || data.notifications.length === 0 ? (
                                    <div className="text-center py-10 opacity-30">
                                        <Bell className="h-10 w-10 mx-auto mb-2" />
                                        <p className="text-xs font-orbitron uppercase">Silent Channel</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {data.notifications.slice(0, 5).map((n: any) => (
                                            <div key={n.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0 group">
                                                <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 animate-pulse ${n.type === 'success' ? 'bg-green-500 shadow-green-500/50' :
                                                    n.type === 'warning' ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-primary shadow-primary/50'
                                                    }`} />
                                                <div className="space-y-1 flex-1">
                                                    <p className="text-sm font-bold group-hover:text-primary transition-colors">{n.title}</p>
                                                    <p className="text-xs text-muted-foreground line-clamp-1">{n.message}</p>
                                                </div>
                                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Sidebar */}
                    <motion.div variants={itemVariants} className="space-y-6">
                        <Card className="bg-card border border-border">
                            <CardHeader>
                                <CardTitle className="font-orbitron text-lg uppercase tracking-wider text-primary">Tactical Links</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Link href="/tournaments">
                                    <Button className="w-full justify-between h-12 bg-muted/30 hover:bg-primary/10 hover:text-primary border border-border transition-all group" variant="outline">
                                        <span className="flex items-center"><Trophy className="mr-3 h-5 w-5 opacity-70" /> Join Battle</span>
                                        <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                                    </Button>
                                </Link>
                                <Link href="/dashboard/teams">
                                    <Button className="w-full justify-between h-12 bg-muted/30 hover:bg-purple-500/10 hover:text-purple-500 border border-border transition-all group" variant="outline">
                                        <span className="flex items-center"><Users className="mr-3 h-5 w-5 opacity-70" /> Squad HQ</span>
                                        <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                                    </Button>
                                </Link>
                                <Link href="/dashboard/wallet">
                                    <Button className="w-full justify-between h-12 bg-muted/30 hover:bg-green-500/10 hover:text-green-500 border border-border transition-all group" variant="outline">
                                        <span className="flex items-center"><Wallet className="mr-3 h-5 w-5 opacity-70" /> Treasury</span>
                                        <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                                    </Button>
                                </Link>
                                <Link href="/settings">
                                    <Button className="w-full justify-between h-12 bg-muted/30 hover:bg-yellow-500/10 hover:text-yellow-500 border border-border transition-all group" variant="outline">
                                        <span className="flex items-center"><Crosshair className="mr-3 h-5 w-5 opacity-70" /> Loadout Ops</span>
                                        <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-primary/20 via-primary/5 to-purple-500/10 border border-primary/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Trophy className="h-24 w-24 rotate-12" />
                            </div>
                            <CardHeader>
                                <CardTitle className="text-primary font-orbitron flex items-center gap-2">
                                    GLORY AWAITS
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <p className="text-sm text-muted-foreground mb-6 font-medium leading-relaxed">
                                    Engage in elite competitions, dominate the leaderboard, and claim your share of the massive prize pools.
                                </p>
                                <Link href="/tournaments">
                                    <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold font-orbitron shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                        DEPLOY TO ARENA
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
