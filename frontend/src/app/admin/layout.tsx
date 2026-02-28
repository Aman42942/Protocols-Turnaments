'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldAlert, Menu, ShieldCheck, Zap } from 'lucide-react';
import { ADMIN_ROLES } from '@/lib/roles';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (!token || !userStr) { setStatus('unauthorized'); router.replace('/login'); return; }
        try {
            const userData = JSON.parse(userStr);
            if (!ADMIN_ROLES.includes(userData.role)) { setStatus('unauthorized'); router.replace('/'); return; }
            setUser(userData);
            setStatus('authorized');
        } catch { setStatus('unauthorized'); router.replace('/login'); }
    }, [router]);

    if (status === 'loading') return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6">
                {/* Animated rings */}
                <div className="relative w-24 h-24">
                    {[0, 1, 2].map(i => (
                        <motion.div key={i} className="absolute inset-0 rounded-full border-2 border-primary/30"
                            animate={{ scale: [1, 1.6 + i * 0.4], opacity: [0.6, 0] }}
                            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4 }}
                        />
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
                            <ShieldCheck className="w-8 h-8 text-primary-foreground" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm font-medium tracking-wider">VERIFYING ACCESS...</p>
                </div>
            </motion.div>
        </div>
    );

    if (status === 'unauthorized') return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4 text-center p-8">
                <div className="w-20 h-20 rounded-3xl bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center">
                    <ShieldAlert className="h-10 w-10 text-destructive" />
                </div>
                <div>
                    <h2 className="text-2xl font-black">ACCESS DENIED</h2>
                    <p className="text-muted-foreground mt-1">You don&apos;t have permission to access the admin panel.</p>
                </div>
            </motion.div>
        </div>
    );

    return (
        <div className="flex min-h-screen w-full bg-background text-foreground">
            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
                {/* ── MOBILE GAMING HEADER ─────────────────────────── */}
                <header className="sticky top-0 z-30 md:hidden">
                    <div className="bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3 relative overflow-hidden">
                        {/* Animated top border glow */}
                        <motion.div
                            className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                            animate={{ opacity: [0.3, 0.8, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />

                        {/* Corner brackets */}
                        <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-primary/50" />
                        <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-primary/50" />

                        {/* Menu button */}
                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setIsSidebarOpen(true)}
                            className="w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center relative z-10">
                            <Menu className="w-4 h-4 text-muted-foreground" />
                        </motion.button>

                        {/* Logo */}
                        <div className="flex items-center gap-2 flex-1 relative z-10">
                            <motion.div
                                whileTap={{ rotate: 15 }}
                                className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                                <ShieldCheck className="w-4 h-4 text-primary-foreground" />
                            </motion.div>
                            <div>
                                <p className="font-black text-foreground text-xs leading-none tracking-widest">ADMIN</p>
                                <p className="text-[8px] text-primary font-bold tracking-widest leading-none mt-0.5">CONTROL PANEL</p>
                            </div>
                        </div>

                        {/* Status + controls */}
                        <div className="flex items-center gap-2 relative z-10">
                            <motion.div
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-[9px] font-black text-green-500 uppercase tracking-wider">Live</span>
                            </motion.div>
                            <ThemeToggle />
                            <Link href="/admin/profile">
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-[10px] shadow-lg shadow-primary/30 cursor-pointer"
                                >
                                    {(user?.name && user.name !== 'User' ? user.name.charAt(0) : user?.email?.charAt(0) || 'A').toUpperCase()}
                                </motion.div>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* ── PAGE CONTENT ─────────────────────────────────── */}
                <main className="flex-1 w-full p-4 sm:p-6 md:p-8 pb-24 md:pb-8 bg-muted/5">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={typeof window !== 'undefined' ? window.location.pathname : 'page'}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
