"use client";
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, Users, CreditCard, Settings,
    LayoutDashboard, LogOut, X, Activity, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

const NAV_ITEMS = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard, color: '#3b82f6', accent: 'before:bg-blue-500', glow: 'group-hover:shadow-blue-500/40' },
    { name: 'Tournaments', href: '/admin/tournaments', icon: Trophy, color: '#f97316', accent: 'before:bg-orange-500', glow: 'group-hover:shadow-orange-500/40' },
    { name: 'Users', href: '/admin/users', icon: Users, color: '#22c55e', accent: 'before:bg-green-500', glow: 'group-hover:shadow-green-500/40' },
    { name: 'Transactions', href: '/admin/transactions', icon: CreditCard, color: '#a855f7', accent: 'before:bg-purple-500', glow: 'group-hover:shadow-purple-500/40' },
    { name: 'Health', href: '/admin/health', icon: Activity, color: '#10b981', accent: 'before:bg-emerald-500', glow: 'group-hover:shadow-emerald-500/40' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, color: '#94a3b8', accent: 'before:bg-slate-400', glow: 'group-hover:shadow-slate-400/30' },
];

// Animated scanning line
function ScanLine() {
    return (
        <motion.div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none z-0"
            animate={{ y: [0, 280, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
    );
}

interface AdminSidebarProps { isOpen: boolean; setIsOpen: (open: boolean) => void; }

export function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
    const pathname = usePathname();
    const isActive = (href: string) => href === '/admin' ? pathname === href : pathname.startsWith(href);

    return (
        <>
            {/* ═══ DESKTOP SIDEBAR ════════════════════════════════════════ */}
            <aside className="hidden md:flex flex-col w-64 min-h-screen bg-card border-r border-border sticky top-0 h-screen overflow-hidden">
                {/* HUD corner decorations */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/50 pointer-events-none z-10" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/50 pointer-events-none z-10" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/50 pointer-events-none z-10" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/50 pointer-events-none z-10" />

                <ScanLine />

                {/* Logo */}
                <div className="relative p-5 border-b border-border z-10">
                    <Link href="/admin" className="flex items-center gap-3 group">
                        <motion.div
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.4 }}
                            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40 relative overflow-hidden"
                        >
                            <ShieldCheck className="w-5 h-5 text-primary-foreground relative z-10" />
                            <motion.div
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                className="absolute inset-y-0 w-6 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                            />
                        </motion.div>
                        <div>
                            <p className="font-black text-foreground text-sm tracking-widest uppercase">ADMIN</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <motion.span
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="w-1.5 h-1.5 rounded-full bg-green-500"
                                />
                                <p className="text-[9px] text-primary font-bold tracking-widest">CONTROL PANEL</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto relative z-10">
                    {NAV_ITEMS.map((item, idx) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link key={item.href} href={item.href}>
                                <motion.div
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.96 }}
                                    className={cn(
                                        'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden border',
                                        active
                                            ? 'border-border bg-muted/50'
                                            : 'border-transparent hover:bg-muted/30 hover:border-border/50'
                                    )}
                                >
                                    {/* Active left bar */}
                                    {active && (
                                        <motion.div
                                            layoutId="sidebar-active"
                                            className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                                            style={{ background: item.color }}
                                        />
                                    )}

                                    {/* Icon with glow */}
                                    <motion.div
                                        whileHover={{ scale: 1.15, rotate: 5 }}
                                        className="p-1.5 rounded-lg transition-all"
                                        style={active ? { background: `${item.color}20`, boxShadow: `0 0 12px ${item.color}40` } : {}}
                                    >
                                        <Icon className="w-4 h-4 transition-all" style={{ color: active ? item.color : undefined }} />
                                    </motion.div>

                                    <span className={cn('text-sm font-semibold transition-colors', active ? 'text-foreground' : 'text-muted-foreground')}>
                                        {item.name}
                                    </span>

                                    {/* Active dot */}
                                    {active && (
                                        <motion.div
                                            className="ml-auto w-1.5 h-1.5 rounded-full"
                                            style={{ background: item.color }}
                                            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                    )}

                                    {/* Hover shimmer */}
                                    <motion.div
                                        initial={{ x: '-100%' }}
                                        whileHover={{ x: '200%' }}
                                        transition={{ duration: 0.5 }}
                                        className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
                                    />
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom: Theme + Logout */}
                <div className="relative p-3 border-t border-border space-y-1 z-10">
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Theme</span>
                        <ThemeToggle />
                    </div>
                    <motion.button
                        whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left hover:bg-destructive/10 transition-all text-muted-foreground hover:text-destructive border border-transparent hover:border-destructive/20"
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-semibold">Logout</span>
                    </motion.button>
                </div>
            </aside>

            {/* ═══ MOBILE DRAWER ══════════════════════════════════════════ */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-md md:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                            className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col md:hidden overflow-hidden"
                        >
                            {/* Corner HUD */}
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/50 pointer-events-none" />
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/50 pointer-events-none" />
                            <ScanLine />

                            <div className="p-5 border-b border-border flex items-center justify-between relative z-10">
                                <Link href="/admin" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
                                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                                        <ShieldCheck className="w-4 h-4 text-primary-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-black text-foreground text-sm">ADMIN</p>
                                        <p className="text-[9px] text-primary font-bold tracking-widest">CONTROL PANEL</p>
                                    </div>
                                </Link>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsOpen(false)} className="p-2 rounded-xl hover:bg-muted">
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </motion.button>
                            </div>

                            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto relative z-10">
                                {NAV_ITEMS.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);
                                    return (
                                        <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                                            <motion.div whileTap={{ scale: 0.96 }}
                                                className={cn('flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all',
                                                    active ? 'border-border bg-muted/50' : 'border-transparent hover:bg-muted/30'
                                                )}
                                                style={active ? { borderColor: `${item.color}30` } : {}}
                                            >
                                                <div className="p-1.5 rounded-lg" style={active ? { background: `${item.color}15`, boxShadow: `0 0 10px ${item.color}30` } : {}}>
                                                    <Icon className="w-5 h-5" style={{ color: active ? item.color : undefined }} />
                                                </div>
                                                <span className={cn('font-semibold', active ? 'text-foreground' : 'text-muted-foreground')}>{item.name}</span>
                                                {active && <motion.div className="ml-auto w-2 h-2 rounded-full" style={{ background: item.color }} animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />}
                                            </motion.div>
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="p-3 border-t border-border space-y-1 relative z-10">
                                <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-muted/30">
                                    <span className="text-xs font-bold text-muted-foreground">Toggle Theme</span>
                                    <ThemeToggle />
                                </div>
                                <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-2xl w-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                                    <LogOut className="w-5 h-5 shrink-0" /><span className="font-semibold">Logout</span>
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ═══ MOBILE BOTTOM NAV ══════════════════════════════════════ */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-xl border-t border-border">
                {/* Top glow line */}
                <motion.div
                    className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity }}
                />
                <div className="flex items-center justify-around px-1">
                    {NAV_ITEMS.slice(0, 5).map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link key={item.href} href={item.href} className="flex-1">
                                <motion.div whileTap={{ scale: 0.82 }} className="flex flex-col items-center py-2.5 gap-0.5 relative">
                                    {active && (
                                        <motion.div
                                            layoutId="mobile-nav-pill"
                                            className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                                            style={{ background: item.color }}
                                        />
                                    )}
                                    <motion.div
                                        animate={active ? { scale: [1, 1.15, 1] } : {}}
                                        transition={{ duration: 0.4 }}
                                        className={cn('p-1.5 rounded-xl transition-all')}
                                        style={active ? { background: `${item.color}15`, boxShadow: `0 0 10px ${item.color}30` } : {}}
                                    >
                                        <Icon className="w-5 h-5 transition-all" style={{ color: active ? item.color : undefined }} />
                                    </motion.div>
                                    <span className={cn('text-[9px] font-black transition-all', active ? 'text-foreground' : 'text-muted-foreground')}>
                                        {item.name}
                                    </span>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
