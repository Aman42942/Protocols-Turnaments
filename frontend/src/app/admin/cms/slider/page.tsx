'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, Loader2, Trash2, Edit, Play,
    Eye, EyeOff, Calendar, Link2, Zap, Trophy, Monitor, Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useCms, AdSlide } from '@/context/CmsContext';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';

export default function SliderManagementPage() {
    const { config, refreshConfig, isComponentVisible } = useCms();
    const [slides, setSlides] = useState<AdSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        fetchSlides();
        setIsVisible(isComponentVisible('AD_SLIDER'));
    }, [config]);

    const fetchSlides = async () => {
        try {
            const res = await api.get('/cms/slides');
            setSlides(res.data);
        } catch (err) {
            console.error('Failed to fetch slides:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete slide "${title}"?`)) return;
        setProcessingId(id);
        try {
            await api.delete(`/cms/slides/${id}`);
            await fetchSlides();
            await refreshConfig();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete');
        } finally {
            setProcessingId(null);
        }
    };

    const toggleGlobalVisibility = async () => {
        setProcessingId('global');
        try {
            const nextValue = !isVisible;
            await api.put('/cms/layout', { componentId: 'AD_SLIDER', isVisible: nextValue, displayOrder: 0 });
            setIsVisible(nextValue);
            await refreshConfig();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update visibility');
        } finally {
            setProcessingId(null);
        }
    };

    const filtered = slides.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const activeCount = slides.filter(s => s.isActive).length;

    return (
        <div className="space-y-6 pb-10">
            {/* ── Header ── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-2">
                        <Trophy className="h-7 w-7 text-primary" />
                        Home Slider Manager
                    </h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Manage homepage advertisement banners and video slides.
                        {' '}<span className="text-primary font-bold">{activeCount} active</span> / {slides.length} total
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={isVisible ? 'default' : 'outline'}
                        onClick={toggleGlobalVisibility}
                        disabled={processingId === 'global'}
                        className="rounded-2xl"
                    >
                        {processingId === 'global' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
                            isVisible ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                        {isVisible ? 'Slider ON' : 'Slider OFF'}
                    </Button>
                    <Link href="/admin/cms/slider/new">
                        <Button className="rounded-2xl">
                            <Plus className="w-4 h-4 mr-2" /> New Slide
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* ── Slider OFF warning ── */}
            {!isVisible && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center gap-3">
                    <EyeOff className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-500 font-bold">
                        The slider is currently hidden from the homepage. Toggle it ON to display slides.
                    </p>
                </motion.div>
            )}

            {/* ── Search ── */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search slides..."
                    className="pl-9 rounded-2xl"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* ── Card Grid ── */}
            {filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-3xl border border-dashed border-border p-16 flex flex-col items-center justify-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-muted/40 flex items-center justify-center">
                        <Play className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-black text-lg">No slides yet</p>
                        <p className="text-muted-foreground text-sm mt-1">Create your first advertisement slide to get started.</p>
                    </div>
                    <Link href="/admin/cms/slider/new">
                        <Button className="rounded-2xl mt-2"><Plus className="w-4 h-4 mr-2" /> Create First Slide</Button>
                    </Link>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence>
                        {filtered.map((slide, idx) => (
                            <motion.div
                                key={slide.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group relative rounded-3xl overflow-hidden border border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30"
                            >
                                {/* Thumbnail / Preview */}
                                <div className="relative h-40 bg-black overflow-hidden">
                                    {slide.mediaType === 'VIDEO' ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-900/40 to-black">
                                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                                <Play className="h-6 w-6 text-white" />
                                            </div>
                                            <span className="text-xs text-white/50 font-bold uppercase tracking-wider">Video Slide</span>
                                        </div>
                                    ) : slide.mediaUrl ? (
                                        <img
                                            src={slide.mediaUrl}
                                            alt={slide.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-muted/20">
                                            <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                                        </div>
                                    )}

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                    {/* HUD corners */}
                                    <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-primary/50" />
                                    <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-primary/50" />

                                    {/* Status badge */}
                                    <div className="absolute top-3 left-1/2 -translate-x-1/2">
                                        {slide.isActive ? (
                                            <Badge className="bg-green-500/20 text-green-400 border-green-500/40 text-[9px] font-black">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse" />
                                                ACTIVE
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-[9px] font-black">DISABLED</Badge>
                                        )}
                                    </div>

                                    {/* Order badge */}
                                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-[10px] font-black text-white">
                                        {slide.displayOrder}
                                    </div>

                                    {/* Type badge */}
                                    <div className="absolute bottom-3 right-3">
                                        <Badge variant="outline" className="text-[9px] font-black bg-black/40 border-white/10 text-white/60">
                                            {slide.mediaType}
                                        </Badge>
                                    </div>

                                    {/* Title overlay */}
                                    <div className="absolute bottom-3 left-3 right-12">
                                        <p className="text-white font-black text-sm italic truncate drop-shadow-lg">{slide.title}</p>
                                    </div>
                                </div>

                                {/* Card body */}
                                <div className="p-4 space-y-3">
                                    {slide.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{slide.description}</p>
                                    )}

                                    <div className="flex flex-wrap gap-1.5">
                                        {slide.ctaText && (
                                            <div className="flex items-center gap-1 text-[10px] text-primary font-black uppercase tracking-widest bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
                                                <Link2 className="h-2.5 w-2.5" /> {slide.ctaText}
                                            </div>
                                        )}
                                        {(slide.startDate || slide.endDate) && (
                                            <div className="flex items-center gap-1 text-[10px] text-purple-400 font-bold bg-purple-500/10 border border-purple-500/20 rounded-full px-2.5 py-1">
                                                <Calendar className="h-2.5 w-2.5" />
                                                {slide.startDate ? new Date(slide.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '∞'}
                                                {' → '}
                                                {slide.endDate ? new Date(slide.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '∞'}
                                            </div>
                                        )}
                                        {!slide.startDate && !slide.endDate && (
                                            <div className="text-[10px] text-muted-foreground/60 italic">Always visible</div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-1 border-t border-border">
                                        <Link href={`/admin/cms/slider/${slide.id}/edit`} className="flex-1">
                                            <Button variant="outline" size="sm" className="w-full rounded-xl h-8 text-xs font-bold gap-1.5">
                                                <Edit className="h-3.5 w-3.5" /> Edit
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-500/10 p-0"
                                            onClick={() => handleDelete(slide.id, slide.title)}
                                            disabled={processingId === slide.id}
                                        >
                                            {processingId === slide.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Add New card */}
                    <Link href="/admin/cms/slider/new" className="block">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="h-full min-h-[300px] rounded-3xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                                <Plus className="w-7 h-7 text-primary" />
                            </div>
                            <div className="text-center">
                                <p className="font-black text-sm group-hover:text-primary transition-colors">Add New Slide</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Click to create</p>
                            </div>
                        </motion.div>
                    </Link>
                </div>
            )}
        </div>
    );
}
