'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, Loader2, Trash2, Edit, Play,
    Eye, EyeOff, MoveUp, MoveDown, Calendar, Link2
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useCms, AdSlide } from '@/context/CmsContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

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
            await api.put('/cms/layout', {
                componentId: 'AD_SLIDER',
                isVisible: nextValue,
                displayOrder: 0 // Sliders are usually at the top
            });
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Play className="h-8 w-8 text-primary" />
                        Home Slider Manager
                    </h1>
                    <p className="text-muted-foreground">Manage advertisement banners and videos on the landing page.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                        variant={isVisible ? "default" : "outline"}
                        onClick={toggleGlobalVisibility}
                        disabled={processingId === 'global'}
                        className="flex-1 sm:flex-none"
                    >
                        {processingId === 'global' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : isVisible ? (
                            <Eye className="mr-2 h-4 w-4" />
                        ) : (
                            <EyeOff className="mr-2 h-4 w-4" />
                        )}
                        {isVisible ? 'Slider is ON' : 'Slider is OFF'}
                    </Button>
                    <Link href="/admin/cms/slider/new" className="flex-1 sm:flex-none">
                        <Button className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            New Slide
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search slides..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                <tr>
                                    <th className="p-4 w-16 text-center">Order</th>
                                    <th className="p-4">Media</th>
                                    <th className="p-4">Content</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Scheduling</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-muted-foreground">
                                            No slides found. Create your first advertisement slide!
                                        </td>
                                    </tr>
                                ) : filtered.map((slide) => (
                                    <tr key={slide.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="p-4 text-center font-mono font-bold text-lg text-muted-foreground">
                                            {slide.displayOrder}
                                        </td>
                                        <td className="p-4">
                                            <div className="relative w-24 h-14 rounded-lg overflow-hidden border bg-black shadow-inner">
                                                {slide.mediaType === 'VIDEO' ? (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Play className="h-6 w-6 text-white" />
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={slide.mediaUrl}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="max-w-xs">
                                                <p className="font-bold truncate" title={slide.title}>{slide.title}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">{slide.description || 'No description'}</p>
                                                {slide.ctaText && (
                                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-primary uppercase font-black tracking-widest">
                                                        <Link2 className="h-3 w-3" /> {slide.ctaText}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="outline" className="font-black text-[10px]">
                                                {slide.mediaType}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            {slide.isActive ? (
                                                <Badge className="bg-green-500/10 text-green-500 border-green-500/30">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Disabled</Badge>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs space-y-1">
                                            {slide.startDate || slide.endDate ? (
                                                <>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        {slide.startDate ? new Date(slide.startDate).toLocaleDateString() : 'Start'}
                                                        <span>→</span>
                                                        {slide.endDate ? new Date(slide.endDate).toLocaleDateString() : 'End'}
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground italic">Always Visible</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/admin/cms/slider/${slide.id}/edit`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                    onClick={() => handleDelete(slide.id, slide.title)}
                                                    disabled={processingId === slide.id}
                                                >
                                                    {processingId === slide.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
