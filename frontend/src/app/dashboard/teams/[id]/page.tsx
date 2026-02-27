'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Loader2, Users, Crown, UserPlus, Trash2,
    Shield, Gamepad2, Copy, Check, ChevronLeft,
    Target, Zap, Globe, Terminal, ShieldCheck,
    MoreVertical, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamMember {
    id: string;
    role: string;
    user?: { id: string; name: string; email: string; avatar?: string };
}

interface Team {
    id: string;
    name: string;
    logo?: string;
    leaderId: string;
    inviteCode: string;
    gameType: string;
    maxMembers: number;
    members: TeamMember[];
    createdAt?: string;
    _count: { members: number };
}

export default function TeamDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const fetchData = useCallback(async () => {
        try {
            const [teamRes, userRes] = await Promise.all([
                api.get(`/teams/${id}`),
                api.get('/users/me')
            ]);
            setTeam(teamRes.data);
            setCurrentUser(userRes.data);
        } catch (err) {
            console.error('Failed to load team data:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const copyInviteLink = () => {
        if (!team) return;
        const link = `${window.location.origin}/teams/invite/${team.inviteCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isLeader = team?.leaderId === currentUser?.id;

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="font-mono text-[10px] text-primary uppercase tracking-widest animate-pulse">Accessing Secure Sector...</p>
                </div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
                <Users className="h-16 w-16 text-muted-foreground/20 mb-4" />
                <h1 className="text-2xl font-black text-foreground uppercase italic">Sector Not Found</h1>
                <Button variant="ghost" className="mt-6 text-primary font-bold uppercase tracking-widest" onClick={() => router.push('/dashboard/teams')}>
                    Return to Operations
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pt-10 pb-20 px-4 relative overflow-x-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full opacity-50 dark:opacity-20" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 blur-[150px] rounded-full opacity-50 dark:opacity-20" />
            </div>

            <div className="container max-w-6xl mx-auto relative z-10">
                {/* Top Nav/Breadcrumb */}
                <button
                    onClick={() => router.push('/dashboard/teams')}
                    className="group mb-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors uppercase font-black text-[10px] tracking-widest"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Fleet
                </button>

                {/* Header Section */}
                <div className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-border pb-10">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-primary blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-3xl" />
                            <div className="w-24 h-24 rounded-3xl bg-card border border-border flex items-center justify-center text-primary text-4xl font-black overflow-hidden relative shadow-2xl">
                                {team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : team.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-primary text-primary-foreground font-black uppercase tracking-widest text-[9px] px-3 py-0.5 border-none shadow-lg shadow-primary/20">
                                    <ShieldCheck className="w-3 h-3 mr-1" /> Active Duty
                                </Badge>
                                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Sector {team.id.slice(0, 8)}</span>
                            </div>
                            <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none text-foreground">{team.name}</h1>
                            <div className="flex items-center gap-4 pt-1">
                                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase">
                                    <Gamepad2 className="w-3.5 h-3.5 text-primary" /> {team.gameType?.replace('_', ' ')}
                                </span>
                                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase">
                                    <Users className="w-3.5 h-3.5 text-primary" /> {(team.members?.length || 0)} Squad Members
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <Button
                            variant="outline"
                            className="flex-1 lg:flex-none border-border bg-card text-foreground hover:bg-muted font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-xl"
                            onClick={copyInviteLink}
                        >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                            {copied ? 'Link Active' : 'Copy Recruitment Link'}
                        </Button>
                        {isLeader && (
                            <Button
                                variant="destructive"
                                className="flex-1 lg:flex-none bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-xl"
                                onClick={() => {
                                    if (confirm('Disband squad? This cannot be undone.')) {
                                        api.delete(`/teams/${team.id}`).then(() => router.push('/dashboard/teams'));
                                    }
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Disband Squad
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Roster Panel */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-card/50 border border-border rounded-[2.5rem] p-8 backdrop-blur-sm">
                            <div className="flex justify-between items-center mb-10">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                                        Personnel Roster
                                    </h2>
                                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em] ml-5">Active Military Database</p>
                                </div>
                                <Badge variant="outline" className="border-border text-muted-foreground text-[10px] px-3 font-mono bg-muted/30">
                                    MEMBERS: {(team.members?.length || 0)}/{team.maxMembers}
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                {(team.members || []).map((member) => (
                                    <motion.div
                                        key={member.id}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="flex items-center justify-between p-5 rounded-2xl bg-muted/5 border border-border group hover:border-yellow-500/20 hover:bg-muted/20 transition-all"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                                                    {member.user?.avatar ? (
                                                        <img src={member.user.avatar} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xl font-black text-muted-foreground">{(member.user?.name || 'U').charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                {member.role === 'LEADER' && (
                                                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg">
                                                        <Crown className="w-3.5 h-3.5 text-black" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-black uppercase text-base text-foreground group-hover:text-yellow-500 transition-colors">{member.user?.name || 'Unknown User'}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{member.role}</span>
                                                    <span className="w-1 h-1 rounded-full bg-border" />
                                                    <span className="text-[9px] font-mono text-green-500 uppercase tracking-widest">Active</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="hidden md:flex flex-col items-end gap-1">
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1 h-3 rounded-full bg-yellow-500/20" />)}
                                                </div>
                                                <span className="text-[8px] font-mono text-gray-600 uppercase">Power Level 100</span>
                                            </div>
                                            {isLeader && member.user?.id !== currentUser?.id && (
                                                <button className="p-2.5 rounded-xl bg-red-500/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {Array.from({ length: team.maxMembers - (team.members?.length || 0) }).map((_, i) => (
                                    <div key={`v-${i}`} className="p-5 rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-muted/10 opacity-40 hover:opacity-60 transition-opacity">
                                        <div className="flex items-center gap-3">
                                            <UserPlus className="w-5 h-5 text-muted-foreground/60" />
                                            <span className="text-[10px] font-black font-mono text-muted-foreground/60 uppercase tracking-[0.2em]">Recruitment Open</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Recruitment & Intel */}
                    <div className="space-y-8">
                        {/* Recruitment Card */}
                        <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 backdrop-blur-md relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 blur-3xl rounded-full" />

                            <div className="relative z-10 flex flex-col gap-6">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Recruitment Portal
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold leading-relaxed px-1">
                                        Share your unique recruitment frequency to expand your team.
                                    </p>
                                </div>

                                <div className="bg-background/60 dark:bg-black/60 border border-border rounded-2xl p-4 space-y-4 shadow-inner">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Squad Frequency</span>
                                        <span className="text-xs font-black text-foreground tracking-[0.3em] font-mono">{team.inviteCode}</span>
                                    </div>
                                    <button
                                        onClick={copyInviteLink}
                                        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Sync Complete' : 'Copy Freq Link'}
                                    </button>
                                </div>

                                <p className="text-[8px] text-muted-foreground/40 text-center font-bold uppercase tracking-tighter">
                                    Warning: Unauthorized link sharing may compromise squad security.
                                </p>
                            </div>
                        </div>

                        {/* Team Intel Card */}
                        <div className="bg-card/50 border border-border rounded-[2.5rem] p-8 backdrop-blur-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest text-foreground mb-6 flex items-center gap-2">
                                <Info className="w-4 h-4 text-primary" /> Tactical Intel
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-border">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase">Operational Since</span>
                                    <span className="text-[10px] font-mono text-foreground">{new Date(team.createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-border">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase">Win Efficiency</span>
                                    <span className="text-[10px] font-mono text-foreground">0.0%</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-border">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase">Sector Rank</span>
                                    <span className="text-[10px] font-mono text-primary">UNRANKED</span>
                                </div>

                                <div className="pt-6">
                                    <Button variant="outline" className="w-full border-border bg-muted/30 text-muted-foreground/60 hover:text-foreground cursor-not-allowed text-[10px] font-black uppercase tracking-widest h-10 rounded-xl">
                                        View Full Intel Report
                                    </Button>
                                    <p className="text-[7px] text-muted-foreground/40 text-center mt-3 uppercase font-black">Requires Specialist Level 5</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
