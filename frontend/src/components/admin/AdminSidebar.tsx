"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, BarChart3, Users, CreditCard, Settings, LayoutDashboard, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

const sidebarItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Tournaments', href: '/admin/tournaments', icon: Trophy },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Transactions', href: '/admin/transactions', icon: CreditCard },
    { name: 'Profile', href: '/admin/profile', icon: User },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-all duration-300 md:hidden",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar Content */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col h-screen transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Trophy className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">
                            ADMIN <span className="text-primary text-xs ml-1">PANEL</span>
                        </span>
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start mb-1",
                                        isActive
                                            ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                                            : "text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5 mr-3", isActive && "text-primary")} />
                                    {item.name}
                                </Button>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-border">
                    <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                    </Button>
                </div>
            </aside>
        </>
    );
}
