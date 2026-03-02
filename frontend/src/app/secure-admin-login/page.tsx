
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield, Lock, AlertCircle, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import api from '@/lib/api';

const ADMIN_ROLES = [
    'ULTIMATE_ADMIN', 'SUPERADMIN',
    'SENIOR_CHIEF_SECURITY_ADMIN', 'CHIEF_DEVELOPMENT_ADMIN',
    'CHIEF_SECURITY_ADMIN', 'VICE_CHIEF_SECURITY_ADMIN',
    'SENIOR_ADMIN', 'JUNIOR_ADMIN', 'EMPLOYEE', 'ADMIN'
];

export default function AdminLoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<'credentials' | 'otp' | '2fa'>('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [twoFACode, setTwoFACode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const finalizeLogin = (data: any) => {
        const payload = JSON.parse(atob(data.access_token.split('.')[1]));

        if (!ADMIN_ROLES.includes(payload.role)) {
            setError('Access Denied. Administrative privileges required.');
            setLoading(false);
            return;
        }

        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify({
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            name: payload.name || 'Admin'
        }));

        // Set cookie for Middleware
        const isProduction = window.location.protocol === 'https:';
        document.cookie = `token=${data.access_token}; path=/; max-age=86400; SameSite=Lax${isProduction ? '; Secure' : ''}`;

        window.dispatchEvent(new Event('auth-change'));
        router.push('/admin');
    };

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/login', { email, password });
            const data = res.data;

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
                finalizeLogin(data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        const code = otpCode.join('');
        if (code.length !== 6) return;
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/verify-otp', { email, code });
            if (res.data.access_token) finalizeLogin(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        if (twoFACode.length !== 6) return;
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/2fa/validate', { email, code: twoFACode });
            if (res.data.access_token) finalizeLogin(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid 2FA code');
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
            setError('Failed to resend code');
        }
    };

    const handleOTPChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newCode = [...otpCode];
        newCode[index] = value.slice(-1);
        setOtpCode(newCode);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    // UI Rendering Logic based on Step
    return (
        <div className="min-h-screen flex items-center justify-center bg-black/95 text-white p-4 overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 blur-[120px] rounded-full" />

            <Card className="w-full max-w-md border-red-900/30 bg-black/80 backdrop-blur-xl relative z-10 shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                        {step === 'otp' ? <Mail className="h-6 w-6 text-red-500" /> : <Lock className="h-6 w-6 text-red-500" />}
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {step === 'credentials' && 'Admin Portal'}
                        {step === 'otp' && 'Verify Email'}
                        {step === '2fa' && '2FA Required'}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        {step === 'credentials' && 'Restricted access. Authorized personnel only.'}
                        {step === 'otp' && `Enter the 6-digit code sent to ${email}`}
                        {step === '2fa' && 'Provide your authenticator app code.'}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {error && (
                        <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {step === 'credentials' && (
                        <form onSubmit={handleInitialSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Security Email</label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-black/50 border-white/10 focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Access Password</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-black/50 border-white/10 focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request Access'}
                            </Button>
                        </form>
                    )}

                    {step === 'otp' && (
                        <div className="space-y-6">
                            <div className="flex justify-center gap-3">
                                {otpCode.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={el => { otpRefs.current[i] = el; }}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handleOTPChange(i, e.target.value)}
                                        onKeyDown={e => handleOTPKeyDown(i, e)}
                                        className="w-12 h-14 text-center text-xl font-bold bg-black/50 border-2 border-white/10 rounded-xl focus:border-red-500 focus:outline-none transition-all"
                                    />
                                ))}
                            </div>
                            <Button className="w-full bg-red-600" onClick={handleVerifyOTP} disabled={loading || otpCode.join('').length !== 6}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Identity'}
                            </Button>
                            <button onClick={handleResendOTP} disabled={resendCooldown > 0} className="w-full text-sm text-gray-500 hover:text-red-400 disabled:opacity-50">
                                {resendCooldown > 0 ? `Retry in ${resendCooldown}s` : 'Resend Security Code'}
                            </button>
                        </div>
                    )}

                    {step === '2fa' && (
                        <div className="space-y-6">
                            <Input
                                type="text"
                                maxLength={6}
                                placeholder="000 000"
                                value={twoFACode}
                                onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="text-center text-2xl tracking-[0.5em] font-mono bg-black/50 border-white/10"
                            />
                            <Button className="w-full bg-red-600" onClick={handleVerify2FA} disabled={loading || twoFACode.length !== 6}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Authorize'}
                            </Button>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-4 text-center pb-8">
                    {step !== 'credentials' && (
                        <button onClick={() => setStep('credentials')} className="text-sm text-gray-500 hover:text-white flex items-center gap-1 mx-auto transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Return to Login
                        </button>
                    )}
                    <div className="space-y-1 text-[10px] uppercase tracking-widest text-gray-600">
                        <p>Terminal Session Encrypted</p>
                        <p>Unauthorized access is a federal offense</p>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
