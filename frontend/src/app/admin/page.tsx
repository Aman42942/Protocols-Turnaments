"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import api from '@/lib/api';
import {
    Trophy, Users, IndianRupee, Plus, ArrowUpRight, ArrowDownRight,
    Activity, Clock, Loader2, Wallet, TrendingUp, UserPlus, Layout, Palette
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface AdminStats {
    totalUsers: number;
    totalTournaments: number;
    activeTournaments: number;
    totalTeams: number;
    totalRevenue: number;
    entryFeeRevenue: number;
    pendingDeposits: number;
    newUsersThisWeek: number;
    recentUsers: { id: string; name: string; email: string; avatar?: string; createdAt: string }[];
    recentTransactions: {
        id: string; type: string; amount: number; status: string; method?: string; createdAt: string;
        wallet: { user: { name: string; email: string } };
    }[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, tournamentsRes] = await Promise.allSettled([
                api.get('/users/admin/stats'),
                api.get('/tournaments'),
            ]);
            if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
            if (tournamentsRes.status === 'fulfilled') setTournaments(tournamentsRes.value.data?.slice(0, 5) || []);
        } catch (err) {
            console.error('Failed to load admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Revenue',
            value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`,
            icon: <IndianRupee className="w-5 h-5 text-green-500" />,
            sub: `Entry fees: ₹${(stats?.entryFeeRevenue || 0).toLocaleString('en-IN')}`,
            color: 'text-green-500',
        },
        {
            title: 'Total Players',
            value: (stats?.totalUsers || 0).toLocaleString(),
            icon: <Users className="w-5 h-5 text-blue-500" />,
            sub: `+${stats?.newUsersThisWeek || 0} this week`,
            color: 'text-blue-500',
        },
        {
            title: 'Active Tournaments',
            value: stats?.activeTournaments?.toString() || '0',
            icon: <Trophy className="w-5 h-5 text-orange-500" />,
            sub: `${stats?.totalTournaments || 0} total`,
            color: 'text-orange-500',
        },
        {
            title: 'Pending Deposits',
            value: stats?.pendingDeposits?.toString() || '0',
            icon: <Clock className="w-5 h-5 text-yellow-500" />,
            sub: 'Needs approval',
            color: stats?.pendingDeposits ? 'text-yellow-500' : 'text-muted-foreground',
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                    <p className="text-muted-foreground">
                        Real-time platform analytics · Auto-refreshes every 30s
                    </p>
                </div>
                <div className="flex gap-2">
                    {(stats?.pendingDeposits || 0) > 0 && (
                        <Link href="/admin/payments">
                            <Button variant="outline" className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10">
                                <Clock className="w-4 h-4 mr-2" />
                                {stats?.pendingDeposits} Pending
                            </Button>
                        </Link>
                    )}
                    <Link href="/admin/tournaments/create">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Tournament
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <div className="p-2 rounded-full bg-secondary">{stat.icon}</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className={`text-xs mt-1 ${stat.color}`}>{stat.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>



            {/* Quick Admin Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <Link href="/admin/tournaments/create">
                            <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                                <Plus className="h-6 w-6" />
                                <span className="text-xs">New Event</span>
                            </Button>
                        </Link>
                        <Link href="/admin/tournaments">
                            <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                                <Trophy className="h-6 w-6" />
                                <span className="text-xs">Events</span>
                            </Button>
                        </Link>
                        <Link href="/admin/users">
                            <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                                <Users className="h-6 w-6" />
                                <span className="text-xs">Users</span>
                            </Button>
                        </Link>
                        <Link href="/admin/payments">
                            <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                                <Wallet className="h-6 w-6" />
                                <span className="text-xs">Payments</span>
                            </Button>
                        </Link>
                        <Link href="/admin/settings/theme">
                            <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4 border-primary/50 bg-primary/5 hover:bg-primary/10">
                                <TrendingUp className="h-6 w-6 text-primary" />
                                <span className="text-xs font-medium text-primary">Theme</span>
                            </Button>
                        </Link>
                        <Link href="/admin/cms">
                            <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                                <Layout className="h-6 w-6" />
                                <span className="text-xs">Content</span>
                            </Button>
                        </Link>
                        <Link href="/admin/health">
                            <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                                <Activity className="h-6 w-6 text-green-600" />
                                <span className="text-xs">Health</span>
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Tournaments */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Recent Tournaments</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Latest events on the platform</p>
                            </div>
                            <Link href="/admin/tournaments">
                                <Button variant="outline" size="sm">View All</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {tournaments.length === 0 ? (
                                <p className="text-center text-muted-foreground py-6">No tournaments yet</p>
                            ) : tournaments.map((t: any) => (
                                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                                    <div>
                                        <p className="font-medium text-sm">{t.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{t.game}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {t._count?.teams || 0} / {t.maxTeams || '∞'} players
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">₹{t.prizePool || 0}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'LIVE' ? 'bg-red-500/10 text-red-500' :
                                            t.status === 'UPCOMING' ? 'bg-green-500/10 text-green-500' :
                                                t.status === 'COMPLETED' ? 'bg-gray-500/10 text-gray-500' :
                                                    'bg-yellow-500/10 text-yellow-500'
                                            }`}>
                                            {t.status || 'UPCOMING'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Live financial transactions</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(!stats?.recentTransactions || stats.recentTransactions.length === 0) ? (
                                <p className="text-center text-muted-foreground py-6">No activity yet</p>
                            ) : stats.recentTransactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${tx.type === 'DEPOSIT' || tx.type === 'WINNINGS'
                                            ? 'bg-green-500/10 text-green-500'
                                            : tx.type === 'ENTRY_FEE' ? 'bg-orange-500/10 text-orange-500'
                                                : 'bg-red-500/10 text-red-500'
                                            }`}>
                                            {tx.type === 'DEPOSIT' || tx.type === 'WINNINGS'
                                                ? <ArrowDownRight className="h-4 w-4" />
                                                : <ArrowUpRight className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{tx.wallet?.user?.name || 'User'}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{tx.type.replace('_', ' ').toLowerCase()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-bold ${tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' ? 'text-green-500' : ''
                                            }`}>
                                            {tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' ? '+' : '-'}₹{tx.amount}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">{formatDate(tx.createdAt)} {formatTime(tx.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Users */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-primary" />
                                New Signups
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Latest registered users</p>
                        </div>
                        <Link href="/admin/users">
                            <Button variant="outline" size="sm">Manage Users</Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        {stats?.recentUsers?.map((u) => (
                            <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card min-w-[200px]">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {u.name?.[0] || u.email[0]}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{u.name || 'Unnamed'}</p>
                                    <p className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
