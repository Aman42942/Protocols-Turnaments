
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import {
    Save, Loader2, Palette, Type, Image as ImageIcon, Code, ArrowLeft, CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeSettingsPage() {
    const router = useRouter();
    // We can also use the context to refresh the theme immediately after save
    const { refreshTheme } = useTheme();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [formData, setFormData] = useState({
        siteName: '',
        primaryColor: '#ff4f4f',
        secondaryColor: '#1f1f1f',
        accentColor: '#3b82f6',
        backgroundColor: '#000000',
        heroTitle: '',
        heroSubtitle: '',
        heroImageUrl: '',
        customCss: '',
    });

    useEffect(() => {
        fetchThemeSettings();
    }, []);

    const fetchThemeSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/theme');
            setFormData({
                siteName: res.data.siteName || '',
                primaryColor: res.data.primaryColor || '#ff4f4f',
                secondaryColor: res.data.secondaryColor || '#1f1f1f',
                accentColor: res.data.accentColor || '#3b82f6',
                backgroundColor: res.data.backgroundColor || '#000000',
                heroTitle: res.data.heroTitle || '',
                heroSubtitle: res.data.heroSubtitle || '',
                heroImageUrl: res.data.heroImageUrl || '',
                customCss: res.data.customCss || '',
            });
        } catch (error) {
            console.error('Failed to load theme settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch('/theme', formData);
            setSaved(true);
            await refreshTheme(); // Apply changes immediately
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Failed to save theme settings', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const ColorInput = ({ label, name, value }: { label: string, name: string, value: string }) => (
        <div className="grid gap-2">
            <label className="text-sm font-medium">{label}</label>
            <div className="flex gap-2 items-center">
                <div className="relative w-10 h-10 rounded-md overflow-hidden border border-input shadow-sm">
                    <input
                        type="color"
                        name={name}
                        value={value}
                        onChange={handleChange}
                        className="absolute inset-0 w-16 h-16 -top-2 -left-2 cursor-pointer p-0 border-0"
                    />
                </div>
                <Input
                    name={name}
                    value={value}
                    onChange={handleChange}
                    className="font-mono"
                    maxLength={7}
                />
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Palette className="h-8 w-8 text-primary" />
                            Theme Customization
                        </h1>
                        <p className="text-muted-foreground">Customize your platform's look and feel.</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} size="lg">
                    {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : saved ? (
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    {saved ? 'Changes Applied!' : 'Save Theme'}
                </Button>
            </div>

            {/* Theme Presets */}
            <Card className="bg-muted/30 border-dashed">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Palette className="h-4 w-4" /> Quick Presets
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    <Button
                        variant="outline"
                        onClick={() => setFormData(prev => ({
                            ...prev,
                            primaryColor: '#25D366',
                            secondaryColor: '#1F2C34',
                            accentColor: '#128C7E',
                            backgroundColor: '#0B141A',
                            siteName: prev.siteName || 'Pro Tournaments', // Keep existing name
                        }))}
                        className="border-green-500/50 hover:bg-green-500/10 hover:text-green-500 transition-colors"
                    >
                        <div className="w-3 h-3 rounded-full bg-[#25D366] mr-2" />
                        WhatsApp Dark
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setFormData(prev => ({
                            ...prev,
                            primaryColor: '#3b82f6',
                            secondaryColor: '#1e293b',
                            accentColor: '#f59e0b',
                            backgroundColor: '#020617',
                        }))}
                        className="border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                    >
                        <div className="w-3 h-3 rounded-full bg-[#3b82f6] mr-2" />
                        Default Blue
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setFormData(prev => ({
                            ...prev,
                            primaryColor: '#ef4444',
                            secondaryColor: '#18181b', // zinc-950/900 mix
                            accentColor: '#facc15', // Yellow
                            backgroundColor: '#09090b', // zinc-950
                        }))}
                        className="border-red-500/50 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                    >
                        <div className="w-3 h-3 rounded-full bg-[#ef4444] mr-2" />
                        Gaming Red
                    </Button>
                </CardContent>
            </Card >

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {/* Branding */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Type className="h-5 w-5" /> Branding</CardTitle>
                        <CardDescription>Set your site name and primary colors.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Site Name</label>
                            <Input name="siteName" value={formData.siteName} onChange={handleChange} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <ColorInput label="Primary Color" name="primaryColor" value={formData.primaryColor} />
                            <ColorInput label="Secondary Color" name="secondaryColor" value={formData.secondaryColor} />
                            <ColorInput label="Accent Color" name="accentColor" value={formData.accentColor} />
                            <ColorInput label="Background Color" name="backgroundColor" value={formData.backgroundColor} />
                        </div>
                    </CardContent>
                </Card>

                {/* Hero Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Hero Section</CardTitle>
                        <CardDescription>Customize the main landing page banner.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Hero Title</label>
                            <Input name="heroTitle" value={formData.heroTitle} onChange={handleChange} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Hero Subtitle</label>
                            <Input name="heroSubtitle" value={formData.heroSubtitle} onChange={handleChange} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Hero Image URL</label>
                            <Input name="heroImageUrl" value={formData.heroImageUrl} onChange={handleChange} placeholder="https://..." />
                        </div>
                    </CardContent>
                </Card>

                {/* Advanced Custom CSS - Full Width */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> Advanced Custom CSS</CardTitle>
                        <CardDescription>Inject custom CSS to override any style. Use with caution.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            name="customCss"
                            value={formData.customCss}
                            onChange={handleChange}
                            className="flex min-h-[200px] w-full rounded-md border border-input bg-zinc-950 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-zinc-300"
                            placeholder="/* Enter custom CSS here */"
                        />
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
