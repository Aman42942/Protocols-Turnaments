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

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        <div className="relative inline-block" ref={menuRef}>
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

            {/* Dropdown / Responsive Modal */}
            <AnimatePresence>
                {isOpen && mounted && (
                    <>
                        {/* Backdrop for Mobile */}
                        {isMobile && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
                            />
                        )}

                        <motion.div
                            initial={isMobile ? { opacity: 0, scale: 0.9, y: -20, x: "-50%" } : { opacity: 0, scale: 0.95, y: 10 }}
                            animate={isMobile ? { opacity: 1, scale: 1, y: 0, x: "-50%" } : { opacity: 1, scale: 1, y: 0 }}
                            exit={isMobile ? { opacity: 0, scale: 0.9, y: -20, x: "-50%" } : { opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className={cn(
                                "z-[9999] bg-popover border border-border shadow-2xl overflow-hidden will-change-transform flex flex-col",
                                // Mobile styles - Centered Modal
                                "fixed top-[15%] left-1/2 w-[min(320px,calc(100vw-32px))] max-h-[70vh] rounded-[2rem]",
                                // Desktop styles - Standard Dropdown
                                "sm:absolute sm:top-full sm:right-0 sm:left-auto sm:inset-auto sm:mt-2 sm:w-80 sm:max-h-[80vh] sm:rounded-xl"
                            )}
                        >
                            {/* Header Section */}
                            <div className="p-5 flex items-center gap-4 border-b border-border bg-card/50">
                                <div className="rgb-avatar-border w-14 h-14 shrink-0">
                                    <div className="w-full h-full rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-500 shadow-inner">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            user.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-foreground font-extrabold text-lg tracking-tight">{user.name}</h3>
                                    <p className="text-yellow-500 text-xs font-bold leading-tight uppercase tracking-widest mt-0.5">Premium Ace</p>
                                </div>
                            </div>

                            {/* Quick Access Grid */}
                            <div className="p-4 grid grid-cols-3 gap-3">
                                <Link href="/tournaments" onClick={() => setIsOpen(false)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/30 hover:bg-muted transition-all group border border-transparent hover:border-border active:scale-95">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                                        <Trophy className="w-6 h-6 text-green-500" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground group-hover:text-foreground">Arenas</span>
                                </Link>

                                <Link href="/dashboard/teams" onClick={() => setIsOpen(false)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/30 hover:bg-muted transition-all group border border-transparent hover:border-border active:scale-95">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                                        <Users className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground group-hover:text-foreground">Squad</span>
                                </Link>

                                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/30 hover:bg-muted transition-all group border border-transparent hover:border-border active:scale-95">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                                        <LayoutDashboard className="w-6 h-6 text-purple-500" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground group-hover:text-foreground">Stats</span>
                                </Link>
                            </div>

                            {/* Wallet Link */}
                            <div className="px-4 pb-4">
                                <Link href="/dashboard/wallet" onClick={() => setIsOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 hover:bg-muted/40 transition-all group border border-border/30 active:scale-[0.98]">
                                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shadow-sm">
                                        <Wallet className="w-5 h-5 text-yellow-500" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-sm text-foreground font-black uppercase tracking-wider">Treasury</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>

                            {/* List Menu */}
                            <div className="py-2 border-t border-border">
                                <Link href="/settings" onClick={() => setIsOpen(false)}>
                                    <button className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                        <Settings className="w-5 h-5" />
                                        <span>Settings</span>
                                    </button>
                                </Link>

                                <button
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className="w-full flex items-center justify-between px-5 py-3 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                        <span>Appearance</span>
                                    </div>
                                    <span className="text-[10px] font-black bg-muted px-2 py-1 rounded-lg text-muted-foreground border border-border uppercase">
                                        {theme === 'dark' ? 'Dark' : 'Light'}
                                    </span>
                                </button>

                                <button
                                    onClick={onLogout}
                                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-black text-destructive hover:bg-destructive/10 transition-colors mt-1"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
