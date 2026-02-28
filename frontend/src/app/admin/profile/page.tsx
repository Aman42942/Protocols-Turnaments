'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield, Key, User, Mail, Save, Loader2, CheckCircle, AlertCircle, ShieldCheck, Target, Lock, Camera } from 'lucide-react';
import api from '@/lib/api';
import { getRoleColor, ROLE_LABELS, UserRole } from '@/lib/roles';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Password Form State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passLoading, setPassLoading] = useState(false);
    const [passMessage, setPassMessage] = useState('');
    const [passError, setPassError] = useState('');

    // Avatar Form State
    const [avatarUrl, setAvatarUrl] = useState('');
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarMessage, setAvatarMessage] = useState('');
    const [avatarError, setAvatarError] = useState('');
    const [showAvatarInput, setShowAvatarInput] = useState(false);

    useEffect(() => {
        // First load from localStorage for immediate display
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setAvatarUrl(parsed.avatar || '');
        }
        // Then fetch full profile from API (includes avatar field)
        api.get('/users/me')
            .then(res => {
                setUser(res.data);
                setAvatarUrl(res.data.avatar || '');
                // Also update localStorage with latest info
                const stored = localStorage.getItem('user');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    localStorage.setItem('user', JSON.stringify({ ...parsed, ...res.data }));
                }
            })
            .catch(() => { /* silent - localStorage fallback already set */ })
            .finally(() => setLoading(false));
    }, []);

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassMessage('');
        setPassError('');

        if (newPassword.length < 8) {
            setPassError('Password must be at least 8 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPassError('Passwords do not match.');
            return;
        }

        setPassLoading(true);
        try {
            await api.post('/auth/set-password', { password: newPassword });
            setPassMessage('Security credentials updated successfully.');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPassError(err.response?.data?.message || 'Failed to update security credentials.');
        } finally {
            setPassLoading(false);
        }
    };

    const handleSaveAvatar = async () => {
        if (!avatarUrl.trim()) return;
        setAvatarLoading(true);
        setAvatarError('');
        setAvatarMessage('');
        try {
            const res = await api.patch('/users/me', { avatar: avatarUrl.trim() });
            setUser((prev: any) => ({ ...prev, avatar: res.data.avatar }));
            const stored = localStorage.getItem('user');
            if (stored) {
                localStorage.setItem('user', JSON.stringify({ ...JSON.parse(stored), avatar: res.data.avatar }));
            }
            setAvatarMessage('Profile image updated!');
            setShowAvatarInput(false);
        } catch (err: any) {
            setAvatarError('Failed to update avatar.');
        } finally {
            setAvatarLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* ─── HUD HEADER ─────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 relative"
            >
                <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5">
                    <ShieldCheck className="w-7 h-7 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-black italic tracking-tight uppercase flex items-center gap-2">
                        Admin Profile <span className="text-primary">.</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <motion.div
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-green-500"
                        />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Secure Access Node : {user?.id?.slice(-8).toUpperCase()}</p>
                    </div>
                </div>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-5">
                {/* ─── LEFT: PROFILE INFO ─────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-2 space-y-6"
                >
                    <Card className="border-border/40 bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden relative">
                        {/* HUD corner decorations */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/30 pointer-events-none" />
                        <CardHeader className="pb-0 pt-8 flex flex-col items-center">
                            <div className="rgb-avatar-border w-28 h-28 cursor-pointer" onClick={() => setShowAvatarInput(v => !v)}>
                                <div className="w-full h-full rounded-full bg-muted/50 border-0 flex items-center justify-center relative overflow-hidden">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12 text-muted-foreground/30" />
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>
                            {showAvatarInput && (
                                <div className="w-full px-2 mt-3 space-y-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Paste Image URL</p>
                                    <Input
                                        value={avatarUrl}
                                        onChange={e => setAvatarUrl(e.target.value)}
                                        placeholder="https://example.com/photo.jpg"
                                        className="text-xs rounded-xl"
                                        onClick={e => e.stopPropagation()}
                                    />
                                    {avatarError && <p className="text-[10px] text-red-500 text-center">{avatarError}</p>}
                                    {avatarMessage && <p className="text-[10px] text-green-500 text-center">{avatarMessage}</p>}
                                    <Button onClick={(e) => { e.stopPropagation(); handleSaveAvatar(); }} disabled={avatarLoading} className="w-full h-8 text-xs rounded-xl">
                                        {avatarLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save Photo'}
                                    </Button>
                                </div>
                            )}
                            <CardTitle className="mt-4 text-xl font-black uppercase tracking-tight italic">{user?.name || 'ADMIN'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pb-8 px-8">
                            <div className="text-center">
                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg ${getRoleColor(user?.role || 'USER')}`}>
                                    {ROLE_LABELS[user?.role as UserRole] || user?.role} ACCESS
                                </span>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-border/20">
                                <div className="space-y-1.5">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-1">Network Identity</p>
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20 border border-border/40">
                                        <Mail className="w-4 h-4 text-primary/60" />
                                        <p className="text-xs font-bold truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-1">Clearance Level</p>
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20 border border-border/40">
                                        <Shield className="w-4 h-4 text-primary/60" />
                                        <p className="text-xs font-bold">Encrypted - {user?.role}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <HUDCard color="#10b981" className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500/10">
                                <Target className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Session Secure</p>
                                <p className="text-[9px] text-muted-foreground">Admin Protocol v4.2 Active</p>
                            </div>
                        </div>
                    </HUDCard>
                </motion.div>

                {/* ─── RIGHT: SECURITY SETTINGS ───────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="md:col-span-3"
                >
                    <Card className="border-border/40 bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden relative h-full">
                        {/* Corner HUD */}
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/30 pointer-events-none" />
                        <CardHeader className="px-8 pt-8">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 rounded-xl bg-primary/10">
                                    <Key className="w-5 h-5 text-primary" />
                                </div>
                                <CardTitle className="text-xl font-black italic tracking-tight uppercase">Security Override</CardTitle>
                            </div>
                            <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-11">
                                Update your administrative access credentials and password.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <form onSubmit={handleSetPassword} className="space-y-6">
                                <AnimatePresence mode="wait">
                                    {passError && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-sm text-destructive font-bold italic"
                                        >
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            {passError}
                                        </motion.div>
                                    )}
                                    {passMessage && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3 text-sm text-primary font-bold italic"
                                        >
                                            <CheckCircle className="h-4 w-4 shrink-0" />
                                            {passMessage}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="grid gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <Lock className="w-3 h-3" /> New Access Key
                                            </label>
                                            <span className="text-[8px] text-muted-foreground/60 font-bold uppercase tracking-tighter">Min 8 Chars</span>
                                        </div>
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="h-12 rounded-2xl border-border/40 bg-background/50 px-4 font-bold"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center px-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <ShieldCheck className="w-3 h-3" /> Confirm Access Key
                                            </label>
                                        </div>
                                        <Input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="h-12 rounded-2xl border-border/40 bg-background/50 px-4 font-bold"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 mt-4 group"
                                    disabled={passLoading}
                                >
                                    {passLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary-foreground" />
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                                            Update Admin Protocol
                                        </>
                                    )}
                                </Button>

                                <div className="pt-4 border-t border-border/20">
                                    <p className="text-[9px] text-muted-foreground leading-relaxed italic text-center">
                                        Changing your password will immediately secure your administrative node.
                                        Protocol ensures hybrid login capability is maintained after update.
                                    </p>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

// ─── HUD Corner Brackets (Local Helper) ──────────────────────────────────────
function HUDCard({ children, color, className = '' }: { children: React.ReactNode; color: string; className?: string }) {
    return (
        <div className={`relative rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md overflow-hidden group ${className}`}>
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l rounded-tl-sm opacity-40 transition-opacity group-hover:opacity-100" style={{ borderColor: color }} />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r rounded-tr-sm opacity-40 transition-opacity group-hover:opacity-100" style={{ borderColor: color }} />
            {children}
        </div>
    );
}
