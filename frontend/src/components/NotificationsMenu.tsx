"use client";

import React, { useState, useRef, useEffect } from "react";
/* eslint-disable react-hooks/exhaustive-deps */
import { Bell, Check, Info, AlertTriangle, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

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
        // Poll every 30s for real-time feel
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

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
        <div className="relative z-50" ref={menuRef}>
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

            {/* Dropdown Content */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-border bg-card/50 backdrop-blur-sm">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
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
                            className="text-xs text-primary hover:text-primary/80 transition-colors"
                            title="Mark all as read"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                                <Bell className="w-8 h-8 opacity-20" />
                                <p>No notifications yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`relative group p-3 flex gap-3 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className="mt-1 w-8 h-8 rounded-full flex items-center justify-center bg-card border border-border shrink-0 shadow-sm">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <p className={`text-sm font-medium leading-none ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                    {timeAgo(notification.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 bg-background border border-border rounded-full text-muted-foreground hover:text-destructive hover:border-destructive transition-all shadow-sm"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-2 border-t border-border bg-card/50 backdrop-blur-sm text-center">
                        <Link href="/notifications" className="text-xs text-primary hover:underline font-medium block py-1">
                            View Full History
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
