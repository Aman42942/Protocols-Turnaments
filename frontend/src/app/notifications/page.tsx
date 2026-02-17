"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Bell, Check, Info, AlertTriangle, Trophy, Trash2, Mail, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    link?: string;
    createdAt: string;
}

export default function NotificationsPage() {
    const [filter, setFilter] = useState<'all' | 'unread' | 'system'>('all');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (err: any) {
            if (err.response?.status === 401) {
                window.location.href = '/login';
            }
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <Trophy className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'system': return <Mail className="w-5 h-5 text-purple-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    const clearAll = async () => {
        if (!confirm('Are you sure you want to delete all notifications?')) return;
        try {
            await api.delete('/notifications');
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to clear all:', err);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'system') return n.type === 'system';
        return true;
    });

    // Group by date
    const formatDateGroup = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const groupedNotifications: { [key: string]: Notification[] } = {};
    filteredNotifications.forEach(n => {
        const key = formatDateGroup(n.createdAt);
        if (!groupedNotifications[key]) groupedNotifications[key] = [];
        groupedNotifications[key].push(n);
    });

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 pt-8 pb-12">
            <div className="container max-w-4xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Bell className="h-8 w-8 text-primary" />
                            Notifications
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Stay updated with your tournaments, team activities, and system alerts.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={markAllRead}>
                            <Check className="mr-2 h-4 w-4" />
                            Mark all read
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={clearAll}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear all
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                    <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')} className="rounded-full">
                        All
                    </Button>
                    <Button variant={filter === 'unread' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('unread')} className="rounded-full">
                        Unread
                        {unreadCount > 0 && (
                            <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                                {unreadCount}
                            </Badge>
                        )}
                    </Button>
                    <Button variant={filter === 'system' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('system')} className="rounded-full">
                        System
                    </Button>
                </div>

                {/* Notifications List */}
                <div className="space-y-8">
                    {Object.keys(groupedNotifications).length === 0 ? (
                        <Card className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground">
                            <Bell className="h-12 w-12 mb-4 opacity-20" />
                            <h3 className="text-lg font-medium">No notifications found</h3>
                            <p>You&apos;re all caught up!</p>
                        </Card>
                    ) : (
                        Object.keys(groupedNotifications).map((date) => (
                            <div key={date}>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">{date}</h3>
                                <div className="space-y-3">
                                    {groupedNotifications[date].map((notification) => (
                                        <Card key={notification.id} className={`transition-all hover:shadow-md ${!notification.read ? 'bg-primary/5 border-primary/20' : ''}`}>
                                            <CardContent className="p-4 flex gap-4 items-start">
                                                <div className={`p-2 rounded-full mt-1 ${!notification.read ? 'bg-background shadow-sm' : 'bg-muted/50'}`}>
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className={`text-base font-semibold ${!notification.read ? 'text-primary' : 'text-foreground'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                            {formatTime(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                                {!notification.read && (
                                                    <div className="h-2 w-2 rounded-full bg-primary mt-3 shrink-0" />
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notification.id)}
                                                    className="p-1 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
