"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Lock, Bell, Shield, Mail, Camera, Loader2, CheckCircle, Gamepad2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [saveMessage, setSaveMessage] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        bio: '',
        country: '',
        avatar: '',
        riotId: '',
        pubgId: '',
        bgmiId: '',
        freeFireId: '',
    });

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Fetch real user data from API
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/me');
                const user = res.data;
                setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    bio: user.bio || '',
                    country: user.country || '',
                    avatar: user.avatar || '',
                    riotId: user.riotId || '',
                    pubgId: user.pubgId || '',
                    bgmiId: user.bgmiId || '',
                    freeFireId: user.freeFireId || '',
                });
            } catch (err: any) {
                if (err.response?.status === 401) {
                    window.location.href = '/login';
                }
                // Fallback to localStorage
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    setFormData(prev => ({
                        ...prev,
                        name: user.name || '',
                        email: user.email || '',
                        avatar: user.avatar || '',
                    }));
                }
            } finally {
                setIsFetching(false);
            }
        };
        fetchProfile();
    }, []);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        setSaveMessage('');
        try {
            await api.patch('/users/me', {
                name: formData.name,
                bio: formData.bio,
                country: formData.country,
                avatar: formData.avatar,
                riotId: formData.riotId,
                pubgId: formData.pubgId,
                bgmiId: formData.bgmiId,
                freeFireId: formData.freeFireId,
            });
            // Update localStorage too
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                localStorage.setItem('user', JSON.stringify({ ...parsed, name: formData.name, avatar: formData.avatar }));
                window.dispatchEvent(new Event('auth-change'));
            }
            setSaveMessage('Settings saved successfully!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save settings');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 pt-8 pb-12">
            <div className="container max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your account settings and preferences.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <Card className="h-fit">
                        <CardContent className="p-2">
                            <nav className="flex flex-col gap-1">
                                {[
                                    { id: 'profile', icon: User, label: 'Profile' },
                                    { id: 'gameids', icon: Gamepad2, label: 'Game IDs' },
                                    { id: 'account', icon: Lock, label: 'Account' },
                                    { id: 'notifications', icon: Bell, label: 'Notifications' },
                                    { id: 'security', icon: Shield, label: 'Security' },
                                ].map(tab => (
                                    <Button
                                        key={tab.id}
                                        variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                                        className="justify-start"
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <tab.icon className="mr-2 h-4 w-4" />
                                        {tab.label}
                                    </Button>
                                ))}
                            </nav>
                        </CardContent>
                    </Card>

                    {/* Main Content */}
                    <div className="md:col-span-3 space-y-6">
                        {/* Success Message */}
                        {saveMessage && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">{saveMessage}</span>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile Information</CardTitle>
                                    <CardDescription>Update your photo and personal details.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                        <div className="flex flex-col items-center gap-4">
                                            <div
                                                className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border-2 border-primary/20 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={handleAvatarClick}
                                            >
                                                {formData.avatar ? (
                                                    <img src={formData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                                                ) : (
                                                    formData.name.charAt(0).toUpperCase() || 'U'
                                                )}
                                            </div>
                                            <Button variant="outline" size="sm" onClick={handleAvatarClick}>
                                                <Camera className="mr-2 h-3 w-3" />
                                                Change Avatar
                                            </Button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                        <div className="flex-1 space-y-4 w-full">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Display Name</label>
                                                <Input
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Bio</label>
                                                <textarea
                                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                    value={formData.bio}
                                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                    placeholder="Tell us about yourself..."
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Country</label>
                                                <Input
                                                    value={formData.country}
                                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                                    placeholder="India"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button onClick={handleSave} disabled={isLoading}>
                                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'gameids' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Game IDs</CardTitle>
                                    <CardDescription>Link your game accounts for tournament verification.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500" />
                                            Valorant (Riot ID)
                                        </label>
                                        <Input
                                            value={formData.riotId}
                                            onChange={(e) => setFormData({ ...formData, riotId: e.target.value })}
                                            placeholder="Name#Tag"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                            PUBG
                                        </label>
                                        <Input
                                            value={formData.pubgId}
                                            onChange={(e) => setFormData({ ...formData, pubgId: e.target.value })}
                                            placeholder="PUBG account name"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                                            BGMI
                                        </label>
                                        <Input
                                            value={formData.bgmiId}
                                            onChange={(e) => setFormData({ ...formData, bgmiId: e.target.value })}
                                            placeholder="BGMI player ID"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                                            Free Fire
                                        </label>
                                        <Input
                                            value={formData.freeFireId}
                                            onChange={(e) => setFormData({ ...formData, freeFireId: e.target.value })}
                                            placeholder="Free Fire UID (10-12 digits)"
                                        />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button onClick={handleSave} disabled={isLoading}>
                                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Game IDs'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'account' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Account Settings</CardTitle>
                                    <CardDescription>Manage your email and authentication.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Email Address</label>
                                        <div className="flex gap-4">
                                            <div className="relative flex-1">
                                                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    className="pl-9 bg-muted"
                                                    value={formData.email}
                                                    readOnly
                                                />
                                            </div>
                                            <Badge variant="secondary" className="h-10 px-4 flex items-center">Verified</Badge>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <h3 className="text-lg font-medium mb-4">Delete Account</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Permanently remove your account and all data from Protocol. This action is not reversible.
                                        </p>
                                        <Button variant="destructive">Delete Personal Account</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'notifications' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notification Preferences</CardTitle>
                                    <CardDescription>Control what notifications you receive.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {[
                                        { label: 'Tournament Reminders', desc: 'Get notified 30 minutes before a tournament starts', checked: true },
                                        { label: 'Team Invites', desc: 'Receive notifications when someone invites you to a team', checked: true },
                                        { label: 'Wallet Updates', desc: 'Alerts for deposits, withdrawals, and winnings', checked: true },
                                        { label: 'Promotional Offers', desc: 'Special deals and referral bonuses', checked: false },
                                    ].map((pref, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border">
                                            <div>
                                                <p className="text-sm font-medium">{pref.label}</p>
                                                <p className="text-xs text-muted-foreground">{pref.desc}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked={pref.checked} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'security' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Security Settings</CardTitle>
                                    <CardDescription>Manage your password and two-factor authentication.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Current Password</label>
                                            <Input type="password" placeholder="Enter current password" />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">New Password</label>
                                            <Input type="password" placeholder="Enter new password" />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Confirm New Password</label>
                                            <Input type="password" placeholder="Confirm new password" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button>Update Password</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
