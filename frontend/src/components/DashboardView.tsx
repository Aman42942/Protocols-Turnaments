"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trophy, Crosshair, Users, Timer, ArrowUpRight, Wallet, Loader2, Bell, Calendar, Gamepad2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import api from '@/lib/api';

interface DashboardData {
    userName: string;
    walletBalance: number;
    tournamentsCount: number;
    teamsCount: number;
    notifications: any[];
    upcomingTournaments: any[];
}

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
            // Fetch all data in parallel
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

            // Filter upcoming tournaments
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
            // Fallback to localStorage
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
        <div className="pt-8 pb-12">
            <div className="container">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">Welcome back, {data.userName}</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard/wallet">
                            <Button>
                                <Wallet className="mr-2 h-4 w-4" />
                                ₹{data.walletBalance.toFixed(2)}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                            <Wallet className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{data.walletBalance.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                                <Link href="/dashboard/wallet" className="text-primary hover:underline">Add Money →</Link>
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
                            <Trophy className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.tournamentsCount}</div>
                            <p className="text-xs text-muted-foreground">
                                <Link href="/tournaments" className="text-primary hover:underline">Browse All →</Link>
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
                            <Users className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.teamsCount}</div>
                            <p className="text-xs text-muted-foreground">
                                <Link href="/dashboard/teams" className="text-primary hover:underline">Manage Teams →</Link>
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                            <Bell className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{Array.isArray(data.notifications) ? data.notifications.filter((n: any) => !n.read).length : 0}</div>
                            <p className="text-xs text-muted-foreground">
                                <Link href="/notifications" className="text-primary hover:underline">View All →</Link>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Upcoming Tournaments */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Upcoming Tournaments</CardTitle>
                                <Link href="/tournaments">
                                    <Button variant="ghost" size="sm">View All</Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {data.upcomingTournaments.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Gamepad2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                        <p className="font-medium">No upcoming tournaments</p>
                                        <Link href="/tournaments" className="text-primary text-sm hover:underline">Browse tournaments →</Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {data.upcomingTournaments.map((t: any) => (
                                            <Link key={t.id} href={`/tournaments/${t.id}`}>
                                                <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50 hover:bg-muted/50 transition-colors cursor-pointer">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-primary/10 p-2 rounded-md">
                                                            <Trophy className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold">{t.title}</h3>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Timer className="h-3 w-3" />
                                                                <span>{formatDate(t.startDate)}</span>
                                                                <span>•</span>
                                                                <span>{t.game}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <Badge variant="secondary">₹{t.prizePool} Prize</Badge>
                                                        <span className="text-xs text-muted-foreground">₹{t.entryFeePerPerson} entry</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Notifications */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Recent Activity</CardTitle>
                                <Link href="/notifications">
                                    <Button variant="ghost" size="sm">View All</Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {!Array.isArray(data.notifications) || data.notifications.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Bell className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                        <p className="font-medium">No recent activity</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {data.notifications.slice(0, 5).map((n: any) => (
                                            <div key={n.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                                                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.type === 'success' ? 'bg-green-500' :
                                                    n.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                                    }`} />
                                                <div className="space-y-1 flex-1">
                                                    <p className="text-sm font-medium leading-none">{n.title}</p>
                                                    <p className="text-xs text-muted-foreground line-clamp-1">{n.message}</p>
                                                </div>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href="/tournaments">
                                    <Button className="w-full justify-start" variant="ghost">
                                        <Trophy className="mr-2 h-4 w-4" /> Find Tournament
                                    </Button>
                                </Link>
                                <Link href="/dashboard/teams">
                                    <Button className="w-full justify-start" variant="ghost">
                                        <Users className="mr-2 h-4 w-4" /> My Teams
                                    </Button>
                                </Link>
                                <Link href="/dashboard/wallet">
                                    <Button className="w-full justify-start" variant="ghost">
                                        <Wallet className="mr-2 h-4 w-4" /> Add Money
                                    </Button>
                                </Link>
                                <Link href="/settings">
                                    <Button className="w-full justify-start" variant="ghost">
                                        <Crosshair className="mr-2 h-4 w-4" /> Link Game IDs
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader>
                                <CardTitle className="text-primary flex items-center gap-2">
                                    <Trophy className="h-5 w-5" />
                                    Earn Real Money
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Join tournaments, win matches, and earn real money directly to your wallet. Withdraw anytime!
                                </p>
                                <Link href="/tournaments">
                                    <Button className="w-full">Browse Tournaments</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
