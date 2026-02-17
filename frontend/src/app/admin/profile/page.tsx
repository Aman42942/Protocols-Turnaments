'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield, Key, User, Mail, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { getRoleColor, ROLE_LABELS, UserRole } from '@/lib/roles';

export default function AdminProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Password Form State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passLoading, setPassLoading] = useState(false);
    const [passMessage, setPassMessage] = useState('');
    const [passError, setPassError] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
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
            setPassMessage('Password updated successfully! You can now login with email/password.');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPassError(err.response?.data?.message || 'Failed to update password.');
        } finally {
            setPassLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Profile</h1>
                <p className="text-muted-foreground">Manage your account settings and security.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Info Card */}
                <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Account Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                    {user?.name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <p className="font-medium">{user?.name}</p>
                                    <p className="text-xs text-muted-foreground">Display Name</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</label>
                            <div className="flex items-center gap-2 p-2 rounded border border-border/50 bg-background/50 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {user?.email}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role & Permissions</label>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleColor(user?.role || 'USER')}`}>
                                    <Shield className="inline h-3 w-3 mr-1" />
                                    {ROLE_LABELS[user?.role as UserRole] || user?.role}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Your role determines your access level within the admin panel.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Password Management Card */}
                <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-primary" />
                            Security Settings
                        </CardTitle>
                        <CardDescription>
                            Set a password to enable "Hybrid Login" (Google + Email/Password).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSetPassword} className="space-y-4">
                            {passError && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm text-red-500">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    {passError}
                                </div>
                            )}
                            {passMessage && (
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-sm text-green-500">
                                    <CheckCircle className="h-4 w-4 shrink-0" />
                                    {passMessage}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">New Password</label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min. 8 characters"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confirm Password</label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter password"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={passLoading}
                            >
                                {passLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Update Password
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
