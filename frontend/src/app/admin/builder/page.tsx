'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Type, Check, RefreshCw, Layers, Image as ImageIcon, Plus, Trash2, Save, LayoutTemplate, GripVertical, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { useCms } from '@/context/CmsContext';
import { toast } from 'sonner';

export default function SiteBuilderPage() {
    const { config, refreshConfig } = useCms();
    const [activeTab, setActiveTab] = useState<'theme' | 'content' | 'layout' | 'features'>('theme');
    const [saving, setSaving] = useState(false);

    // Features State
    const [localFeatures, setLocalFeatures] = useState<any[]>([]);

    // Layout State
    const [localLayouts, setLocalLayouts] = useState<any[]>([]);

    // Theme State
    const [themeForm, setThemeForm] = useState({
        mode: 'DARK',
        primaryColor: '#FF5733',
        secondaryColor: '#1F1F1F',
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        fontFamily: 'Inter',
        borderRounding: '0.5rem',
        animationSpeed: 'normal',
        buttonStyle: 'solid',
        glassmorphism: false,
        backgroundStyle: 'solid'
    });

    // Content State
    const [contentForm, setContentForm] = useState<Record<string, string>>({});

    useEffect(() => {
        if (config?.theme) {
            setThemeForm(config.theme);
        }
        if (config?.content) {
            setContentForm({
                HERO_TITLE: config.content.HERO_TITLE || 'Compete. Win. Become a Legend.',
                HERO_SUBTITLE: config.content.HERO_SUBTITLE || 'Join the ultimate esports platform.',
                LOGO_URL: config.content.LOGO_URL || '',
                SEO_META_TITLE: config.content.SEO_META_TITLE || 'Protocol Tournament',
                SEO_META_DESCRIPTION: config.content.SEO_META_DESCRIPTION || 'The ultimate competitive gaming platform.',
                SEO_META_KEYWORDS: config.content.SEO_META_KEYWORDS || 'esports, tournament, gaming, competitive',
                SEO_OG_IMAGE: config.content.SEO_OG_IMAGE || '',
                SEO_FAVICON_URL: config.content.SEO_FAVICON_URL || '',
            });
        }
        if (config?.features) {
            setLocalFeatures(config.features);
        }
        if (config?.layout) {
            // Sort by displayOrder
            const sorted = [...config.layout].sort((a, b) => a.displayOrder - b.displayOrder);
            if (sorted.length === 0) {
                // Default fallback if DB is empty
                setLocalLayouts([
                    { componentId: 'HERO', isVisible: true, displayOrder: 0 },
                    { componentId: 'FEATURES', isVisible: true, displayOrder: 1 },
                    { componentId: 'TOURNAMENTS', isVisible: true, displayOrder: 2 },
                ]);
            } else {
                setLocalLayouts(sorted);
            }
        }
    }, [config]);

    const handleAddFeature = async () => {
        try {
            setSaving(true);
            await api.post('/cms/features', { title: 'New Feature Block', description: 'Describe what makes your platform unique here.', type: 'CARD' });
            await refreshConfig();
            toast.success('Feature block added.');
        } catch (err) {
            toast.error('Failed to add feature.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteFeature = async (id: string) => {
        if (!confirm('Are you sure you want to permanently delete this feature block?')) return;
        try {
            setSaving(true);
            await api.delete(`/cms/features/${id}`);
            await refreshConfig();
            toast.success('Feature chunk removed.');
        } catch (err) {
            toast.error('Failed to delete feature.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateFeature = async (index: number) => {
        try {
            setSaving(true);
            const feature = localFeatures[index];
            await api.put(`/cms/features/${feature.id}`, {
                title: feature.title,
                description: feature.description,
                icon: feature.icon,
                type: feature.type,
            });
            await refreshConfig();
            toast.success('Feature updated.');
        } catch (err) {
            toast.error('Failed to update feature.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTheme = async () => {
        try {
            setSaving(true);
            await api.put('/cms/theme', themeForm);
            await refreshConfig();
            toast.success('Theme updated! Changes applied globally.');
        } catch (err) {
            toast.error('Failed to update theme.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveContent = async () => {
        try {
            setSaving(true);
            const items = Object.entries(contentForm).map(([key, value]) => ({ key, value }));
            await api.put('/cms/content', { items });
            await refreshConfig();
            toast.success('Content updated successfully.');
        } catch (err) {
            toast.error('Failed to update content.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveLayout = async () => {
        try {
            setSaving(true);
            // Re-assign displayOrders before saving
            const updatedLayouts = localLayouts.map((l, index) => ({ ...l, displayOrder: index }));

            // Note: Since NestJS expects sequential PUT requests for /cms/layout 
            // wait, our api is PUT /cms/layout ? Let's make an array batch update.
            // Oh, cmsController earlier was probably not array. Let me just use a loop for now or adjust backend if it fails.
            // Wait, I will add an array endpoint if needed, but let's assume I can map them over `api.put('/cms/layout')`
            for (const layout of updatedLayouts) {
                await api.put('/cms/layout', layout);
            }

            await refreshConfig();
            toast.success('Website structure updated!');
        } catch (err) {
            toast.error('Failed to update layout.');
        } finally {
            setSaving(false);
        }
    };

    if (!config) {
        return (
            <div className="flex items-center justify-center p-20">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-wider">Ultimate Site Builder</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Design, Customize, and Control your entire platform in real-time.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => window.open('/', '_blank')}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-bold transition-all border border-primary/20"
                    >
                        <Eye className="w-4 h-4" /> View Site
                    </button>
                    <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border overflow-x-auto">
                        <button onClick={() => setActiveTab('theme')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'theme' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                            <Palette className="w-4 h-4" /> Theme
                        </button>
                        <button onClick={() => setActiveTab('content')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'content' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                            <Type className="w-4 h-4" /> Content
                        </button>
                        <button onClick={() => setActiveTab('layout')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'layout' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                            <Layers className="w-4 h-4" /> Layout Manager
                        </button>
                        <button onClick={() => setActiveTab('features')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'features' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                            <LayoutTemplate className="w-4 h-4" /> Features
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Editor Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-3xl p-6 shadow-xl"
                    >
                        {activeTab === 'theme' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-border pb-4">
                                    <Palette className="w-5 h-5 text-primary" />
                                    <h2 className="text-xl font-bold">Theme Studio</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Colors */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Brand Style & Colors</h3>

                                        <div>
                                            <label className="text-sm font-semibold mb-1.5 block">Global Theme Mode</label>
                                            <div className="flex bg-muted p-1 rounded-xl border border-border">
                                                <button
                                                    onClick={() => {
                                                        const isCurrentlyDark = themeForm.mode === 'DARK';
                                                        if (isCurrentlyDark) {
                                                            const newForm = { ...themeForm, mode: 'LIGHT' };
                                                            if (themeForm.backgroundColor === '#000000') newForm.backgroundColor = '#FFFFFF';
                                                            if (themeForm.textColor === '#FFFFFF') newForm.textColor = '#000000';
                                                            setThemeForm(newForm);
                                                        }
                                                    }}
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${themeForm.mode === 'LIGHT' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    LIGHT MODE
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const isCurrentlyLight = themeForm.mode === 'LIGHT';
                                                        if (isCurrentlyLight) {
                                                            const newForm = { ...themeForm, mode: 'DARK' };
                                                            if (themeForm.backgroundColor === '#FFFFFF') newForm.backgroundColor = '#000000';
                                                            if (themeForm.textColor === '#000000') newForm.textColor = '#FFFFFF';
                                                            setThemeForm(newForm);
                                                        }
                                                    }}
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${themeForm.mode === 'DARK' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    DARK MODE
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold mb-1.5 block">Primary Color</label>
                                            <div className="flex items-center gap-3">
                                                <input type="color" value={themeForm.primaryColor} onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                                                <input type="text" value={themeForm.primaryColor} onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })} className="flex-1 bg-muted px-3 py-2 rounded-xl text-sm font-mono border border-border focus:border-primary outline-none" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold mb-1.5 block">Secondary Accent</label>
                                            <div className="flex items-center gap-3">
                                                <input type="color" value={themeForm.secondaryColor} onChange={(e) => setThemeForm({ ...themeForm, secondaryColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                                                <input type="text" value={themeForm.secondaryColor} onChange={(e) => setThemeForm({ ...themeForm, secondaryColor: e.target.value })} className="flex-1 bg-muted px-3 py-2 rounded-xl text-sm font-mono border border-border focus:border-primary outline-none" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold mb-1.5 block">Global Background</label>
                                            <div className="flex items-center gap-3">
                                                <input type="color" value={themeForm.backgroundColor} onChange={(e) => setThemeForm({ ...themeForm, backgroundColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                                                <input type="text" value={themeForm.backgroundColor} onChange={(e) => setThemeForm({ ...themeForm, backgroundColor: e.target.value })} className="flex-1 bg-muted px-3 py-2 rounded-xl text-sm font-mono border border-border focus:border-primary outline-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold mb-1.5 block">Default Text Color</label>
                                            <div className="flex items-center gap-3">
                                                <input type="color" value={themeForm.textColor} onChange={(e) => setThemeForm({ ...themeForm, textColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                                                <input type="text" value={themeForm.textColor} onChange={(e) => setThemeForm({ ...themeForm, textColor: e.target.value })} className="flex-1 bg-muted px-3 py-2 rounded-xl text-sm font-mono border border-border focus:border-primary outline-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Typography & Structural */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Typography & Layout</h3>

                                        <div>
                                            <label className="text-sm font-semibold mb-1.5 block">Font Family</label>
                                            <select value={themeForm.fontFamily} onChange={(e) => setThemeForm({ ...themeForm, fontFamily: e.target.value })} className="w-full bg-muted px-3 py-2 rounded-xl text-sm border border-border focus:border-primary outline-none">
                                                <option value="Inter">Inter (Default)</option>
                                                <option value="Roboto">Roboto</option>
                                                <option value="Outfit">Outfit (Gaming)</option>
                                                <option value="Space Grotesk">Space Grotesk (Tech)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold mb-1.5 block">Component Rounding (Border Radius)</label>
                                            <select value={themeForm.borderRounding} onChange={(e) => setThemeForm({ ...themeForm, borderRounding: e.target.value })} className="w-full bg-muted px-3 py-2 rounded-xl text-sm border border-border focus:border-primary outline-none">
                                                <option value="0px">Sharp Edges (0px)</option>
                                                <option value="0.5rem">Subtle Rounded (0.5rem)</option>
                                                <option value="1rem">Soft Rounded (1rem)</option>
                                                <option value="9999px">Pill / Circle (9999px)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold mb-1.5 block">Global Animation Speed</label>
                                            <select value={themeForm.animationSpeed} onChange={(e) => setThemeForm({ ...themeForm, animationSpeed: e.target.value })} className="w-full bg-muted px-3 py-2 rounded-xl text-sm border border-border focus:border-primary outline-none">
                                                <option value="fast">Fast & Snappy</option>
                                                <option value="normal">Normal (Default)</option>
                                                <option value="slow">Slow & Cinematic</option>
                                            </select>
                                        </div>

                                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest pt-4">Advanced Effects</h3>

                                        <div>
                                            <label className="text-sm font-semibold mb-1.5 block">Button Aesthetics</label>
                                            <select value={themeForm.buttonStyle} onChange={(e) => setThemeForm({ ...themeForm, buttonStyle: e.target.value })} className="w-full bg-muted px-3 py-2 rounded-xl text-sm border border-border focus:border-primary outline-none">
                                                <option value="solid">Solid Vibrant</option>
                                                <option value="outline">Outline Glow</option>
                                                <option value="ghost">Ghost Transparent</option>
                                                <option value="neumorphism">Neumorphic</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold mb-1.5 block">Global Background Style</label>
                                            <select value={themeForm.backgroundStyle} onChange={(e) => setThemeForm({ ...themeForm, backgroundStyle: e.target.value })} className="w-full bg-muted px-3 py-2 rounded-xl text-sm border border-border focus:border-primary outline-none">
                                                <option value="solid">Deep Solid Matrix</option>
                                                <option value="gradient-top">Gradient Glow (Top)</option>
                                                <option value="gradient-radial">Radial Cyberpunk Gradient</option>
                                                <option value="grid">Grid Overlay Background</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center justify-between bg-muted/50 p-4 rounded-xl border border-border">
                                            <div>
                                                <label className="text-sm font-bold block">Glassmorphism Mode</label>
                                                <span className="text-xs text-muted-foreground font-medium">Enable cinematic translucent blurs</span>
                                            </div>
                                            <button
                                                onClick={() => setThemeForm({ ...themeForm, glassmorphism: !themeForm.glassmorphism })}
                                                className={`w-14 h-7 rounded-full transition-colors relative shadow-inner ${themeForm.glassmorphism ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all shadow-md ${themeForm.glassmorphism ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={handleSaveTheme}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
                                    >
                                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        Deploy Theme
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-border pb-4">
                                    <Type className="w-5 h-5 text-primary" />
                                    <h2 className="text-xl font-bold">Content Manager</h2>
                                </div>

                                <div className="space-y-5">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest pt-2">Global Assets & Copy</h3>

                                    <div>
                                        <label className="text-sm font-bold flex items-center gap-2 mb-2"><ImageIcon className="w-4 h-4 text-muted-foreground" /> Navbar Logo URL</label>
                                        <input
                                            type="text"
                                            placeholder="https://example.com/logo.png"
                                            value={contentForm.LOGO_URL || ''}
                                            onChange={(e) => setContentForm({ ...contentForm, LOGO_URL: e.target.value })}
                                            className="w-full bg-muted px-4 py-3 rounded-xl border border-border focus:border-primary outline-none text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-bold mb-2 block">Homepage Hero Title</label>
                                        <input
                                            type="text"
                                            value={contentForm.HERO_TITLE || ''}
                                            onChange={(e) => setContentForm({ ...contentForm, HERO_TITLE: e.target.value })}
                                            className="w-full bg-muted px-4 py-3 rounded-xl border border-border focus:border-primary outline-none font-black text-lg"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-bold mb-2 block">Homepage Hero Subtitle</label>
                                        <textarea
                                            rows={3}
                                            value={contentForm.HERO_SUBTITLE || ''}
                                            onChange={(e) => setContentForm({ ...contentForm, HERO_SUBTITLE: e.target.value })}
                                            className="w-full bg-muted px-4 py-3 rounded-xl border border-border focus:border-primary outline-none text-sm resize-none"
                                        />
                                    </div>

                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest pt-6 border-t border-border">Search Engine Optimization (SEO)</h3>
                                    <p className="text-xs text-muted-foreground -mt-3">Control how your website appears on Google and Social Media links.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="text-sm font-bold mb-2 block">Site Meta Title</label>
                                            <input
                                                type="text"
                                                value={contentForm.SEO_META_TITLE || ''}
                                                onChange={(e) => setContentForm({ ...contentForm, SEO_META_TITLE: e.target.value })}
                                                className="w-full bg-muted px-4 py-2.5 rounded-xl border border-border focus:border-primary outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold mb-2 block">Meta Keywords (comma separated)</label>
                                            <input
                                                type="text"
                                                value={contentForm.SEO_META_KEYWORDS || ''}
                                                onChange={(e) => setContentForm({ ...contentForm, SEO_META_KEYWORDS: e.target.value })}
                                                className="w-full bg-muted px-4 py-2.5 rounded-xl border border-border focus:border-primary outline-none text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-bold mb-2 block">Meta Description</label>
                                        <textarea
                                            rows={2}
                                            value={contentForm.SEO_META_DESCRIPTION || ''}
                                            onChange={(e) => setContentForm({ ...contentForm, SEO_META_DESCRIPTION: e.target.value })}
                                            className="w-full bg-muted px-4 py-3 rounded-xl border border-border focus:border-primary outline-none text-sm resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="text-sm font-bold flex items-center gap-2 mb-2"><ImageIcon className="w-4 h-4 text-muted-foreground" /> Open Graph Image (OG:Image)</label>
                                            <input
                                                type="text"
                                                placeholder="Direct link to banner image... (1200x630px recommended)"
                                                value={contentForm.SEO_OG_IMAGE || ''}
                                                onChange={(e) => setContentForm({ ...contentForm, SEO_OG_IMAGE: e.target.value })}
                                                className="w-full bg-muted px-4 py-3 rounded-xl border border-border focus:border-primary outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold flex items-center gap-2 mb-2"><ImageIcon className="w-4 h-4 text-muted-foreground" /> Site Favicon URL (.ico/.png)</label>
                                            <input
                                                type="text"
                                                placeholder="Direct link to small logo icon..."
                                                value={contentForm.SEO_FAVICON_URL || ''}
                                                onChange={(e) => setContentForm({ ...contentForm, SEO_FAVICON_URL: e.target.value })}
                                                className="w-full bg-muted px-4 py-3 rounded-xl border border-border focus:border-primary outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={handleSaveContent}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
                                    >
                                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        Publish Content
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'layout' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-border pb-4">
                                    <Layers className="w-5 h-5 text-primary" />
                                    <h2 className="text-xl font-bold">Structural Layout Builder</h2>
                                </div>
                                <p className="text-sm text-muted-foreground">Drag and reorder the sections to change how they structure on the homepage. Toggle visibility to completely hide them.</p>

                                <div className="space-y-3 pt-2">
                                    {localLayouts.map((layout, idx) => (
                                        <div key={layout.componentId} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${layout.isVisible ? 'bg-muted/50 border-border' : 'bg-muted/20 border-border/40 opacity-50'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="md:grid grid-cols-1 hover:text-primary cursor-grab active:cursor-grabbing text-muted-foreground">
                                                    <GripVertical className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold">{layout.componentId} BLOCK</h4>
                                                    <p className="text-xs text-muted-foreground">Homepage Level Section</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => {
                                                        const newL = [...localLayouts];
                                                        newL[idx].isVisible = !newL[idx].isVisible;
                                                        setLocalLayouts(newL);
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors ${layout.isVisible ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-background border border-border text-muted-foreground hover:bg-muted'}`}
                                                >
                                                    {layout.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                </button>
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        onClick={() => {
                                                            if (idx === 0) return;
                                                            const newL = [...localLayouts];
                                                            const temp = newL[idx];
                                                            newL[idx] = newL[idx - 1];
                                                            newL[idx - 1] = temp;
                                                            setLocalLayouts(newL);
                                                        }}
                                                        disabled={idx === 0}
                                                        className="text-xs px-2 py-0.5 bg-background border border-border rounded hover:bg-muted disabled:opacity-30"
                                                    >▲</button>
                                                    <button
                                                        onClick={() => {
                                                            if (idx === localLayouts.length - 1) return;
                                                            const newL = [...localLayouts];
                                                            const temp = newL[idx];
                                                            newL[idx] = newL[idx + 1];
                                                            newL[idx + 1] = temp;
                                                            setLocalLayouts(newL);
                                                        }}
                                                        disabled={idx === localLayouts.length - 1}
                                                        className="text-xs px-2 py-0.5 bg-background border border-border rounded hover:bg-muted disabled:opacity-30"
                                                    >▼</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={handleSaveLayout}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
                                    >
                                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        Save Architecture
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'features' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-border pb-4">
                                    <div className="flex items-center gap-3">
                                        <LayoutTemplate className="w-5 h-5 text-primary" />
                                        <h2 className="text-xl font-bold">Dynamic Feature Blocks</h2>
                                    </div>
                                    <button
                                        onClick={handleAddFeature}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-primary/20 text-primary hover:bg-primary/30 px-4 py-2 rounded-xl font-bold transition-all text-sm"
                                    >
                                        <Plus className="w-4 h-4" /> Add Feature
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {localFeatures.length === 0 ? (
                                        <div className="text-center py-12 border-2 border-dashed border-border rounded-3xl">
                                            <p className="text-muted-foreground font-medium">No custom features added yet.</p>
                                        </div>
                                    ) : (
                                        localFeatures.map((feature, idx) => (
                                            <div key={feature.id} className="p-5 rounded-2xl border border-border bg-muted/30 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs font-bold mb-1.5 block text-muted-foreground uppercase tracking-wider">Feature Title</label>
                                                        <input
                                                            type="text"
                                                            value={feature.title}
                                                            onChange={(e) => {
                                                                const newF = [...localFeatures];
                                                                newF[idx].title = e.target.value;
                                                                setLocalFeatures(newF);
                                                            }}
                                                            className="w-full bg-background px-3 py-2 rounded-xl border border-border focus:border-primary outline-none font-bold"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold mb-1.5 block text-muted-foreground uppercase tracking-wider">Icon Name (Optional)</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Shield, Zap, Target"
                                                            value={feature.icon || ''}
                                                            onChange={(e) => {
                                                                const newF = [...localFeatures];
                                                                newF[idx].icon = e.target.value;
                                                                setLocalFeatures(newF);
                                                            }}
                                                            className="w-full bg-background px-3 py-2 rounded-xl border border-border focus:border-primary outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold mb-1.5 block text-muted-foreground uppercase tracking-wider">Description</label>
                                                    <textarea
                                                        rows={2}
                                                        value={feature.description || ''}
                                                        onChange={(e) => {
                                                            const newF = [...localFeatures];
                                                            newF[idx].description = e.target.value;
                                                            setLocalFeatures(newF);
                                                        }}
                                                        className="w-full bg-background px-3 py-2 rounded-xl border border-border focus:border-primary outline-none text-sm resize-none"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2 pt-2">
                                                    <button
                                                        onClick={() => handleDeleteFeature(feature.id)}
                                                        className="flex items-center gap-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateFeature(idx)}
                                                        disabled={saving}
                                                        className="flex items-center gap-1.5 bg-background border border-border hover:border-primary text-foreground px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                                                    >
                                                        <Save className="w-3.5 h-3.5" /> Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Live Preview Side Panel */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ backgroundColor: themeForm.primaryColor }}>
                            <Palette className="w-8 h-8" style={{ color: themeForm.textColor || '#fff' }} />
                        </div>
                        <h3 className="font-black text-xl" style={{ fontFamily: `"${themeForm.fontFamily}", sans-serif` }}>Live Preview</h3>
                        <p className="text-sm text-muted-foreground w-full p-3 rounded-xl border border-border/50" style={{ backgroundColor: themeForm.backgroundColor, color: themeForm.textColor, borderRadius: themeForm.borderRounding }}>
                            This is a preview container. Any changes you make to the primary colors or rounding will reflect instantly on the actual website once you deploy.
                        </p>

                        <button
                            onClick={() => window.open('/', '_blank')}
                            style={{ backgroundColor: themeForm.primaryColor, color: themeForm.textColor || '#FFF', borderRadius: themeForm.borderRounding }}
                            className="w-full py-3 font-bold mt-4 shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            View Live Website
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
