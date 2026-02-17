
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import api from '@/lib/api';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Authenticate with backend
            const res = await api.post('/auth/login', { email, password });
            const { access_token } = res.data;

            // 2. Decode token to check role immediately
            // Payload structure: { sub: userId, email: ..., role: ... }
            const payload = JSON.parse(atob(access_token.split('.')[1]));

            // Import hierarchy from lib (Dynamic import or hardcoded map if import fails in client component)
            // Simpler: Just check against the known list of admin roles
            const ADMIN_ROLES = [
                'ULTIMATE_ADMIN', 'SUPERADMIN',
                'SENIOR_CHIEF_SECURITY_ADMIN', 'CHIEF_DEVELOPMENT_ADMIN',
                'CHIEF_SECURITY_ADMIN', 'VICE_CHIEF_SECURITY_ADMIN',
                'SENIOR_ADMIN', 'JUNIOR_ADMIN', 'EMPLOYEE', 'ADMIN'
            ];

            if (!ADMIN_ROLES.includes(payload.role)) {
                setError('Access Denied. You do not have administrative privileges.');
                setLoading(false);
                return;
            }

            // 3. Store token and redirect
            localStorage.setItem('token', access_token);
            // Also store user info if needed
            const user = {
                id: payload.sub,
                email: payload.email,
                role: payload.role,
                name: payload.name || 'Admin'
            };
            localStorage.setItem('user', JSON.stringify(user));

            // Set cookie for Middleware
            document.cookie = `token=${access_token}; path=/; max-age=86400; SameSite=Lax`;

            // 4. Redirect to Admin Dashboard
            router.push('/admin');

        } catch (err: any) {
            console.error('Login failed:', err);
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black/95 text-white p-4">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <Card className="w-full max-w-md border-red-900/30 bg-black/80 backdrop-blur-xl relative z-10 shadow-2xl shadow-red-900/10">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                        <Lock className="h-6 w-6 text-red-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Admin Portal</CardTitle>
                    <CardDescription>Restricted access. Authorized personnel only.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm text-red-400">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <Input
                                type="email"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-black/50 border-white/10 focus:border-red-500/50 transition-colors"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-black/50 border-white/10 focus:border-red-500/50 transition-colors"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" /> Secure Login
                                </span>
                            )}
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-black px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
                                onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
                            >
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                                Google
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
                                onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/facebook`}
                            >
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="facebook" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256c0 125 93 229 208 248v-175h-63v-72h63v-55c0-62 38-96 94-96 27 0 49 5 56 6v65h-38c-30 0-36 14-36 35v45h72l-9 72h-63v175c115-19 208-123 208-248z"></path></svg>
                                Facebook
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-xs text-muted-foreground">
                        <p>IP Address Logged & Monitored</p>
                        <p className="mt-1">Unauthorized access attempts will be reported.</p>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
