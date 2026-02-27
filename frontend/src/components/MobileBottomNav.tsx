"use client";
import React from 'react';
import Link from 'next/link';
import { Trophy, LayoutDashboard, Wallet, User, Home, Search, PlusCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function MobileBottomNav() {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: 'Home', href: '/' },
        { icon: Trophy, label: 'Arena', href: '/tournaments' },
        { icon: Wallet, label: 'Wallet', href: '/dashboard/wallet' },
        { icon: User, label: 'Profile', href: '/profile' },
    ];

    // Hide Bottom Nav on Admin pages
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/secure-admin-login')) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gradient-to-t from-background to-transparent pt-10 pointer-events-none">
            <div className="bg-background/95 backdrop-blur-md border-t border-border/50 flex items-end justify-around h-20 pb-6 px-2 pointer-events-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1.5 flex-1 transition-all duration-300",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className="flex flex-col items-center gap-1"
                            >
                                <Icon className={cn("w-6 h-6 transition-transform", isActive ? "scale-110" : "scale-100")} />
                                <span className={cn("text-[10px] font-medium transition-all", isActive ? "opacity-100 translate-y-0" : "opacity-70")}>
                                    {item.label}
                                </span>
                            </motion.div>

                            {isActive && (
                                <motion.div
                                    layoutId="spotify-indicator"
                                    className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
