"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { Loader2, Globe, Settings, Clock, Palette, Save, Megaphone, ShieldAlert, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { motion } from 'framer-motion';

export default function WebsiteManagePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        isMaintenanceMode: false,
        title: '',
        message: '',
        endTime: '',
        showTimer: true,
        animations: true,
        colorPrimary: '#00E676',
    });

    // Status text for auto-save
    const [saveStatus, setSaveStatus] = useState<string>('');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/maintenance');
            if (res.data) {
                setConfig({
                    isMaintenanceMode: res.data.isMaintenanceMode ?? false,
                    title: res.data.title || 'SYSTEM UPGRADE',
                    message: res.data.message || 'We are currently deploying a massive update to enhance your gaming experience. Servers will be back online shortly.',
                    endTime: res.data.endTime || '',
                    showTimer: res.data.showTimer ?? true,
                    animations: res.data.animations ?? true,
                    colorPrimary: res.data.colorPrimary || '#00E676',
                });
            }
        } catch (error) {
            console.error('Failed to load maintenance config', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        const newConfig = { ...config, [field]: value };
        setConfig(newConfig);
        autoSave(newConfig);
    };

    const autoSave = async (dataToSave: any) => {
        setSaving(true);
        setSaveStatus('Saving...');
        try {
            await api.post('/maintenance/config', dataToSave);
            setSaveStatus('All changes saved instantly');
            setTimeout(() => setSaveStatus(''), 3000);
        } catch (error) {
            console.error('Failed to save maintenance config', error);
            setSaveStatus('Error saving');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div>
                <h1 className="text-3xl font-black capitalize tracking-tight flex items-center gap-3">
                    <Globe className="w-8 h-8 text-primary" /> Website Management
                </h1>
                <p className="text-muted-foreground mt-2">
                    Instantly control what users see when they visit your platform. Changes apply immediately.
                </p>
            </div>

            <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border/50 sticky top-4 z-40 backdrop-blur-md shadow-lg shadow-black/20">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl flex items-center justify-center ${config.isMaintenanceMode ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Master Control Switch</h3>
                        <p className="text-sm text-muted-foreground">
                            {config.isMaintenanceMode ? 'Website is currently hidden from users.' : 'Website is LIVE and visible to all users.'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {saveStatus && (
                        <span className="text-sm font-medium text-emerald-500 flex items-center gap-1 animate-pulse">
                            <Save className="w-4 h-4" /> {saveStatus}
                        </span>
                    )}
                    <Switch
                        checked={config.isMaintenanceMode}
                        onCheckedChange={(val: boolean) => handleChange('isMaintenanceMode', val)}
                        className="scale-125 data-[state=checked]:bg-red-500"
                    />
                </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-500 ${!config.isMaintenanceMode ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}`}>
                <Card className="border-border/50 shadow-xl overflow-hidden rounded-[2rem]">
                    <div className="h-2 bg-gradient-to-r from-primary to-purple-500" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold">
                            <Megaphone className="w-5 h-5 text-primary" /> Maintenance Messaging
                        </CardTitle>
                        <CardDescription>What users will read while the site is down.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <Label className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Headline Title</Label>
                            <Input
                                value={config.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="e.g. SYSTEM UPGRADE"
                                className="text-lg font-bold h-12"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Detailed Message</Label>
                            <Textarea
                                value={config.message}
                                onChange={(e) => handleChange('message', e.target.value)}
                                placeholder="Explain what is happening..."
                                className="min-h-[120px] resize-none"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-border/50 shadow-xl rounded-[2rem]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                <Clock className="w-5 h-5 text-primary" /> Countdown Timer
                            </CardTitle>
                            <CardDescription>Set an estimated return time for users.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                                <div>
                                    <p className="font-semibold">Enable Live Timer</p>
                                    <p className="text-xs text-muted-foreground">Show ticking clock on page</p>
                                </div>
                                <Switch
                                    checked={config.showTimer}
                                    onCheckedChange={(val: boolean) => handleChange('showTimer', val)}
                                />
                            </div>

                            {config.showTimer && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                                    <Label className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Estimated End Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={config.endTime}
                                        onChange={(e) => handleChange('endTime', e.target.value)}
                                        className="h-12 border-primary/20"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Leave blank to show 00:00:00 if timer is enabled</p>
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-xl rounded-[2rem]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                <Sparkles className="w-5 h-5 text-primary" /> Visual Aesthetics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                                <div>
                                    <p className="font-semibold">VFX Background</p>
                                    <p className="text-xs text-muted-foreground">Glowing floating orbs</p>
                                </div>
                                <Switch
                                    checked={config.animations}
                                    onCheckedChange={(val: boolean) => handleChange('animations', val)}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Accent Color</Label>
                                <div className="flex gap-4 items-center">
                                    <div className="h-12 w-12 rounded-full border-2 border-border shadow-lg overflow-hidden shrink-0">
                                        <input
                                            type="color"
                                            value={config.colorPrimary}
                                            onChange={(e) => handleChange('colorPrimary', e.target.value)}
                                            className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                                        />
                                    </div>
                                    <Input
                                        value={config.colorPrimary}
                                        onChange={(e) => handleChange('colorPrimary', e.target.value)}
                                        className="h-12 font-mono"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {!config.isMaintenanceMode && (
                <div className="text-center p-8 border-2 border-dashed border-border/50 rounded-3xl opacity-50">
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Configs are disabled while website is LIVE</p>
                </div>
            )}
        </div>
    );
}

