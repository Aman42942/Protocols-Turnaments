"use client";
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trophy, AlertCircle, Loader2, Shield, Mail, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'credentials' | 'otp' | '2fa'>('credentials');
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [twoFACode, setTwoFACode] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const router = useRouter();

    // Resend cooldown timer
    React.useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleLogin = (data: any) => {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Add Secure flag for production HTTPS
        const isProduction = window.location.protocol === 'https:';
        document.cookie = `token=${data.access_token}; path=/; max-age=86400; SameSite=Lax${isProduction ? '; Secure' : ''}`;
        window.dispatchEvent(new Event('auth-change'));
        if (data.user.role === 'ADMIN' || data.user.role === 'SUPERADMIN') {
            router.push('/admin');
        } else {
            router.push('/');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const data = response.data;

            if (data.requiresVerification) {
                router.push(`/verify-email?email=${encodeURIComponent(email)}`);
                return;
            }

            if (data.requiresOTP) {
                setStep('otp');
                setResendCooldown(60);
                return;
            }

            if (data.requires2FA) {
                setStep('2fa');
                return;
            }

            if (data.access_token) {
                handleLogin(data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    // OTP Input Handling
    const handleOTPChange = (index: number, value: string) => {
        if (value.length > 1) value = value[value.length - 1];
        if (!/^\d*$/.test(value)) return;
        const newCode = [...otpCode];
        newCode[index] = value;
        setOtpCode(newCode);
        setError('');
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOTPPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newCode = [...otpCode];
        for (let i = 0; i < pasted.length; i++) newCode[i] = pasted[i];
        setOtpCode(newCode);
    };

    const handleVerifyOTP = async () => {
        const code = otpCode.join('');
        if (code.length !== 6) { setError('Enter the complete 6-digit code'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/verify-otp', { email, code });
            if (res.data.access_token) handleLogin(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;
        try {
            await api.post('/auth/resend-otp', { email });
            setResendCooldown(60);
            setOtpCode(['', '', '', '', '', '']);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend');
        }
    };

    const handleVerify2FA = async () => {
        if (twoFACode.length !== 6) { setError('Enter the 6-digit code from your authenticator'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/2fa/validate', { email, code: twoFACode });
            if (res.data.access_token) handleLogin(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid 2FA code');
        } finally {
            setLoading(false);
        }
    };

    // ========== OTP STEP ==========
    if (step === 'otp') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="space-y-1 items-center text-center">
                        <div className="bg-green-500/10 p-3 rounded-full mb-2">
                            <Mail className="w-8 h-8 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Login Verification</CardTitle>
                        <CardDescription>
                            We sent a 6-digit code to <span className="font-medium text-primary">{email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 mb-4">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}
                        <div className="flex justify-center gap-3 mb-6" onPaste={handleOTPPaste}>
                            {otpCode.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { otpRefs.current[i] = el; }}
                                    type="text" inputMode="numeric" maxLength={1}
                                    value={digit}
                                    onChange={e => handleOTPChange(i, e.target.value)}
                                    onKeyDown={e => handleOTPKeyDown(i, e)}
                                    className="w-12 h-14 text-center text-xl font-bold bg-background border-2 rounded-xl
                                        focus:outline-none focus:ring-2 focus:ring-primary transition-all
                                        border-input hover:border-primary/50"
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>
                        <Button className="w-full" onClick={handleVerifyOTP} disabled={loading || otpCode.join('').length !== 6}>
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : 'Verify & Sign In'}
                        </Button>
                        <div className="mt-4 text-center">
                            <button onClick={handleResendOTP} disabled={resendCooldown > 0}
                                className="text-primary hover:underline text-sm disabled:text-muted-foreground disabled:no-underline">
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                            </button>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <button onClick={() => { setStep('credentials'); setError(''); setOtpCode(['', '', '', '', '', '']); }}
                            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Back to login
                        </button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // ========== 2FA STEP ==========
    if (step === '2fa') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="space-y-1 items-center text-center">
                        <div className="bg-orange-500/10 p-3 rounded-full mb-2">
                            <Shield className="w-8 h-8 text-orange-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
                        <CardDescription>
                            Enter the 6-digit code from your authenticator app
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 mb-4">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}
                        <div className="mb-6">
                            <Input
                                type="text" inputMode="numeric" maxLength={6}
                                placeholder="000000"
                                value={twoFACode}
                                onChange={e => { setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                                className="text-center text-2xl tracking-[0.5em] font-mono"
                                autoFocus
                            />
                        </div>
                        <Button className="w-full" onClick={handleVerify2FA} disabled={loading || twoFACode.length !== 6}>
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : 'Verify & Sign In'}
                        </Button>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <button onClick={() => { setStep('credentials'); setError(''); setTwoFACode(''); }}
                            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Back to login
                        </button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // ========== CREDENTIALS STEP ==========
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 items-center text-center">
                    <div className="bg-primary/10 p-3 rounded-full mb-2">
                        <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription>
                        Enter your email to sign in to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Input id="email" type="email" placeholder="name@example.com" required
                                value={email} onChange={(e) => setEmail(e.target.value)} label="Email" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Input id="password" type="password" placeholder="••••••••" required
                                    value={password} onChange={(e) => setPassword(e.target.value)} label="Password" />
                            </div>
                            <div className="flex justify-end">
                                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</>
                            ) : ("Sign In")}
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" type="button" disabled={loading} onClick={() => window.location.href = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '')}/auth/google`}>
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                            Google
                        </Button>
                        <Button variant="outline" type="button" disabled={loading} onClick={() => window.location.href = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '')}/auth/facebook`}>
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="facebook" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256c0 74.5 30.2 141 79.1 188.8 33.7 32.9 79.6 54.4 130 58.7v-142h-40l-5.3-46h45.3v-35.3c0-43.9 26.1-68.5 66.4-68.5 19.3 0 39.6 1.6 39.6 1.6l-5.3 46h-21.7c-21.8 0-26.3 13.5-26.3 27v29.3h51.3l-6.8 46h-44.5v142c50.5-4.3 96.3-25.8 130-58.7C473.8 397 504 330.5 504 256z"></path></svg>
                            Facebook
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-center justify-center space-y-2">
                    <div className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-primary hover:underline font-medium">
                            Sign up
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
