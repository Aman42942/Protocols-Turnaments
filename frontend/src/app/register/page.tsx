"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trophy, CheckCircle, Smartphone, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        ign: '',
        gameId: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const res = await api.post('/auth/register', {
                email: formData.email,
                password: formData.password,
                name: formData.name,
            });

            if (res.data.requiresVerification) {
                // Redirect to email verification page
                router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
                return;
            }

            setShowSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader className="space-y-1 items-center text-center">
                    <div className="bg-primary/10 p-3 rounded-full mb-2">
                        <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                    <CardDescription>
                        Enter your details below to create your account and start competing
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
                            <Input
                                id="name"
                                name="name"
                                placeholder="John Doe"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                label="Full Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                label="Email"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                label="Password"
                            />
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                label="Confirm Password"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                id="ign"
                                name="ign"
                                placeholder="Viper#123"
                                required
                                value={formData.ign}
                                onChange={handleChange}
                                label="In-Game Name"
                            />
                            <Input
                                id="gameId"
                                name="gameId"
                                placeholder="512344"
                                required
                                value={formData.gameId}
                                onChange={handleChange}
                                label="Game ID"
                            />
                        </div>

                        <div className="text-xs text-muted-foreground">
                            By clicking continue, you agree to our <Link href="/terms" className="underline hover:text-primary">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
                        </div>

                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <div className="px-6 pb-6">
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
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
                </div>
                <CardFooter className="justify-center">
                    <div className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Sign in
                        </Link>
                    </div>
                </CardFooter>
            </Card>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-card border border-border p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Registration Successful!</h3>
                            <p className="text-muted-foreground mb-6">
                                Your account has been created. You can now login.
                            </p>

                            <Button
                                className="w-full"
                                onClick={() => router.push('/login')}
                            >
                                Go to Login
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
