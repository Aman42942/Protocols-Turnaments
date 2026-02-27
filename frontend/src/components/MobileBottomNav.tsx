"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gamepad2, Trophy, Wallet, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Matches', icon: Gamepad2, href: '/tournaments' },
    { label: 'Wallet', icon: Wallet, href: '/dashboard/wallet', primary: true },
    { label: 'Rank', icon: Trophy, href: '/leaderboard' },
    { label: 'Profile', icon: User, href: '/settings' },
];

export function MobileBottomNav() {
    const pathname = usePathname();

    // Hide on admin pages
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/secure-admin-login')) {
        return null;
    }

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] md:hidden w-[90%] max-w-md">
            <nav className="relative flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl border border-border/50 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-visible will-change-transform translate-z-0">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    if (item.primary) {
                        return (
                            <Link key={item.href} href={item.href} className="relative -mt-12 group">
                                <div className="absolute inset-0 bg-primary blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
                                <div className={cn(
                                    "relative w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40 border-4 border-background transition-transform active:scale-90",
                                    isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                )}>
                                    <Icon className="w-7 h-7 text-primary-foreground" />
                                </div>
                                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center gap-1 transition-all active:scale-95 group",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className="relative">
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabGlow"
                                        className="absolute -inset-2 bg-primary/10 rounded-full blur-md"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <Icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110")} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold transition-all whitespace-nowrap",
                                isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 group-hover:opacity-70"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
