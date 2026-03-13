"use client";

import React, { useState, useRef, useEffect } from "react";
/* eslint-disable react-hooks/exhaustive-deps */
import { Bell, Check, Info, AlertTriangle, Trophy, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    link?: string;
    createdAt: string;
}

export function NotificationsMenu() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'mentions'>('all');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socket = useSocket();

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications?limit=5');
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch {
            // Silently fail — user might not be logged in
        }
    };

    // Fetch real notifications
    useEffect(() => {
        fetchNotifications();
    }, []);

    // Socket.io for true real-time
    useEffect(() => {
        if (!socket) return;

        socket.on('new-notification', (notification: Notification) => {
            setNotifications(prev => [notification, ...prev].slice(0, 10)); // Keep only recent
            setUnreadCount(prev => prev + 1);
            
            toast.success(notification.title, {
                icon: '🏆',
                duration: 4000
            });
        });

        return () => {
            socket.off('new-notification');
        };
    }, [socket]);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Improved Scroll Locking logic to prevent page jump
    useEffect(() => {
        if (isOpen && isMobile) {
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
        } else if (!isOpen && isMobile) {
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        }
        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
        };
    }, [isOpen, isMobile]);

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch { }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        if (notification.link) {
            setIsOpen(false);
            router.push(notification.link);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch { }
    };

    const toggleMenu = () => setIsOpen(!isOpen);

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <Trophy className="w-4 h-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        setNow(Date.now());
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const timeAgo = (dateStr: string) => {
        if (!now) return '';
        const diff = now - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="relative inline-block" ref={menuRef}>
            {/* Bell Trigger */}
            <button
                onClick={toggleMenu}
                className="relative p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-all active:scale-90 focus:outline-none"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && mounted && (
                    <>
                        {/* Backdrop - Cleaner Blur - Fixed high Z-index */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-background/60 backdrop-blur-[6px] z-[9999]"
                        />

                        {/* Dropdown / Responsive Drawer */}
                        <motion.div
                            initial={isMobile ? { opacity: 0, scale: 0.9, y: -20 } : { opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={isMobile ? { opacity: 0, scale: 0.9, y: -20 } : { opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ 
                                type: "spring", 
                                damping: 25, 
                                stiffness: 300,
                                mass: 0.5
                            }}
                            className={cn(
                                "z-[10000] bg-popover/98 border border-border shadow-2xl overflow-hidden will-change-transform flex flex-col",
                                // Polished Centered Modal for Mobile
                                "fixed top-[15%] inset-x-4 max-h-[75vh] rounded-[2.5rem]",
                                // Desktop Styles
                                "sm:absolute sm:top-full sm:right-0 sm:inset-auto sm:max-h-[500px] sm:w-[400px] sm:rounded-2xl"
                            )}
                        >
                            {/* Header - Native Look */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 shrink-0">
                                <div className="flex flex-col">
                                    <h3 className="font-extrabold text-foreground text-xl tracking-tight leading-none mb-1">Activity</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{unreadCount} New</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex bg-muted/30 p-1 rounded-2xl sm:hidden">
                                        <button
                                            onClick={() => setActiveTab('all')}
                                            className={cn(
                                                "px-4 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all",
                                                activeTab === 'all' ? "bg-background text-foreground shadow-sm scale-105" : "text-muted-foreground"
                                            )}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('mentions')}
                                            className={cn(
                                                "px-4 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all",
                                                activeTab === 'mentions' ? "bg-background text-foreground shadow-sm scale-105" : "text-muted-foreground"
                                            )}
                                        >
                                            Feed
                                        </button>
                                    </div>
                                    <button
                                        onClick={markAllAsRead}
                                        className="p-2.5 text-primary hover:bg-primary/10 rounded-2xl transition-all active:scale-90"
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2.5 text-muted-foreground hover:bg-muted rounded-2xl"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* List Content - Scroll Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar-hide overscroll-contain">
                                {notifications.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                        <div className="w-24 h-24 rounded-[2.5rem] bg-muted/10 flex items-center justify-center mb-6">
                                            <Bell className="w-10 h-10 opacity-20 text-primary" />
                                        </div>
                                        <h4 className="font-black text-foreground uppercase tracking-tight text-lg">Nothing New</h4>
                                        <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1 max-w-[200px]">
                                            We'll let you know when something pops up
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/20 px-4 sm:px-0">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={cn(
                                                    "relative group my-2 p-5 rounded-[1.5rem] flex gap-4 transition-all hover:bg-muted/30 cursor-pointer active:scale-[0.98]",
                                                    !notification.read ? "bg-primary/[0.04] border border-primary/10" : "bg-card/50"
                                                )}
                                            >
                                                <div className="shrink-0">
                                                    <div className="w-12 h-12 rounded-[1.25rem] bg-background border border-border/50 flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
                                                        {getIcon(notification.type)}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2 mb-1">
                                                        <h4 className={cn(
                                                            "text-sm font-black truncate uppercase tracking-tight",
                                                            notification.read ? "text-muted-foreground" : "text-foreground"
                                                        )}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter whitespace-nowrap pt-1">
                                                            {timeAgo(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground/80 leading-snug line-clamp-2 font-medium">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                                <div className="flex items-center pl-2">
                                                    {!notification.read ? (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                                                    )}
                                                </div>
                                                
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                                    className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 p-2 bg-background border border-border rounded-xl text-muted-foreground hover:text-destructive transition-all shadow-xl z-10"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer Container - Fixed Bottom Sticky */}
                            <div className="p-6 sm:p-4 border-t border-border/50 bg-card/80 backdrop-blur-xl shrink-0 pb-6 sm:pb-4">
                                <Link
                                    href="/notifications"
                                    onClick={() => setIsOpen(false)}
                                    className="w-full flex items-center justify-center gap-3 py-4 rounded-[1.75rem] bg-primary text-primary-foreground shadow-[0_10px_20px_rgba(59,130,246,0.2)] hover:shadow-[0_15px_30px_rgba(59,130,246,0.3)] hover:-translate-y-1 transition-all group active:scale-95"
                                >
                                    <span className="text-[12px] font-black uppercase tracking-[0.15em]">Full Activity Log</span>
                                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
