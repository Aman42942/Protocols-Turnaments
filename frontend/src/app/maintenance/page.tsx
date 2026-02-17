'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Hammer, ShieldAlert, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function MaintenancePage() {
    const [email, setEmail] = useState('');
    const [notified, setNotified] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ h: 2, m: 45, s: 0 });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.s > 0) return { ...prev, s: prev.s - 1 };
                if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
                if (prev.h > 0) return { ...prev, h: prev.h - 1, m: 59, s: 59 };
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleNotify = (e: React.FormEvent) => {
        e.preventDefault();
        setNotified(true);
        // Mock API call
        setTimeout(() => setNotified(false), 3000);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-primary selection:text-black">

            {/* Background Grid & Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black via-transparent to-black pointer-events-none"></div>

            {/* Animated Glow Orbs */}
            <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10"
            />
            <motion.div
                animate={{ opacity: [0.3, 0.5, 0.3], scale: [1.2, 1, 1.2] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] -z-10"
            />

            <div className="container max-w-2xl px-4 relative z-10 text-center">

                {/* Icon Animation */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-24 h-24 bg-primary/10 border-2 border-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)]"
                >
                    <Hammer className="w-10 h-10 text-primary animate-pulse" />
                </motion.div>

                {/* Main Text */}
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500"
                >
                    SYSTEM UPGRADE
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg mx-auto"
                >
                    We are currently deploying a massive update to enhance your gaming experience. Servers will be back online shortly.
                </motion.p>

                {/* Countdown (Mock) */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-center gap-4 mb-10"
                >
                    {[
                        { label: 'Hours', value: timeLeft.h },
                        { label: 'Minutes', value: timeLeft.m },
                        { label: 'Seconds', value: timeLeft.s }
                    ].map((item, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 min-w-[100px] backdrop-blur-sm">
                            <div className="text-3xl font-mono font-bold text-primary">
                                {item.value.toString().padStart(2, '0')}
                            </div>
                            <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                                {item.label}
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Notify Form */}
                <motion.form
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onSubmit={handleNotify}
                    className="max-w-md mx-auto relative"
                >
                    <div className="flex gap-2">
                        <Input
                            type="email"
                            placeholder="Enter your email for updates"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Button type="submit" className="h-12 px-6 font-bold" disabled={notified}>
                            {notified ? 'Subscribed!' : 'Notify Me'}
                            {!notified && <ChevronRight className="w-4 h-4 ml-1" />}
                        </Button>
                    </div>
                </motion.form>

                {/* Footer Status */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-16 flex items-center justify-center gap-6 text-sm text-gray-500"
                >
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Database Migration: <span className="text-yellow-500">In Progress</span></span>
                    </div>
                    <div className="w-1 h-1 bg-gray-700 rounded-full" />
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Est. Return: <span className="text-primary">18:00 UTC</span></span>
                    </div>
                </motion.div>

            </div>

            {/* Bottom Gradient Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary opacity-50"></div>
        </div>
    );
}
