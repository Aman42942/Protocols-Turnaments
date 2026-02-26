"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import api from '@/lib/api';
import {
    Trophy, Users, IndianRupee, Clock, Loader2,
    Wallet, TrendingUp, UserPlus, Activity, Plus,
    ArrowUpRight, ArrowDownRight, Layout, Zap, BarChart3,
    ChevronRight, ShieldCheck, Flame, Swords, Target
} from 'lucide-react';

// ─── Glitch Number Animation ────────────────────────────────────────────────
function GlitchCounter({ value, prefix = '' }: { value: number; prefix?: string }) {
    const [display, setDisplay] = useState(0);
    const [glitch, setGlitch] = useState(false);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        if (value === 0) { setDisplay(0); return; }
        started.current = true;

        let cur = 0;
        const duration = 1200;
        const steps = 60;
        const inc = value / steps;
        const interval = duration / steps;

        const timer = setInterval(() => {
            cur += inc;
            if (cur >= value) {
                setDisplay(value);
                clearInterval(timer);
                // Final glitch flash
                setGlitch(true);
                setTimeout(() => setGlitch(false), 300);
            } else {
                setDisplay(Math.floor(cur));
            }
        }, interval);
        return () => clearInterval(timer);
    }, [value]);

    return (
        <span className={glitch ? 'animate-pulse' : ''}>
            {prefix}{display.toLocaleString('en-IN')}
        </span>
    );
}

// ─── HUD Corner Brackets ─────────────────────────────────────────────────────
function HUDCard({ children, color, className = '' }: { children: React.ReactNode; color: string; className?: string }) {
    return (
        <div className={`relative rounded-2xl border border-border bg-card overflow-hidden group ${className}`}>
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 rounded-tl-sm opacity-60 transition-opacity group-hover:opacity-100" style={{ borderColor: color }} />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 rounded-tr-sm opacity-60 transition-opacity group-hover:opacity-100" style={{ borderColor: color }} />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 rounded-bl-sm opacity-60 transition-opacity group-hover:opacity-100" style={{ borderColor: color }} />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 rounded-br-sm opacity-60 transition-opacity group-hover:opacity-100" style={{ borderColor: color }} />

            {/* Bottom glow on hover */}
            <motion.div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(to right, transparent, ${color}, transparent)` }}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
            {children}
        </div>
    );
}

interface AdminStats {
    totalUsers: number; totalTournaments: number; activeTournaments: number;
    totalRevenue: number; entryFeeRevenue: number; pendingDeposits: number; newUsersThisWeek: number;
    recentUsers: { id: string; name: string; email: string; createdAt: string }[];
    recentTransactions: { id: string; type: string; amount: number; status: string; createdAt: string; wallet: { user: { name: string } } }[];
}

const STAT_CONFIG = [
    { label: 'Total Revenue', key: 'totalRevenue' as const, prefix: '₹', icon: IndianRupee, color: '#22c55e', sub: (s: AdminStats) => `Entry: ₹${(s.entryFeeRevenue || 0).toLocaleString('en-IN')}` },
    { label: 'Total Players', key: 'totalUsers' as const, icon: Users, color: '#3b82f6', sub: (s: AdminStats) => `+${s.newUsersThisWeek || 0} this week` },
    { label: 'Active Events', key: 'activeTournaments' as const, icon: Flame, color: '#f97316', sub: (s: AdminStats) => `${s.totalTournaments || 0} total` },
    { label: 'Pending', key: 'pendingDeposits' as const, icon: Clock, color: '#eab308', sub: () => 'Needs approval' },
];

const QUICK_ACTIONS = [
    { label: 'New Event', href: '/admin/tournaments/create', icon: Plus, color: '#6366f1' },
    { label: 'Tournaments', href: '/admin/tournaments', icon: Trophy, color: '#f97316' },
    { label: 'Users', href: '/admin/users', icon: Users, color: '#3b82f6' },
    { label: 'Payments', href: '/admin/payments', icon: Wallet, color: '#22c55e' },
    { label: 'Analytics', href: '/admin/transactions', icon: BarChart3, color: '#a855f7' },
    { label: 'Health', href: '/admin/health', icon: Activity, color: '#10b981' },
    { label: 'Content', href: '/admin/cms', icon: Layout, color: '#eab308' },
    { label: 'Settings', href: '/admin/settings', icon: ShieldCheck, color: '#94a3b8' },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const iv = setInterval(fetchData, 30000);
        return () => clearInterval(iv);
    }, []);

    const fetchData = async () => {
        try {
            const [sRes, tRes] = await Promise.allSettled([api.get('/users/admin/stats'), api.get('/tournaments')]);
            if (sRes.status === 'fulfilled') setStats(sRes.value.data);
            if (tRes.status === 'fulfilled') setTournaments(tRes.value.data?.slice(0, 5) || []);
        } finally { setLoading(false); }
    };

    const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const fmtT = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                    <motion.div className="absolute inset-0 rounded-2xl border-2 border-primary/30"
                        animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
                    <motion.div className="absolute inset-2 rounded-xl border border-primary/50"
                        animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
                    <div className="absolute inset-4 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Swords className="w-4 h-4 text-primary" />
                    </div>
                </div>
                <p className="text-muted-foreground text-sm font-bold tracking-widest">LOADING INTEL...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-5 pb-4">
            {/* ─── HEADER ──────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                            <Target className="w-5 h-5 text-primary" />
                        </motion.div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Dashboard</h1>
                    </div>
                    <p className="text-muted-foreground text-xs flex items-center gap-1.5">
                        <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        LIVE INTEL · AUTO-SYNC 30s
                    </p>
                </div>
                {(stats?.pendingDeposits || 0) > 0 && (
                    <Link href="/admin/payments">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/40 text-yellow-500 px-3 py-2 rounded-xl text-xs font-bold">
                            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                                <Clock className="w-3.5 h-3.5" />
                            </motion.div>
                            {stats?.pendingDeposits} Pending
                        </motion.div>
                    </Link>
                )}
            </motion.div>

            {/* ─── STAT CARDS ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {STAT_CONFIG.map((cfg, i) => {
                    const Icon = cfg.icon;
                    const value = stats?.[cfg.key] || 0;
                    return (
                        <motion.div key={i}
                            initial={{ opacity: 0, y: 24, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: i * 0.1, type: 'spring', stiffness: 180 }}
                        >
                            <HUDCard color={cfg.color}>
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <motion.div whileHover={{ rotate: 15, scale: 1.2 }}
                                            className="p-2 rounded-xl" style={{ background: `${cfg.color}18` }}>
                                            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                                        </motion.div>
                                        <motion.div animate={{ y: [-2, 2, -2] }} transition={{ duration: 3, repeat: Infinity }}>
                                            <TrendingUp className="w-3 h-3 text-muted-foreground/40" />
                                        </motion.div>
                                    </div>
                                    <p className="text-2xl font-black leading-none" style={{ color: cfg.color }}>
                                        <GlitchCounter value={value} prefix={cfg.prefix} />
                                    </p>
                                    <p className="text-[10px] font-bold text-foreground mt-1.5 truncate">{cfg.label}</p>
                                    <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{stats ? cfg.sub(stats) : '—'}</p>
                                </div>
                            </HUDCard>
                        </motion.div>
                    );
                })}
            </div>

            {/* ─── QUICK ACTIONS ───────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="flex items-center gap-2 mb-3">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                        <Zap className="w-3.5 h-3.5 text-primary" />
                    </motion.div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quick Actions</p>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {QUICK_ACTIONS.map((action, i) => {
                        const Icon = action.icon;
                        return (
                            <Link key={action.href} href={action.href}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.7 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.45 + i * 0.04, type: 'spring', stiffness: 200 }}
                                    whileHover={{ y: -4, scale: 1.05 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="group flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-border bg-card hover:border-border/80 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    {/* Hover glow bg */}
                                    <motion.div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                                        style={{ background: `radial-gradient(ellipse at center, ${action.color}12, transparent 70%)` }}
                                    />
                                    <div className="p-2 rounded-xl relative z-10" style={{ background: `${action.color}15` }}>
                                        <Icon className="w-4 h-4" style={{ color: action.color }} />
                                    </div>
                                    <span className="text-[9px] font-bold text-muted-foreground text-center leading-tight relative z-10">{action.label}</span>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </motion.div>

            {/* ─── LISTS ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Tournaments */}
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                    <HUDCard color="#f97316">
                        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg" style={{ background: '#f9731615' }}>
                                    <Trophy className="w-4 h-4" style={{ color: '#f97316' }} />
                                </div>
                                <p className="font-bold text-sm">Recent Events</p>
                            </div>
                            <Link href="/admin/tournaments">
                                <span className="text-[10px] text-primary font-bold flex items-center gap-0.5 hover:gap-1.5 transition-all">
                                    View All <ChevronRight className="w-3 h-3" />
                                </span>
                            </Link>
                        </div>
                        <div className="divide-y divide-border">
                            {tournaments.length === 0 ? (
                                <p className="text-center text-muted-foreground text-sm py-10">No tournaments yet</p>
                            ) : tournaments.map((t: any, i) => (
                                <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + i * 0.06 }}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-all group">
                                    <div>
                                        <p className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">{t.title}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">{t.game}</span>
                                            <span className="text-[10px] text-muted-foreground">{t._count?.teams || 0}/{t.maxTeams || '∞'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                        <p className="font-black text-sm">₹{(t.prizePool || 0).toLocaleString('en-IN')}</p>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${t.status === 'LIVE' ? 'bg-red-500/10 text-red-500' : t.status === 'UPCOMING' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                                            {t.status === 'LIVE' && <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-1 h-1 rounded-full bg-red-500" />}
                                            {t.status || 'UPCOMING'}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </HUDCard>
                </motion.div>

                {/* Transactions */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                    <HUDCard color="#22c55e">
                        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg" style={{ background: '#22c55e15' }}>
                                    <IndianRupee className="w-4 h-4" style={{ color: '#22c55e' }} />
                                </div>
                                <p className="font-bold text-sm">Recent Activity</p>
                            </div>
                            <Link href="/admin/transactions">
                                <span className="text-[10px] text-primary font-bold flex items-center gap-0.5 hover:gap-1.5 transition-all">
                                    View All <ChevronRight className="w-3 h-3" />
                                </span>
                            </Link>
                        </div>
                        <div className="divide-y divide-border">
                            {(!stats?.recentTransactions?.length) ? (
                                <p className="text-center text-muted-foreground text-sm py-10">No activity yet</p>
                            ) : stats.recentTransactions.map((tx, i) => {
                                const isIn = ['DEPOSIT', 'WINNINGS'].includes(tx.type);
                                return (
                                    <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.05 }}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-all">
                                        <motion.div whileHover={{ rotate: isIn ? -15 : 15 }}
                                            className={`p-2 rounded-xl shrink-0`} style={{ background: isIn ? '#22c55e18' : '#f9731618' }}>
                                            {isIn
                                                ? <ArrowDownRight className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                                                : <ArrowUpRight className="w-3.5 h-3.5" style={{ color: '#f97316' }} />}
                                        </motion.div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{tx.wallet?.user?.name || 'User'}</p>
                                            <p className="text-[10px] text-muted-foreground capitalize">{tx.type.replace('_', ' ').toLowerCase()}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black" style={{ color: isIn ? '#22c55e' : undefined }}>
                                                {isIn ? '+' : '-'}₹{tx.amount}
                                            </p>
                                            <p className="text-[9px] text-muted-foreground">{fmtT(tx.createdAt)}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </HUDCard>
                </motion.div>
            </div>

            {/* ─── NEW USERS ───────────────────────────────────────── */}
            {stats?.recentUsers && stats.recentUsers.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
                    <HUDCard color="#3b82f6">
                        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg" style={{ background: '#3b82f615' }}>
                                    <UserPlus className="w-4 h-4" style={{ color: '#3b82f6' }} />
                                </div>
                                <p className="font-bold text-sm">New Signups</p>
                            </div>
                            <Link href="/admin/users">
                                <span className="text-[10px] text-primary font-bold flex items-center gap-0.5 hover:gap-1.5 transition-all">
                                    Manage <ChevronRight className="w-3 h-3" />
                                </span>
                            </Link>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {stats.recentUsers.map((u, i) => (
                                <motion.div key={u.id}
                                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 + i * 0.05 }}
                                    whileHover={{ x: 3 }}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/10 hover:bg-muted/30 transition-all">
                                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shrink-0 shadow-lg shadow-primary/20">
                                        {u.name?.[0]?.toUpperCase() || u.email[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm truncate">{u.name || 'Unnamed'}</p>
                                        <p className="text-[10px] text-muted-foreground">{fmt(u.createdAt)}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </HUDCard>
                </motion.div>
            )}
        </div>
    );
}
