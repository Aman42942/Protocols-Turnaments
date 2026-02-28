"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Users, Plus, Shield, Crown, UserPlus,
    Loader2, Trophy, Trash2, Gamepad2,
    ChevronRight, Zap, Target, Flame, LayoutGrid,
    Check, Copy, Globe, Terminal, Link as LinkIcon, Bell
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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
    tournaments?: any[];
    createdAt: string;
}

const GAME_PRESETS = [
    { id: 'PUBG_SQUAD', name: 'BGMI/PUBG', format: 'Squad', members: 4, icon: <Target className="w-5 h-5" />, color: 'bg-orange-500' },
    { id: 'VALORANT_5V5', name: 'Valorant', format: '5v5', members: 5, icon: <Flame className="w-5 h-5" />, color: 'bg-red-500' },
    { id: 'FREEFIRE_SQUAD', name: 'FreeFire', format: 'Squad', members: 4, icon: <Zap className="w-5 h-5" />, color: 'bg-blue-500' },
    { id: 'PUBG_DUO', name: 'PUBG/BGMI', format: 'Duo', members: 2, icon: <Users className="w-5 h-5" />, color: 'bg-orange-600' },
];

export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [selectedGame, setSelectedGame] = useState(GAME_PRESETS[0]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [inviteCount, setInviteCount] = useState(0);

    const fetchInviteCount = async () => {
        try {
            const res = await api.get('/teams/invitations/me');
            setInviteCount(res.data.length);
        } catch (err) {
            console.error('Failed to fetch invite count:', err);
        }
    };

    useEffect(() => {
        fetchTeams();
        fetchInviteCount();
    }, []);

    const fetchTeams = async () => {
        try {
            const res = await api.get('/teams');
            setTeams(res.data || []);
        } catch (err: any) {
            if (err.response?.status === 401) window.location.href = '/login';
            console.error('Failed to fetch teams:', err);
        } finally {
            setLoading(false);
        }
    };

    const createTeam = async () => {
        if (!newTeamName.trim()) return;
        setCreating(true);

        try {
            await api.post('/teams', {
                name: newTeamName,
                gameType: selectedGame.id,
                maxMembers: selectedGame.members
            });
            setNewTeamName('');
            setShowCreate(false);
            await fetchTeams();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to create team');
        } finally {
            setCreating(false);
        }
    };

    const deleteTeam = async (teamId: string) => {
        if (!confirm('This will disband your squad permanently. Proceed?')) return;
        try {
            await api.delete(`/teams/${teamId}`);
            await fetchTeams();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete team');
        }
    };

    const copyLink = (team: Team) => {
        const link = `${window.location.origin}/teams/invite/${team.inviteCode}`;
        navigator.clipboard.writeText(link);
        setCopiedId(team.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-primary/50 font-mono text-xs uppercase tracking-widest text-center">Sychronizing Roster...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pt-10 pb-24 px-4 overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full opacity-50 dark:opacity-20" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full opacity-50 dark:opacity-20" />
            </div>

            <div className="container max-w-6xl mx-auto relative z-10">
                {/* Header section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 flex flex-col md:flex-row justify-between items-end gap-8 border-b border-border/40 pb-12"
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <motion.span
                                initial={{ width: 0 }}
                                animate={{ width: 40 }}
                                className="h-[2px] bg-primary"
                            />
                            <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px]">Division 01 // Operations</span>
                        </div>
                        <h1 className="text-7xl font-black uppercase italic tracking-tighter leading-[0.8] mb-6">
                            My <span className="text-primary underline decoration-primary/20 decoration-8 underline-offset-[12px]">Squads</span>
                        </h1>
                        <p className="text-muted-foreground text-sm max-w-sm uppercase font-black tracking-tight leading-relaxed opacity-70">
                            Coordinate, Manage, and Deploy your tactical units to the field of combat.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Link href="/dashboard/teams/invites">
                            <button className="relative p-5 rounded-[2rem] bg-muted/40 border border-border/40 hover:bg-muted/60 transition-all group">
                                <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                {inviteCount > 0 && (
                                    <span className="absolute top-3 right-3 w-5 h-5 bg-primary text-primary-foreground text-[8px] font-black rounded-full flex items-center justify-center animate-bounce">
                                        {inviteCount}
                                    </span>
                                )}
                            </button>
                        </Link>
                        <button
                            onClick={() => setShowCreate(!showCreate)}
                            className={cn(
                                "group relative overflow-hidden px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-95 flex items-center gap-4",
                                showCreate
                                    ? 'bg-destructive/10 text-destructive border border-destructive/20 shadow-lg shadow-destructive/10'
                                    : 'bg-primary text-primary-foreground shadow-2xl shadow-primary/20 hover:shadow-primary/40'
                            )}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <span className="relative z-10 flex items-center gap-3">
                                {showCreate ? 'Abort Protocol' : <><Plus className="w-5 h-5 stroke-[3]" /> Assemble Unit</>}
                            </span>
                        </button>
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {showCreate && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-16 overflow-hidden"
                        >
                            <div className="bg-card/50 border border-border rounded-[2.5rem] p-8 md:p-12 backdrop-blur-xl relative">
                                <div className="absolute top-6 right-8 text-foreground/10">
                                    <Terminal className="w-12 h-12" />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="space-y-10">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Squad Designation</label>
                                            </div>
                                            <Input
                                                placeholder="e.g. ALPHA_VANGUARD"
                                                value={newTeamName}
                                                onChange={(e) => setNewTeamName(e.target.value)}
                                                className="h-20 bg-background/50 border-border/40 rounded-[2rem] text-2xl font-black uppercase placeholder:text-muted-foreground/30 focus:ring-primary/20 transition-all tracking-tighter italic"
                                            />
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Sector selection</label>
                                                </div>
                                                <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-40">Scroll to view all</span>
                                            </div>

                                            {/* Horizontal Snap Scroll for presets */}
                                            <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                                                {GAME_PRESETS.map((preset) => (
                                                    <button
                                                        key={preset.id}
                                                        onClick={() => setSelectedGame(preset)}
                                                        className={cn(
                                                            "snap-start shrink-0 w-[240px] p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-start gap-6 text-left relative overflow-hidden group/preset",
                                                            selectedGame.id === preset.id
                                                                ? 'border-primary bg-primary/10 shadow-xl shadow-primary/5'
                                                                : 'border-border/40 bg-card/40 hover:border-primary/20'
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "p-4 rounded-[1.25rem] transition-all transform group-hover/preset:scale-110 duration-500",
                                                            selectedGame.id === preset.id ? preset.color : 'bg-muted text-muted-foreground'
                                                        )}>
                                                            {React.cloneElement(preset.icon as any, { className: 'w-7 h-7 stroke-[2.5]' })}
                                                        </div>
                                                        <div>
                                                            <p className={cn(
                                                                "font-black uppercase text-lg tracking-tighter leading-none mb-1",
                                                                selectedGame.id === preset.id ? 'text-foreground' : 'text-muted-foreground'
                                                            )}>
                                                                {preset.name}
                                                            </p>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{preset.format} // {preset.members} UNIT MAX</p>
                                                        </div>
                                                        {selectedGame.id === preset.id && (
                                                            <motion.div
                                                                layoutId="activePreset"
                                                                className="absolute top-4 right-8"
                                                            >
                                                                <Check className="w-5 h-5 text-primary" />
                                                            </motion.div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={createTeam}
                                            disabled={creating || !newTeamName.trim()}
                                            className="w-full h-20 bg-primary text-primary-foreground hover:bg-primary/90 transition-all rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 disabled:opacity-30 shadow-2xl shadow-primary/20 active:scale-95"
                                        >
                                            {creating ? <Loader2 className="animate-spin w-6 h-6" /> : <><Plus className="w-6 h-6 stroke-[3]" /> Establish Command Hub</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Teams List */}
                {teams.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-24 flex flex-col items-center justify-center text-center space-y-8"
                    >
                        <div className="relative">
                            <Users className="h-24 w-24 text-muted/20" />
                            <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 text-primary/10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black uppercase">No Active Squads</h3>
                            <p className="text-muted-foreground max-w-xs uppercase font-bold text-xs">Assembly line is waiting. Start your first protocol team now.</p>
                        </div>
                        <Button onClick={() => setShowCreate(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-10 h-12 rounded-full uppercase tracking-widest transition-all">
                            Initiate Assembly
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {teams.map((team, idx) => (
                            <motion.div
                                key={team.id}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative"
                            >
                                <div className="absolute inset-0 bg-primary/5 blur-[50px] rounded-[3rem] -z-10 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                                <div className="h-full bg-card/40 border border-border/40 rounded-[3rem] p-10 backdrop-blur-xl group-hover:border-primary/20 transition-all duration-300 flex flex-col shadow-2xl">

                                    {/* Card Top Section */}
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="flex items-center gap-6">
                                            <div className="relative">
                                                <div className="w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-3xl font-black shadow-2xl shadow-primary/20 group-hover:scale-105 transition-transform duration-500">
                                                    {team.logo ? (
                                                        <img src={team.logo} className="w-full h-full object-cover rounded-[1.75rem]" alt={team.name} />
                                                    ) : (
                                                        team.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center shadow-lg">
                                                    <Shield className="w-4 h-4 text-primary" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black uppercase tracking-tighter group-hover:text-primary transition-colors leading-none mb-2 italic">
                                                    {team.name}
                                                </h3>
                                                <div className="flex items-center gap-3">
                                                    <div className="px-3 py-1 rounded-full bg-muted/40 border border-border/40 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                        {team.gameType?.split('_')[0]}
                                                    </div>
                                                    <span className="text-[10px] font-mono text-muted-foreground italic opacity-50 tracking-widest uppercase">
                                                        Unit {team.id.slice(0, 5)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => deleteTeam(team.id)}
                                            className="p-3 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all duration-300"
                                        >
                                            <Trash2 className="w-5 h-5 stroke-[2.5]" />
                                        </button>
                                    </div>

                                    {/* Roster Section */}
                                    <div className="flex-1 space-y-8 mb-10">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 italic">Current Roster</p>
                                                <p className="text-xs font-black text-foreground">{team.members?.length || 0} / {team.maxMembers} OCCUPIED</p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex -space-x-3">
                                                    {team.members?.map((m, i) => (
                                                        <motion.div
                                                            key={m.id}
                                                            whileHover={{ y: -5, zIndex: 10 }}
                                                            className="w-12 h-12 rounded-2xl border-4 border-background bg-muted flex items-center justify-center overflow-hidden shadow-lg"
                                                        >
                                                            {m.user?.avatar ? (
                                                                <img src={m.user.avatar} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-sm font-black text-muted-foreground">{m.user?.name[0]}</span>
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                    {Array.from({ length: Math.max(0, (team.maxMembers || 0) - (team.members?.length || 0)) }).map((_, i) => (
                                                        <div key={`empty-${i}`} className="w-12 h-12 rounded-2xl border-4 border-background bg-muted/20 border-dashed border-border/40 flex items-center justify-center">
                                                            <div className="w-1 h-1 rounded-full bg-border animate-pulse" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <UserPlus className="w-5 h-5 text-muted-foreground/20 ml-2" />
                                            </div>
                                        </div>

                                        <div className="p-5 rounded-[1.75rem] bg-muted/20 border border-border/20 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <Trophy className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Missions</p>
                                                <p className="text-sm font-black text-foreground">{team.tournaments?.length || 0} Tournaments Joined</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => copyLink(team)}
                                            className={cn(
                                                "h-16 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 border-2",
                                                copiedId === team.id
                                                    ? 'bg-green-500/10 border-green-500 text-green-500'
                                                    : 'bg-card/40 border-border/40 text-foreground hover:bg-muted/50 hover:border-primary/40'
                                            )}
                                        >
                                            {copiedId === team.id ? (
                                                <><Check className="w-4 h-4 stroke-[3]" /> Linked</>
                                            ) : (
                                                <><LinkIcon className="w-4 h-4" /> Join Link</>
                                            )}
                                        </button>
                                        <Link
                                            href={`/dashboard/teams/${team.id}`}
                                            className="h-16 bg-primary text-primary-foreground hover:bg-primary/90 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-primary/10"
                                        >
                                            Manage Hub <ChevronRight className="w-4 h-4 stroke-[3]" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
