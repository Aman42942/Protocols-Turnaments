
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import {
    Megaphone, Plus, Trash2, Loader2, AlertTriangle, CheckCircle, Info, X
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/Dialog';

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'INFO', // INFO, ALERT, WARNING, SUCCESS
    });

    const fetchAnnouncements = useCallback(async () => {
        try {
            const res = await api.get('/content/admin/announcements');
            setAnnouncements(res.data);
        } catch (error) {
            console.error('Failed to load announcements', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this announcement?')) return;
        try {
            await api.delete(`/content/admin/announcements/${id}`);
            fetchAnnouncements();
        } catch (error) {
            console.error('Failed to delete announcement', error);
        }
    };

    const handleCreate = async () => {
        if (!formData.title || !formData.message) return;
        setSubmitting(true);
        try {
            await api.post('/content/admin/announcements', formData);
            setIsDialogOpen(false);
            setFormData({ title: '', message: '', type: 'INFO' });
            fetchAnnouncements();
        } catch (error) {
            console.error('Failed to create announcement', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
                    <p className="text-muted-foreground">Manage system-wide alerts and news.</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Announcement
                </Button>
            </div>

            <div className="grid gap-4">
                {announcements.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            No announcements found.
                        </CardContent>
                    </Card>
                ) : announcements.map((item) => (
                    <Card key={item.id}>
                        <div className="p-4 flex items-start gap-4">
                            <div className={`p-2 rounded-full mt-1 ${item.type === 'ALERT' || item.type === 'WARNING' ? 'bg-red-500/10 text-red-500' :
                                item.type === 'SUCCESS' ? 'bg-green-500/10 text-green-500' :
                                    'bg-blue-500/10 text-blue-500'
                                }`}>
                                {item.type === 'ALERT' || item.type === 'WARNING' ? <AlertTriangle className="h-5 w-5" /> :
                                    item.type === 'SUCCESS' ? <CheckCircle className="h-5 w-5" /> :
                                        <Info className="h-5 w-5" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg">{item.title}</h3>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-red-500">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-muted-foreground mt-1">{item.message}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Posted on {new Date(item.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Create Dialog */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">New Announcement</h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g. Maintenance Update"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Message</label>
                                <textarea
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.message}
                                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder="Announcement details..."
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Type</label>
                                <div className="flex gap-2">
                                    {['INFO', 'SUCCESS', 'WARNING', 'ALERT'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFormData(prev => ({ ...prev, type }))}
                                            className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${formData.type === type
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-background border-border hover:bg-muted'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={submitting}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Post
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
