"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
    User, Settings, LogOut, Moon, Sun,
    Trophy, Users, PieChart, Wallet,
    ChevronRight, LayoutDashboard
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";

interface UserMenuProps {
    user: {
        name: string;
        email: string;
        avatar?: string;
        role?: string;
    };
    onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <div className="relative z-50" ref={menuRef}>
            {/* Avatar Trigger */}
            <button
                onClick={toggleMenu}
                className="flex items-center gap-2 focus:outline-none"
            >
                <div className="relative">
                    <div className="rgb-avatar-border w-9 h-9">
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                user.name.charAt(0).toUpperCase()
                            )}
                        </div>
                    </div>
                </div>
            </button>

            {/* Dropdown Content */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* Header Section */}
                    <div className="p-4 flex items-center gap-3 border-b border-border">
                        <div className="rgb-avatar-border w-12 h-12 shrink-0">
                            <div className="w-full h-full rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-500">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    user.name.charAt(0).toUpperCase()
                                )}
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-foreground font-semibold text-base">{user.name}</h3>
                            <p className="text-yellow-500 text-xs font-medium">Access all features with our Premium subscription!</p>
                        </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="p-3 grid grid-cols-3 gap-2">
                        <Link href="/tournaments" className="flex flex-col items-center justify-center p-3 rounded-lg bg-card hover:bg-muted transition-colors group text-muted-foreground hover:text-foreground border border-transparent hover:border-border">
                            <div className="w-8 h-8 rounded-md bg-green-500/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                                <Trophy className="w-5 h-5 text-green-500" />
                            </div>
                            <span className="text-[10px] font-medium">Tournaments</span>
                        </Link>

                        <Link href="/dashboard/teams" className="flex flex-col items-center justify-center p-3 rounded-lg bg-card hover:bg-muted transition-colors group text-muted-foreground hover:text-foreground border border-transparent hover:border-border">
                            <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                                <Users className="w-5 h-5 text-blue-500" />
                            </div>
                            <span className="text-[10px] font-medium">My Team</span>
                        </Link>

                        <Link href="/dashboard" className="flex flex-col items-center justify-center p-3 rounded-lg bg-card hover:bg-muted transition-colors group text-muted-foreground hover:text-foreground border border-transparent hover:border-border">
                            <div className="w-8 h-8 rounded-md bg-purple-500/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                                <LayoutDashboard className="w-5 h-5 text-purple-500" />
                            </div>
                            <span className="text-[10px] font-medium">Dashboard</span>
                        </Link>
                    </div>

                    {/* Feature Link (Points/Wallet) */}
                    <div className="px-3 pb-3">
                        <Link href="/dashboard/wallet" className="flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-muted transition-colors group border border-transparent hover:border-border">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-yellow-500" />
                            </div>
                            <div className="flex-1">
                                <span className="text-sm text-foreground font-medium">Wallet & Points</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                        </Link>
                    </div>

                    {/* List Menu */}
                    <div className="py-2 border-t border-border">

                        <Link href="/settings">
                            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                <Settings className="w-4 h-4" />
                                <span>Settings</span>
                            </button>
                        </Link>

                        {/* Theme Toggle */}
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                                <span>Appearance</span>
                            </div>
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border">
                                {theme === 'dark' ? 'Dark' : 'Light'}
                            </span>
                        </button>

                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors mt-1"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
