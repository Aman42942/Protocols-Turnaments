"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Lock, Bell, Shield, Mail, Camera, Loader2, CheckCircle, Gamepad2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [saveMessage, setSaveMessage] = useState('');

    const [sessions, setSessions] = useState<any[]>([]);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [qrCodeData, setQrCodeData] = useState<string | null>(null);
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [isSessionsLoading, setIsSessionsLoading] = useState(false);
    const [is2FALoading, setIs2FALoading] = useState(false);

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
        dob: '',
        gender: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        profileVisibility: 'PUBLIC',
        showGameIds: true,
    });
    const [canChangeVisibility, setCanChangeVisibility] = useState(false);

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
                    dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
                    gender: user.gender || '',
                    phone: user.phone || '',
                    address: user.address || '',
                    city: user.city || '',
                    state: user.state || '',
                    pincode: user.pincode || '',
                    profileVisibility: user.profileVisibility || 'PUBLIC',
                    showGameIds: user.showGameIds !== undefined ? user.showGameIds : true,
                });
                setTwoFactorEnabled(user.twoFactorEnabled || false);
                setCanChangeVisibility(user.canChangeVisibility || false);
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
                dob: formData.dob || undefined,
                gender: formData.gender,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                profileVisibility: formData.profileVisibility,
                showGameIds: formData.showGameIds,
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

    useEffect(() => {
        if (activeTab === 'security') {
            loadSessions();
        }
    }, [activeTab]);

    const loadSessions = async () => {
        setIsSessionsLoading(true);
        try {
            const res = await api.get('/users/me/sessions');
            setSessions(res.data);
        } catch (e) {
            console.error("Failed to load sessions", e);
        } finally {
            setIsSessionsLoading(false);
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            await api.delete(`/users/me/sessions/${sessionId}`);
            setSessions(sessions.filter(s => s.id !== sessionId));
        } catch (e) {
            alert('Failed to revoke session');
        }
    };

    const start2FASetup = async () => {
        setIs2FALoading(true);
        try {
            const res = await api.post('/auth/2fa/setup');
            setQrCodeData(res.data.qrCode);
        } catch (e) {
            alert('Failed to initiate 2FA setup');
        } finally {
            setIs2FALoading(false);
        }
    };

    const verify2FASetup = async () => {
        if (!twoFactorToken) return;
        setIs2FALoading(true);
        try {
            await api.post('/auth/2fa/verify', { code: twoFactorToken });
            setTwoFactorEnabled(true);
            setQrCodeData(null);
            setTwoFactorToken('');
            setSaveMessage('2FA enabled successfully!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (e: any) {
            alert(e.response?.data?.message || 'Invalid 2FA code');
        } finally {
            setIs2FALoading(false);
        }
    };

    const disable2FA = async () => {
        const code = prompt("Enter 2FA code from your authenticator app to confirm:");
        if (!code) return;
        setIs2FALoading(true);
        try {
            await api.post('/auth/2fa/disable', { code });
            setTwoFactorEnabled(false);
            setSaveMessage('2FA disabled successfully');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (e: any) {
            alert(e.response?.data?.message || 'Invalid 2FA code');
        } finally {
            setIs2FALoading(false);
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
        <div className="min-h-screen bg-background pt-8 pb-32">
            <div className="container max-w-5xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-5xl font-black tracking-tighter italic uppercase underline decoration-primary decoration-4 underline-offset-8 mb-4">Settings</h1>
                    <p className="text-muted-foreground font-medium">Customize your Protocol identity and preferences.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sidebar / Top Navigation for Mobile */}
                    <div className="md:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
                        >
                            {[
                                { id: 'profile', icon: User, label: 'Personal Info' },
                                { id: 'security', icon: Shield, label: 'Security & Login' },
                                { id: 'privacy', icon: Lock, label: 'Privacy' },
                                { id: 'gameids', icon: Gamepad2, label: 'Game IDs' },
                                { id: 'notifications', icon: Bell, label: 'Notifications' },
                            ].map(tab => (
                                <Button
                                    key={tab.id}
                                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                                    className={cn(
                                        "justify-start min-w-[120px] md:min-w-0 rounded-2xl h-12 font-black tracking-widest uppercase text-[10px]",
                                        activeTab === tab.id ? "shadow-lg shadow-primary/20 scale-95" : "text-muted-foreground"
                                    )}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <tab.icon className="mr-2 h-4 w-4" />
                                    {tab.label}
                                </Button>
                            ))}
                        </motion.div>
                    </div>

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
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>Update your photo and detailed personal identity information.</CardDescription>
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Date of Birth</label>
                                            <Input
                                                type="date"
                                                value={formData.dob}
                                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Gender</label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                                                value={formData.gender}
                                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="MALE">Male</option>
                                                <option value="FEMALE">Female</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Phone Number</label>
                                            <Input
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+91 9876543210"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">City</label>
                                            <Input
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                placeholder="Mumbai"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">State</label>
                                            <Input
                                                value={formData.state}
                                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                placeholder="Maharashtra"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Pincode</label>
                                            <Input
                                                value={formData.pincode}
                                                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                                placeholder="400001"
                                            />
                                        </div>
                                        <div className="grid gap-2 md:col-span-2">
                                            <label className="text-sm font-medium">Full Address</label>
                                            <textarea
                                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="Enter full address details"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4 border-t">
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

                        {activeTab === 'privacy' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Privacy Settings</CardTitle>
                                    <CardDescription>Manage who can see your profile and gaming data.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Profile Visibility</label>
                                        <span className="text-xs text-muted-foreground mb-1">
                                            Control who can view your detailed profile page.
                                            {!canChangeVisibility && " (This setting is currently locked by the Administrator.)"}
                                        </span>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                                            value={formData.profileVisibility}
                                            onChange={(e) => setFormData({ ...formData, profileVisibility: e.target.value })}
                                            disabled={!canChangeVisibility}
                                        >
                                            <option value="PUBLIC">Public (Everyone)</option>
                                            <option value="FRIENDS_ONLY">Friends / Alliance Only</option>
                                            <option value="PRIVATE">Private (Only You)</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                                        <div>
                                            <p className="text-sm font-medium">Show Game IDs on Profile</p>
                                            <p className="text-xs text-muted-foreground">Allow others to see your in-game IGNs and UIDs.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.showGameIds}
                                                onChange={(e) => setFormData({ ...formData, showGameIds: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button onClick={handleSave} disabled={isLoading}>
                                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Privacy Options'}
                                        </Button>
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
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Two-Factor Authentication</CardTitle>
                                        <CardDescription>Protect your account with an extra layer of security.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                                            <div>
                                                <p className="font-bold text-foreground">Authenticator App</p>
                                                <p className="text-sm text-muted-foreground mt-1">Use an app like Google Authenticator or Authy to generate verification codes.</p>
                                                <Badge variant={twoFactorEnabled ? "default" : "secondary"} className={`mt-2 ${twoFactorEnabled ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}>
                                                    {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                                </Badge>
                                            </div>
                                            <Button
                                                variant={twoFactorEnabled ? "destructive" : "default"}
                                                onClick={twoFactorEnabled ? disable2FA : start2FASetup}
                                                disabled={is2FALoading}
                                            >
                                                {is2FALoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (twoFactorEnabled ? 'Disable' : 'Enable 2FA')}
                                            </Button>
                                        </div>

                                        {qrCodeData && !twoFactorEnabled && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-6 p-6 border border-border rounded-xl bg-card flex flex-col items-center text-center">
                                                <h3 className="font-bold mb-2">Scan QR Code</h3>
                                                <p className="text-sm text-muted-foreground mb-6">Scan this QR code with your authenticator app to link your account.</p>
                                                <div className="bg-white p-2 rounded-xl mb-6">
                                                    <img src={qrCodeData} alt="2FA QR Code" className="w-48 h-48" />
                                                </div>
                                                <div className="w-full max-w-xs space-y-4">
                                                    <Input
                                                        placeholder="Enter 6-digit code to verify"
                                                        value={twoFactorToken}
                                                        onChange={(e) => setTwoFactorToken(e.target.value)}
                                                        className="text-center tracking-widest text-lg font-bold font-orbitron"
                                                        maxLength={6}
                                                    />
                                                    <Button className="w-full" onClick={verify2FASetup} disabled={is2FALoading || twoFactorToken.length < 6}>
                                                        {is2FALoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify & Enable'}
                                                    </Button>
                                                    <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setQrCodeData(null)}>Cancel</Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Active Sessions</CardTitle>
                                        <CardDescription>Manage your logged-in devices across all platforms. Auto-logout is triggered after 60 minutes of inactivity.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {isSessionsLoading ? (
                                            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                                        ) : (
                                            <div className="space-y-4">
                                                {sessions.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground text-center py-4">No active sessions found.</p>
                                                ) : (
                                                    sessions.map((session) => (
                                                        <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-muted/10 gap-4">
                                                            <div>
                                                                <p className="font-bold text-sm truncate max-w-[200px] sm:max-w-md">{session.device || 'Unknown Browser/Device'}</p>
                                                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                                    <span>{session.ipAddress}</span>
                                                                    <span>•</span>
                                                                    <span>Last active: {new Date(session.lastActive).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                                                                onClick={() => handleRevokeSession(session.id)}
                                                            >
                                                                Revoke Access
                                                            </Button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
