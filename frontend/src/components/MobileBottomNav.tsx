"use client";
import React from 'react';
import Link from 'next/link';
import { Trophy, LayoutDashboard, Wallet, User, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

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
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
            <div className="bg-background/80 backdrop-blur-md border-t border-border flex items-center justify-around h-16 px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
