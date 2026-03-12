'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import {
    ArrowLeft, Save, Loader2, Play, Image as ImageIcon,
    Globe, Link2, Calendar, Zap, Trophy, Target, Swords,
    Eye, EyeOff, Monitor, Smartphone, Maximize2, Wand2,
    Star, Flame, Shield, Users, Award, Palette
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useCms } from '@/context/CmsContext';
import { MediaUpload } from '@/components/admin/MediaUpload';

// ── Live Preview Component ───────────────────────────────────────────────────
function LivePreview({
    title, description, ctaText, ctaLink, mediaUrl, mediaType, isMobile,
    titleColor, descriptionColor, ctaColor
}: {
    title: string; description: string; ctaText: string; ctaLink: string;
    mediaUrl: string; mediaType: string; isMobile: boolean;
    titleColor?: string; descriptionColor?: string; ctaColor?: string;
}) {
    return (
        <div className={`relative overflow-hidden bg-black rounded-2xl border border-border shadow-2xl transition-all duration-300 ${isMobile ? 'h-[220px]' : 'h-[280px]'}`}>
            {/* Media */}
            {mediaUrl ? (
                mediaType === 'VIDEO' ? (
                    <video src={mediaUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-70" />
                ) : (
                    <img src={mediaUrl} alt="preview" className="absolute inset-0 w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-black flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/20" />
                </div>
            )}

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

            {/* HUD corners */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-primary/60" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-primary/60" />
            <div className="absolute bottom-6 left-2 w-4 h-4 border-b border-l border-primary/40" />

            {/* Content */}
            <div className="absolute inset-0 flex items-end p-4">
                <div className={isMobile ? 'space-y-1.5' : 'space-y-2'}>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[9px] font-black uppercase tracking-widest">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        Sponsored
                    </div>
                    <h3 
                        className={`font-black italic leading-tight drop-shadow-lg ${isMobile ? 'text-lg' : 'text-2xl'}`}
                        style={{ color: titleColor || '#FFFFFF' }}
                    >
                        {title || 'SLIDE TITLE PREVIEW'}
                    </h3>
                    {description && !isMobile && (
                        <p 
                            className="text-xs leading-relaxed line-clamp-2 max-w-xs"
                            style={{ color: descriptionColor || 'rgba(255,255,255,0.7)' }}
                        >
                            {description}
                        </p>
                    )}
                    {ctaText && ctaLink && (
                        <div 
                            className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider text-primary-foreground ${isMobile ? 'px-3 py-1 text-[9px]' : 'px-4 py-1.5 text-[10px]'}`}
                            style={{ backgroundColor: ctaColor || 'var(--primary)' }}
                        >
                            <Zap className="w-3 h-3 fill-current" />
                            {ctaText}
                        </div>
                    )}
                </div>
            </div>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {[0, 1, 2].map(i => (
                    <div key={i} className={`h-1 rounded-full ${i === 0 ? 'w-4 bg-primary' : 'w-1 bg-white/25'}`} />
                ))}
            </div>

            {/* Label */}
            <div className="absolute top-2 right-2 text-[8px] font-black text-white/30 tracking-widest">Edit Mode</div>
        </div>
    );
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function EditSlidePage() {
    const router = useRouter();
    const params = useParams();
    const { refreshConfig } = useCms();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        mediaType: 'IMAGE',
        mediaUrl: '',
        ctaLink: '',
        ctaText: 'LEARN MORE',
        openInNewTab: true,
        isActive: true,
        displayOrder: 0,
        startDate: '',
        endDate: '',
        titleColor: '#FFFFFF',
        descriptionColor: '#FFFFFF',
        ctaColor: '#3b82f6',
    });

    const set = (key: string, val: any) => setFormData(prev => ({ ...prev, [key]: val }));

    useEffect(() => {
        if (params.id) fetchSlide();
    }, [params.id]);

    const fetchSlide = async () => {
        try {
            const res = await api.get('/cms/slides');
            const slide = res.data.find((s: any) => s.id === params.id);
            if (!slide) {
                alert('Slide not found');
                router.push('/admin/cms/slider');
                return;
            }

            setFormData({
                ...slide,
                startDate: slide.startDate ? new Date(slide.startDate).toISOString().slice(0, 16) : '',
                endDate: slide.endDate ? new Date(slide.endDate).toISOString().slice(0, 16) : '',
                titleColor: slide.titleColor || '#FFFFFF',
                descriptionColor: slide.descriptionColor || '#FFFFFF',
                ctaColor: slide.ctaColor || '#3b82f6',
            });
        } catch (err) {
            console.error('Failed to fetch slide:', err);
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.mediaUrl) {
            alert('Title and Media URL are required.');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                ...formData,
                displayOrder: parseInt(formData.displayOrder as any),
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
            };
            await api.put(`/cms/slides/${params.id}`, payload);
            await refreshConfig();
            router.push('/admin/cms/slider');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update slide');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/cms/slider">
                        <Button variant="outline" size="icon" className="rounded-2xl">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-2">
                            <Wand2 className="h-6 w-6 text-primary" />
                            Edit Slide
                        </h1>
                        <p className="text-muted-foreground text-sm">Update your high-impact banner campaign.</p>
                    </div>
                </div>
                <Button onClick={handleSubmit} disabled={loading} className="rounded-2xl px-6">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Update Slide
                </Button>
            </div>

            {/* ── Main Grid: Form + Preview ── */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* LEFT: Form Fields */}
                <div className="xl:col-span-3 space-y-5">

                    {/* Content */}
                    <div className="rounded-3xl border border-border bg-card p-6 shadow-lg space-y-4">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">📝 Slide Content</p>
                        <div className="space-y-2">
                            <Label>Title <span className="text-destructive">*</span></Label>
                            <div className="flex gap-4">
                                <Input
                                    placeholder="e.g., WINTER CHAMPIONSHIP SERIES"
                                    className="font-black uppercase tracking-tight h-12 text-base flex-1"
                                    value={formData.title}
                                    onChange={(e) => set('title', e.target.value.toUpperCase())}
                                    required
                                />
                                <div className="flex flex-col items-center gap-1">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Color</Label>
                                    <input 
                                        type="color" 
                                        value={formData.titleColor || '#FFFFFF'} 
                                        onChange={(e) => set('titleColor', e.target.value)}
                                        className="w-12 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <div className="flex gap-4">
                                <Textarea
                                    placeholder="Add a compelling description — keep it short and punchy!"
                                    className="h-20 resize-none flex-1"
                                    value={formData.description}
                                    onChange={(e) => set('description', e.target.value)}
                                />
                                <div className="flex flex-col items-center gap-1">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Color</Label>
                                    <input 
                                        type="color" 
                                        value={formData.descriptionColor || '#FFFFFF'} 
                                        onChange={(e) => set('descriptionColor', e.target.value)}
                                        className="w-12 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Media */}
                    <div className="rounded-3xl border border-border bg-card p-6 shadow-lg space-y-4">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">🎨 Media</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => set('mediaType', 'IMAGE')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${formData.mediaType === 'IMAGE' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/40'}`}
                            >
                                <ImageIcon className="h-6 w-6" /> Image
                            </button>
                            <button
                                type="button"
                                onClick={() => set('mediaType', 'VIDEO')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${formData.mediaType === 'VIDEO' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/40'}`}
                            >
                                <Play className="h-6 w-6" /> Video
                            </button>
                        </div>
                        <div className="space-y-4">
                            <MediaUpload 
                                label="Update Banner Media"
                                type={formData.mediaType === 'VIDEO' ? 'video' : 'image'}
                                currentUrl={formData.mediaUrl}
                                onUploadSuccess={(url) => set('mediaUrl', url)}
                            />
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Or Paste Direct URL</Label>
                                <Input
                                    placeholder={formData.mediaType === 'IMAGE' ? 'https://cdn.example.com/banner.jpg' : 'https://cdn.example.com/video.mp4'}
                                    value={formData.mediaUrl}
                                    onChange={(e) => set('mediaUrl', e.target.value)}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Best size: 1920×600px. Videos under 20MB for fast loading.</p>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="rounded-3xl border border-border bg-card p-6 shadow-lg space-y-4">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">🔗 Call to Action</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Button Text</Label>
                                <Input placeholder="REGISTER NOW" value={formData.ctaText} onChange={(e) => set('ctaText', e.target.value.toUpperCase())} />
                            </div>
                            <div className="space-y-2">
                                <Label>Link URL</Label>
                                <Input placeholder="/tournaments/my-tournament" value={formData.ctaLink} onChange={(e) => set('ctaLink', e.target.value)} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 bg-muted/20 p-4 rounded-2xl border border-border">
                            <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                                <Palette className="w-3 h-3" /> Button Color
                            </Label>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="color" 
                                    value={formData.ctaColor || '#3b82f6'} 
                                    onChange={(e) => set('ctaColor', e.target.value)}
                                    className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-0"
                                />
                                <span className="text-xs font-mono uppercase font-bold">{formData.ctaColor}</span>
                            </div>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="rounded-3xl border border-border bg-card p-6 shadow-lg space-y-4">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">⚙️ Settings</p>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all">
                                <input type="checkbox" checked={formData.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 rounded" />
                                <span className="text-sm font-bold">{formData.isActive ? '✅ Active' : '🔴 Inactive'}</span>
                            </label>
                            <div className="space-y-1">
                                <Label className="text-xs">Display Order</Label>
                                <Input type="number" value={formData.displayOrder} onChange={(e) => set('displayOrder', parseInt(e.target.value) || 0)} />
                            </div>
                        </div>

                        {/* Scheduling */}
                        <div className="border-t border-border pt-4 space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-purple-400">📅 Scheduling (Optional)</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">Start Date</Label>
                                    <Input type="datetime-local" value={formData.startDate} onChange={(e) => set('startDate', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">End Date</Label>
                                    <Input type="datetime-local" value={formData.endDate} onChange={(e) => set('endDate', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Live Preview Panel */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="sticky top-6 space-y-4">
                        <div className="rounded-3xl border border-border bg-card p-5 shadow-xl space-y-4">
                            {/* Preview header */}
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">👁️ Live Preview</p>
                                <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl">
                                    <button
                                        onClick={() => setPreviewDevice('desktop')}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${previewDevice === 'desktop' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <Monitor className="w-3.5 h-3.5" /> Desktop
                                    </button>
                                    <button
                                        onClick={() => setPreviewDevice('mobile')}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${previewDevice === 'mobile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <Smartphone className="w-3.5 h-3.5" /> Mobile
                                    </button>
                                </div>
                            </div>

                            {/* The preview */}
                            <LivePreview
                                title={formData.title}
                                description={formData.description}
                                ctaText={formData.ctaText}
                                ctaLink={formData.ctaLink}
                                mediaUrl={formData.mediaUrl}
                                mediaType={formData.mediaType}
                                isMobile={previewDevice === 'mobile'}
                                titleColor={formData.titleColor}
                                descriptionColor={formData.descriptionColor}
                                ctaColor={formData.ctaColor}
                            />

                            <p className="text-[10px] text-center text-muted-foreground">
                                Real-time preview · Changes update instantly
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
