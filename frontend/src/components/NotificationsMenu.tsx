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

    // Prevent body scroll when menu is open on mobile
    useEffect(() => {
        if (isOpen && isMobile) {
            document.body.style.overflow = 'hidden';
        } else {
            if (typeof document !== 'undefined') {
                document.body.style.overflow = 'unset';
            }
        }
        return () => { 
            if (typeof document !== 'undefined') {
                document.body.style.overflow = 'unset'; 
            }
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
        <div className="relative z-[100]" ref={menuRef}>
            {/* Bell Trigger */}
            <button
                onClick={toggleMenu}
                className="relative p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none"
            >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && mounted && (
                    <>
                        {/* Backdrop - Mobile Only */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[90] sm:hidden"
                        />

                        {/* Dropdown / Bottom Sheet Content */}
                        <motion.div
                            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 10 }}
                            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-full sm:w-96 bg-popover border-t sm:border border-border rounded-t-[2rem] sm:rounded-xl shadow-2xl overflow-hidden z-[100]"
                        >
                            {/* Mobile Drag Handle */}
                            <div className="w-full flex justify-center py-2 sm:hidden">
                                <div className="w-12 h-1 bg-muted rounded-full opacity-50" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between p-4 sm:p-3 border-b border-border bg-card/50 backdrop-blur-sm">
                                <h3 className="font-bold sm:font-semibold text-foreground text-lg sm:text-base">Notifications</h3>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                                        <button
                                            onClick={() => setActiveTab('all')}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('mentions')}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'mentions' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            Mentions
                                        </button>
                                    </div>
                                    <button
                                        onClick={markAllAsRead}
                                        className="p-1.5 text-primary hover:bg-primary/10 rounded-full transition-colors"
                                        title="Mark all as read"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1.5 text-muted-foreground hover:bg-muted rounded-full sm:hidden"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Notification List */}
                            <div className="max-h-[70vh] sm:max-h-[400px] overflow-y-auto pb-6 sm:pb-0">
                                {notifications.length === 0 ? (
                                    <div className="p-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
                                            <Bell className="w-8 h-8 opacity-40" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-foreground">All caught up!</p>
                                            <p className="text-xs">No new notifications for now.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/50">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`relative group p-4 sm:p-3 flex gap-4 sm:gap-3 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                                            >
                                                <div className="mt-0.5 w-10 h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-card border border-border shrink-0 shadow-sm">
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex justify-between items-start">
                                                        <p className={`text-sm font-semibold sm:font-medium leading-tight ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                            {notification.title}
                                                        </p>
                                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                            {timeAgo(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col justify-center gap-2">
                                                    {!notification.read && (
                                                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                                    )}
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1.5 bg-background border border-border rounded-full text-muted-foreground hover:text-destructive hover:border-destructive transition-all shadow-sm z-10"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 sm:p-2 border-t border-border bg-card/80 backdrop-blur-sm text-center">
                                <Link 
                                    href="/notifications" 
                                    onClick={() => setIsOpen(false)}
                                    className="text-sm sm:text-xs text-primary hover:underline font-bold sm:font-medium block py-2 sm:py-1 rounded-lg hover:bg-primary/5 transition-colors"
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
