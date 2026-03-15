"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    ArrowLeft, Save, Loader2, Trophy, Settings2, MessageCircle, Info
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from 'react-hot-toast';
import { MediaUpload } from '@/components/admin/MediaUpload';

export default function EditTournamentPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { isAdmin, loading: authLoading } = useAdminAuth();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: '',
        tier: '',
        entryFeePerPerson: '',
        prizePool: '',
        startDate: '',
        startTime: '',
        maxTeams: '',
        whatsappGroupLink: '',
        streamUrl: '',
        banner: '',
        shareMessage: '',
    });

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/');
        }
    }, [authLoading, isAdmin, router]);

    useEffect(() => {
        if (id) {
            fetchTournament();
        }
    }, [id]);

    const fetchTournament = async () => {
        try {
            const res = await api.get(`/tournaments/${id}`);
            const t = res.data;
            
            // Format date and time for inputs
            const dt = new Date(t.startDate);
            const date = dt.toISOString().split('T')[0];
            const time = dt.toTimeString().split(' ')[0].substring(0, 5);

            setFormData({
                title: t.title || '',
                description: t.description || '',
                status: t.status || '',
                tier: t.tier || '',
                entryFeePerPerson: String(t.entryFeePerPerson || 0),
                prizePool: String(t.prizePool || 0),
                startDate: date,
                startTime: time,
                maxTeams: String(t.maxTeams || 0),
                whatsappGroupLink: t.whatsappGroupLink || '',
                streamUrl: t.streamUrl || '',
                banner: t.banner || '',
                shareMessage: t.shareMessage || '',
            });
        } catch (err) {
            console.error('Failed to fetch tournament:', err);
            toast.error('Failed to load tournament data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const startDateTime = `${formData.startDate}T${formData.startTime}:00.000Z`;
            
            const payload = {
                ...formData,
                entryFeePerPerson: parseFloat(formData.entryFeePerPerson),
                prizePool: parseFloat(formData.prizePool),
                maxTeams: parseInt(formData.maxTeams),
                startDate: startDateTime,
            };

            await api.patch(`/tournaments/${id}`, payload);
            toast.success('Tournament updated successfully!');
            router.push('/admin/tournaments');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update tournament');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-12">
            <div className="border-b bg-card/50 backdrop-blur">
                <div className="container py-6">
                    <Link href="/admin/tournaments" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                        <ArrowLeft className="h-4 w-4" /> Back to List
                    </Link>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10">
                                <Settings2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Edit Tournament</h1>
                                <p className="text-sm text-muted-foreground">Modify details for {formData.title}</p>
                            </div>
                        </div>
                        <Button onClick={handleSave} disabled={saving} className="shadow-lg shadow-primary/20">
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container py-8 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Sidebar - Status & Quick Info */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tournament Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Select name="status" value={formData.status} onChange={handleChange}>
                                    <option value="UPCOMING">Upcoming</option>
                                    <option value="LIVE">Live</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </Select>
                                <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Created</span>
                                        <span className="font-medium">Recent</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Registrations</span>
                                        <span className="font-medium">Active</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Visuals</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <MediaUpload 
                                    label="Upload Banner"
                                    type="image"
                                    currentUrl={formData.banner}
                                    onUploadSuccess={(url) => setFormData(prev => ({ ...prev, banner: url }))}
                                />
                                <div className="pt-2">
                                    <Label className="text-[10px] text-muted-foreground">Or provide Direct URL</Label>
                                    <Input 
                                        name="banner" 
                                        value={formData.banner} 
                                        onChange={handleChange} 
                                        className="text-xs mt-1" 
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="h-5 w-5 text-primary" /> Core Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div>
                                    <Label>Tournament Title</Label>
                                    <Input name="title" value={formData.title} onChange={handleChange} className="mt-1" />
                                </div>
                                <div>
                                    <Label>Detailed Description</Label>
                                    <Textarea name="description" value={formData.description} onChange={handleChange} className="mt-1 h-32" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Tier</Label>
                                        <Select name="tier" value={formData.tier} onChange={handleChange}>
                                            <option value="LOW">🟢 Low</option>
                                            <option value="MEDIUM">🟡 Medium</option>
                                            <option value="HIGH">🔴 High</option>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Max Teams/Players</Label>
                                        <Input type="number" name="maxTeams" value={formData.maxTeams} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Start Date</Label>
                                        <Input type="date" name="startDate" value={formData.startDate} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <Label>Start Time</Label>
                                        <Input type="time" name="startTime" value={formData.startTime} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Entry Fee (Coins)</Label>
                                        <Input type="number" name="entryFeePerPerson" value={formData.entryFeePerPerson} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <Label>Prize Pool (Coins)</Label>
                                        <Input type="number" name="prizePool" value={formData.prizePool} onChange={handleChange} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sharing Customization */}
                        <Card className="border-primary/20 shadow-lg shadow-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5 text-green-500" /> Sharing Customization
                                </CardTitle>
                                <CardDescription>Personalize the message players see when sharing</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div>
                                    <Label>Custom WhatsApp Message Template</Label>
                                    <Textarea 
                                        name="shareMessage" 
                                        value={formData.shareMessage} 
                                        onChange={handleChange}
                                        placeholder="Customize your sharing message here..."
                                        className="mt-2 font-mono text-sm h-40"
                                    />
                                    <div className="mt-3 p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                                        <p className="text-xs font-bold text-primary uppercase tracking-wider">Dynamic Placeholders</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {[
                                                { k: '{title}', desc: 'Event Name' },
                                                { k: '{game}', desc: 'Game Title' },
                                                { k: '{prize}', desc: 'Winner Prize' },
                                                { k: '{entry}', desc: 'Entry Cost' },
                                                { k: '{link}', desc: 'Share URL' },
                                            ].map(v => (
                                                <div key={v.k} className="flex flex-col gap-1">
                                                    <code className="px-1.5 py-0.5 rounded bg-background border text-primary text-[10px] w-fit font-bold">{v.k}</code>
                                                    <span className="text-[10px] text-muted-foreground">{v.desc}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label>WhatsApp Group Link</Label>
                                    <Input name="whatsappGroupLink" value={formData.whatsappGroupLink} onChange={handleChange} placeholder="https://chat.whatsapp.com/..." className="mt-1" />
                                </div>
                                <div>
                                    <Label>Live Stream URL</Label>
                                    <Input name="streamUrl" value={formData.streamUrl} onChange={handleChange} placeholder="https://youtube.com/live/..." className="mt-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
