'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import {
    ArrowLeft, Save, Loader2, Play, Image as ImageIcon,
    Globe, Link2, Calendar, Layout, Smartphone
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useCms } from '@/context/CmsContext';

export default function NewSlidePage() {
    const router = useRouter();
    const { refreshConfig } = useCms();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        mediaType: 'IMAGE',
        mediaUrl: '',
        ctaLink: '',
        ctaText: 'Learn More',
        openInNewTab: true,
        isActive: true,
        displayOrder: 0,
        startDate: '',
        endDate: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                displayOrder: parseInt(formData.displayOrder as any),
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
            };

            await api.post('/cms/slides', payload);
            await refreshConfig();
            router.push('/admin/cms/slider');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to create slide');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/cms/slider">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">New Ad Slide</h1>
                        <p className="text-muted-foreground">Create a high-impact advertisement for the home page.</p>
                    </div>
                </div>
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Slide
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6">
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Left: Content and Media */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Layout className="h-5 w-5 text-primary" />
                                    Slide Content
                                </CardTitle>
                                <CardDescription>Basic information that will appear on the slide overlay.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Slide Title</Label>
                                    <Input
                                        placeholder="e.g., WINTER TOURNAMENT SERIES"
                                        className="font-bold uppercase tracking-tight h-12 text-lg"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value.toUpperCase() })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (Optional)</Label>
                                    <Textarea
                                        placeholder="Add a compelling description of what this ad is about..."
                                        className="h-24 resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5 text-blue-500" />
                                    Media Configuration
                                </CardTitle>
                                <CardDescription>Background image or video for the slide.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        type="button"
                                        variant={formData.mediaType === 'IMAGE' ? 'default' : 'outline'}
                                        onClick={() => setFormData({ ...formData, mediaType: 'IMAGE' })}
                                        className="h-20 flex-col gap-2"
                                    >
                                        <ImageIcon className="h-6 w-6" />
                                        <span>Image</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={formData.mediaType === 'VIDEO' ? 'default' : 'outline'}
                                        onClick={() => setFormData({ ...formData, mediaType: 'VIDEO' })}
                                        className="h-20 flex-col gap-2"
                                    >
                                        <Play className="h-6 w-6" />
                                        <span>Video</span>
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <Label>Media URL</Label>
                                    <Input
                                        placeholder={formData.mediaType === 'IMAGE' ? "https://example.com/background.jpg" : "https://example.com/video.mp4"}
                                        value={formData.mediaUrl}
                                        onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                                        required
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Use direct links for best performance. Videos should be under 10MB.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Link2 className="h-5 w-5 text-orange-500" />
                                    Call to Action (CTA)
                                </CardTitle>
                                <CardDescription>Primary button settings for the slide.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Button Text</Label>
                                    <Input
                                        placeholder="e.g., REGISTER NOW"
                                        value={formData.ctaText}
                                        onChange={(e) => setFormData({ ...formData, ctaText: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Link URL</Label>
                                    <Input
                                        placeholder="/tournaments/..."
                                        value={formData.ctaLink}
                                        onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="newTab"
                                        checked={formData.openInNewTab}
                                        onChange={(e) => setFormData({ ...formData, openInNewTab: e.target.checked })}
                                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <Label htmlFor="newTab" className="cursor-pointer">Open link in new tab</Label>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Settings & Meta */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest font-black">
                                    <Globe className="h-4 w-4" />
                                    Visibility
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                                    <Label className="font-bold">Active Status</Label>
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Display Order</Label>
                                    <Input
                                        type="number"
                                        value={formData.displayOrder}
                                        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Lower numbers appear first.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest font-black text-purple-500">
                                    <Calendar className="h-4 w-4" />
                                    Scheduling
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">Leave empty to show indefinitely.</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Smartphone className="h-4 w-4" />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">Mobile Preview Note</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    Banners will automatically center-crop on mobile. Ensure key visual elements are near the center of your media.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}
