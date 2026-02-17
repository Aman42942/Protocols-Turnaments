"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const res = await api.post('/auth/forgot-password', { email });
            setStatus('success');
            setMessage(res.data.message || 'If an account exists, a reset link has been sent.');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-green-500/10 p-3 rounded-full mb-4 w-fit">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                        <CardDescription>
                            We have sent a password reset link to <br />
                            <span className="font-medium text-primary">{email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground text-sm">
                        If you don&apos;t see it, check your spam folder. The link will expire in 15 minutes.
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Link href="/login" className="text-sm text-primary hover:underline flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back to login
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 items-center text-center">
                    <div className="bg-primary/10 p-3 rounded-full mb-2">
                        <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                    <CardDescription>
                        Enter your email address and we&apos;ll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {status === 'error' && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {message}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                label="Email Address"
                            />
                        </div>
                        <Button className="w-full" type="submit" disabled={status === 'loading'}>
                            {status === 'loading' ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Link...</>
                            ) : (
                                "Send Reset Link"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
