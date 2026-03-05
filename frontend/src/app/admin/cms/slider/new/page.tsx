'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import {
    ArrowLeft, Save, Loader2, Play, Image as ImageIcon,
    Globe, Link2, Calendar, Zap, Trophy, Target, Swords,
    Eye, EyeOff, Monitor, Smartphone, Maximize2, Wand2,
    Star, Flame, Shield, Users, Award
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useCms } from '@/context/CmsContext';

// ── Quick-fill templates ─────────────────────────────────────────────────────
const TEMPLATES = [
    {
        label: 'Tournament Promo', icon: Trophy, color: 'from-yellow-600 to-orange-600',
        data: { title: 'SEASON 3 CHAMPIONSHIP', description: 'Register now and compete for ₹50,000 prize pool. Limited slots available!', ctaText: 'REGISTER NOW', ctaLink: '/tournaments' }
    },
    {
        label: 'New Game Drop', icon: Zap, color: 'from-blue-600 to-cyan-600',
        data: { title: 'FREE FIRE SHOWDOWN', description: 'The ultimate Battle Royale tournament is here. Show your squad who\'s boss.', ctaText: 'JOIN NOW', ctaLink: '/tournaments' }
    },
    {
        label: 'Esports Event', icon: Swords, color: 'from-red-600 to-pink-600',
        data: { title: 'VALORANT ELITE SERIES', description: 'Join the ultimate 5v5 tactical shooter tournament. Win the prize pool.', ctaText: 'PLAY NOW', ctaLink: '/tournaments' }
    },
    {
        label: 'Sponsored Ad', icon: Star, color: 'from-purple-600 to-indigo-600',
        data: { title: 'SPONSORED SPOTLIGHT', description: 'Partner announcement — premium brand integration on your platform.', ctaText: 'LEARN MORE', ctaLink: '/' }
    },
    {
        label: 'Urgent Promo', icon: Flame, color: 'from-orange-600 to-red-600',
        data: { title: '🔥 REGISTRATION CLOSES TONIGHT', description: 'Last chance to register! Only 8 spots remaining. Don\'t miss out!', ctaText: 'REGISTER FAST', ctaLink: '/tournaments' }
    },
    {
        label: 'Leaderboard', icon: Award, color: 'from-green-600 to-emerald-600',
        data: { title: 'TOP RANKED PLAYERS THIS WEEK', description: 'Check out the hottest players climbing the Protocol leaderboard.', ctaText: 'VIEW RANKINGS', ctaLink: '/leaderboard' }
    },
];

// ── Live Preview Component ───────────────────────────────────────────────────
function LivePreview({
    title, description, ctaText, ctaLink, mediaUrl, mediaType, isMobile
}: {
    title: string; description: string; ctaText: string; ctaLink: string;
    mediaUrl: string; mediaType: string; isMobile: boolean;
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

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)' }}
            />

            {/* Content */}
            <div className="absolute inset-0 flex items-end p-4">
                <div className={isMobile ? 'space-y-1.5' : 'space-y-2'}>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[9px] font-black uppercase tracking-widest">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        Sponsored
                    </div>
                    <h3 className={`font-black italic text-white leading-tight drop-shadow-lg ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                        {title || 'SLIDE TITLE PREVIEW'}
                    </h3>
                    {description && !isMobile && (
                        <p className="text-white/70 text-xs leading-relaxed line-clamp-2 max-w-xs">{description}</p>
                    )}
                    {ctaText && ctaLink && (
                        <div className={`inline-flex items-center gap-1.5 bg-primary rounded-full font-black uppercase tracking-wider text-primary-foreground ${isMobile ? 'px-3 py-1 text-[9px]' : 'px-4 py-1.5 text-[10px]'}`}>
                            <Zap className="w-3 h-3 fill-current" />
                            {ctaText}
                        </div>
                    )}
                </div>
            </div>

            {/* Progress bar preview */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-white/10">
                <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '60%' }}
                    transition={{ duration: 2, ease: 'easeOut', repeat: Infinity, repeatType: 'reverse' }}
                    className="h-full bg-primary"
                />
            </div>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {[0, 1, 2].map(i => (
                    <div key={i} className={`h-1 rounded-full ${i === 0 ? 'w-4 bg-primary' : 'w-1 bg-white/25'}`} />
                ))}
            </div>

            {/* Label */}
            <div className="absolute top-2 right-2 text-[8px] font-black text-white/30 tracking-widest">1 / 3</div>
        </div>
    );
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function NewSlidePage() {
    const router = useRouter();
    const { refreshConfig } = useCms();
    const [loading, setLoading] = useState(false);
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
    });

    const set = (key: string, val: any) => setFormData(prev => ({ ...prev, [key]: val }));

    const applyTemplate = (tmpl: typeof TEMPLATES[0]) => {
        setFormData(prev => ({ ...prev, ...tmpl.data }));
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
                            New Slide Creator
                        </h1>
                        <p className="text-muted-foreground text-sm">Design a high-impact banner for the homepage.</p>
                    </div>
                </div>
                <Button onClick={handleSubmit} disabled={loading} className="rounded-2xl px-6">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Publish Slide
                </Button>
            </div>

            {/* ── Quick-fill Templates ── */}
            <div className="rounded-3xl border border-border bg-card p-5 shadow-lg">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">⚡ Quick-Fill Templates</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {TEMPLATES.map((tmpl) => {
                        const Icon = tmpl.icon;
                        return (
                            <motion.button
                                key={tmpl.label}
                                whileTap={{ scale: 0.94 }}
                                whileHover={{ scale: 1.03 }}
                                onClick={() => applyTemplate(tmpl)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br ${tmpl.color} text-white text-center transition-all`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[10px] font-black tracking-wide leading-tight">{tmpl.label}</span>
                            </motion.button>
                        );
                    })}
                </div>
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
                            <Input
                                placeholder="e.g., WINTER CHAMPIONSHIP SERIES"
                                className="font-black uppercase tracking-tight h-12 text-base"
                                value={formData.title}
                                onChange={(e) => set('title', e.target.value.toUpperCase())}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <Textarea
                                placeholder="Add a compelling description — keep it short and punchy!"
                                className="h-20 resize-none"
                                value={formData.description}
                                onChange={(e) => set('description', e.target.value)}
                            />
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
                        <div className="space-y-2">
                            <Label>Media URL <span className="text-destructive">*</span></Label>
                            <Input
                                placeholder={formData.mediaType === 'IMAGE' ? 'https://cdn.example.com/banner.jpg' : 'https://cdn.example.com/video.mp4'}
                                value={formData.mediaUrl}
                                onChange={(e) => set('mediaUrl', e.target.value)}
                                required
                            />
                            {formData.mediaUrl && formData.mediaType === 'IMAGE' && (
                                <div className="rounded-xl overflow-hidden border border-border h-24 bg-black mt-2">
                                    <img src={formData.mediaUrl} alt="check" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).alt = '⚠️ Could not load image — check the URL'; (e.target as HTMLImageElement).className = 'w-full h-full object-contain p-4 text-xs text-destructive'; }} />
                                </div>
                            )}
                            <p className="text-[10px] text-muted-foreground">Best size: 1920×600px. Videos under 10MB for fast loading.</p>
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
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all">
                            <input
                                type="checkbox"
                                checked={formData.openInNewTab}
                                onChange={(e) => set('openInNewTab', e.target.checked)}
                                className="h-4 w-4 rounded"
                            />
                            <span className="text-sm font-medium">Open link in new tab</span>
                        </label>
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
                            <p className="text-[10px] text-muted-foreground italic">Leave empty to show indefinitely. Slide auto-hides after end date.</p>
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
                            />

                            <p className="text-[10px] text-center text-muted-foreground">
                                Real-time preview · Changes update instantly
                            </p>
                        </div>

                        {/* Best Practices Card */}
                        <div className="rounded-3xl border border-border bg-card p-5 shadow-lg space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-amber-400">💡 Gaming Banner Tips</p>
                            <ul className="space-y-2.5 text-[11px] text-muted-foreground">
                                {[
                                    { icon: '📐', text: 'Use 1920×600px images for best quality across all screens.' },
                                    { icon: '🎯', text: 'Keep key elements (character, logo) in the center-left area for overlap.' },
                                    { icon: '✍️', text: 'Titles under 5 words work best — bold and impactful.' },
                                    { icon: '🔥', text: 'Add urgency words: TONIGHT, LIMITED, EXCLUSIVE, FINAL.' },
                                    { icon: '🎮', text: 'Dark images work best with game screenshots or esports art.' },
                                    { icon: '📅', text: 'Schedule tournament banners to auto-expire after registration closes.' },
                                ].map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span>{tip.icon}</span>
                                        <span>{tip.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
