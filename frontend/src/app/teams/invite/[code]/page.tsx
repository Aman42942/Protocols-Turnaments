'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Loader2, Users, Crown, Gamepad2, ShieldCheck,
    AlertCircle, CheckCircle, Zap, Shield,
    ChevronRight, Terminal, Globe, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamData {
    id: string;
    name: string;
    logo?: string;
    gameType: string;
    maxMembers: number;
    members: { role: string; user: { id: string; name: string; avatar?: string } }[];
    _count: { members: number };
}

export default function TeamInvitePage() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    const [team, setTeam] = useState<TeamData | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchTeam();
    }, [code]);

    const fetchTeam = async () => {
        try {
            const res = await api.get(`/teams/invite/${code}`);
            setTeam(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid or Expired Invite Link');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        setJoining(true);
        setError(null);
        try {
            await api.post(`/teams/invite/${code}/join`);
            setSuccess(true);
            setTimeout(() => {
                router.push(`/dashboard/teams/${team?.id}`);
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to sync with the hub');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.05)_0,transparent_70%)] animate-pulse" />
                <div className="relative z-10 flex flex-col items-center">
                    <Loader2 className="w-20 h-20 text-primary animate-spin mb-8" />
                    <p className="text-primary font-mono tracking-[0.3em] uppercase text-sm animate-pulse">Decrypting Invite...</p>
                </div>
            </div>
        );
    }

    if (error && !team) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center font-mono">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full p-8 border border-destructive/30 bg-destructive/5 rounded-[2rem] space-y-6"
                >
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto border border-destructive/30">
                        <Lock className="h-8 w-8 text-destructive" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-foreground uppercase tracking-tighter">Access Denied</h1>
                        <p className="text-muted-foreground mt-2 text-sm">{error}</p>
                    </div>
                    <Button
                        onClick={() => router.push('/')}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-black h-12 uppercase tracking-widest rounded-xl"
                    >
                        Return to Sector
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden pt-12 pb-24">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full opacity-50 dark:opacity-20" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full opacity-50 dark:opacity-20" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20 brightness-150 contrast-150 mix-blend-overlay" />
            </div>

            <div className="container max-w-6xl mx-auto px-4 relative z-10">
                <AnimatePresence mode="wait">
                    {success ? (
                        <motion.div
                            key="success"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex flex-col items-center justify-center py-24 text-center space-y-8"
                        >
                            <div className="relative">
                                <motion.div
                                    className="w-32 h-32 rounded-full bg-green-500/10 border-2 border-green-500/50 flex items-center justify-center shadow-[0_0_50px_-10px_rgba(34,197,94,0.5)]"
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                >
                                    <CheckCircle className="w-16 h-16 text-green-500" />
                                </motion.div>
                                <Zap className="absolute -top-2 -right-2 text-primary w-10 h-10 animate-bounce" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-5xl font-black uppercase tracking-tighter">Welcome to the Hub</h1>
                                <p className="text-green-500 font-mono tracking-widest uppercase text-xs">Access Granted • Redirecting to Team Base...</p>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Left Side: Team Branding */}
                            <motion.div
                                initial={{ x: -30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <Badge className="bg-primary text-primary-foreground font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] text-[10px] border-none shadow-lg shadow-primary/20">
                                        Incoming Transmission
                                    </Badge>
                                    <div>
                                        <h1 className="text-6xl sm:text-7xl font-black uppercase leading-[0.9] tracking-tighter italic">
                                            Join <span className="text-primary block">{team?.name}</span>
                                        </h1>
                                        <p className="text-muted-foreground font-mono text-sm mt-6 uppercase tracking-widest max-w-sm">
                                            You've been scouted to join this elite squad of protocol warriors.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <div className="px-6 py-4 bg-card/50 border border-border rounded-2xl backdrop-blur-md flex flex-col gap-1">
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Sector</span>
                                        <span className="text-foreground font-bold flex items-center gap-2">
                                            <Gamepad2 className="w-4 h-4 text-primary" />
                                            {team?.gameType?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="px-6 py-4 bg-card/50 border border-border rounded-2xl backdrop-blur-md flex flex-col gap-1">
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Population</span>
                                        <span className="text-foreground font-bold flex items-center gap-2">
                                            <Users className="w-4 h-4 text-primary" />
                                            {team?._count.members}/{team?.maxMembers} Filled
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 bg-primary/5 border border-primary/20 rounded-[2.5rem] flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                        <Globe className="w-8 h-8 text-primary-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-foreground font-black uppercase text-sm">Squad Captain</p>
                                        <p className="text-primary font-mono text-xs tracking-widest lowercase">
                                            @{team?.members?.find(m => m.role === 'LEADER')?.user.name.toLowerCase().replace(/\s+/g, '_') || 'unknown_officer'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Right Side: Roster & CTA */}
                            <motion.div
                                initial={{ x: 30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="relative"
                            >
                                <div className="absolute -inset-4 bg-primary/5 blur-2xl rounded-[3rem] -z-10" />
                                <div className="bg-card/80 border border-border rounded-[3rem] p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                                    {/* Terminal-like header */}
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Terminal className="w-3 h-3" />
                                            <span className="text-[9px] font-mono uppercase tracking-[0.2em]">{team?.id.slice(0, 8)}@base_hub</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-foreground font-black uppercase tracking-widest text-xs">Current Squadron</h3>

                                        <div className="grid grid-cols-1 gap-3">
                                            {(team?.members || []).map((member) => (
                                                <div key={member.user.id} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors group">
                                                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary group-hover:scale-110 transition-transform">
                                                        {member.user.avatar ? <img src={member.user.avatar} className="w-full h-full rounded-xl object-cover" /> : member.user.name[0]}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-foreground text-base">{member.user.name}</p>
                                                        <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest">{member.role}</p>
                                                    </div>
                                                    {member.role === 'LEADER' && <Crown className="w-5 h-5 text-primary" />}
                                                </div>
                                            ))}

                                            {Array.from({ length: Math.max(0, (team?.maxMembers || 0) - (team?._count.members || 0)) }).map((_, i) => (
                                                <div key={`v-${i}`} className="p-4 rounded-2xl border border-dashed border-border flex items-center justify-center bg-muted/10 group hover:border-primary/20 transition-all cursor-default overflow-hidden">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-lg bg-card border border-border flex items-center justify-center">
                                                            <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
                                                        </div>
                                                        <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest group-hover:text-muted-foreground transition-colors">Awaiting Recruit...</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-6 space-y-4">
                                            {error && (
                                                <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm font-bold">
                                                    <AlertCircle className="w-5 h-5" />
                                                    {error}
                                                </div>
                                            )}

                                            <button
                                                onClick={handleJoin}
                                                disabled={joining || (team?._count.members || 0) >= (team?.maxMembers || 0)}
                                                className="w-full h-16 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground rounded-3xl font-black text-lg uppercase tracking-tight transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center group"
                                            >
                                                {joining ? (
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <span>Initiate Join Protocol</span>
                                                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                )}
                                            </button>

                                            <div className="flex items-center justify-center gap-6 pt-4 border-t border-border grayscale opacity-30">
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="w-3 h-3 text-foreground" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-foreground">Verified Sector</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Zap className="w-3 h-3 text-foreground" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-foreground">Instant Sync</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
