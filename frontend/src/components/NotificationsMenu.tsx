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
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]"
                        />

                        {/* Dropdown / Responsive Drawer */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: isMobile ? -20 : 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: isMobile ? -20 : 10 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className={cn(
                                "z-[10000] bg-popover/95 border border-border shadow-2xl rounded-2xl overflow-hidden will-change-transform",
                                // Mobile styles
                                "fixed top-[75px] right-4 left-4 max-h-[70vh] flex flex-col",
                                // Desktop styles
                                "sm:absolute sm:top-full sm:right-0 sm:left-auto sm:inset-auto sm:mt-3 sm:w-[400px] sm:max-h-[500px]"
                            )}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
                                <h3 className="font-bold text-foreground text-lg">Notifications</h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex bg-muted/50 p-1 rounded-xl">
                                        <button
                                            onClick={() => setActiveTab('all')}
                                            className={cn(
                                                "px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all",
                                                activeTab === 'all' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                                            )}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('mentions')}
                                            className={cn(
                                                "px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all",
                                                activeTab === 'mentions' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                                            )}
                                        >
                                            Feed
                                        </button>
                                    </div>
                                    <button
                                        onClick={markAllAsRead}
                                        className="p-1.5 text-primary hover:bg-primary/10 rounded-full transition-colors"
                                        title="Mark all as read"
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1.5 text-muted-foreground hover:bg-muted rounded-full sm:hidden"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* List Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center">
                                            <Bell className="w-8 h-8 opacity-20" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-foreground">Zero Activity</p>
                                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">Check back later</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/30">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={cn(
                                                    "relative group p-4 flex gap-4 hover:bg-muted/30 transition-all cursor-pointer",
                                                    !notification.read && "bg-primary/[0.03]"
                                                )}
                                            >
                                                <div className="shrink-0 pt-1">
                                                    <div className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
                                                        {getIcon(notification.type)}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h4 className={cn(
                                                            "text-sm font-bold truncate leading-tight",
                                                            notification.read ? "text-muted-foreground" : "text-foreground"
                                                        )}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-[10px] font-medium text-muted-foreground/60 whitespace-nowrap pt-0.5">
                                                            {timeAgo(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                                <div className="flex items-center">
                                                    {!notification.read && (
                                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1.5 bg-background border border-border rounded-full text-muted-foreground hover:text-destructive transition-all shadow-sm z-10"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer Container */}
                            <div className="p-4 border-t border-border/50 bg-card/80 backdrop-blur-sm text-center shrink-0">
                                <Link
                                    href="/notifications"
                                    onClick={() => setIsOpen(false)}
                                    className="text-sm text-primary hover:underline font-bold block py-2 transition-colors"
                                >
                                    View Full History
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
