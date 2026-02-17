'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader2, Users, Crown, UserPlus, Trash2, Shield, Gamepad2, Copy, Check } from 'lucide-react';

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

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
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
    };

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
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <Users className="h-16 w-16 text-muted-foreground/20 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Team Not Found</h1>
                <Button onClick={() => router.push('/dashboard/teams')}>Back to Teams</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 pt-8 pb-12 px-4">
            <div className="container max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-5">
                        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-black border border-primary/20 shadow-xl overflow-hidden">
                            {team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : team.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase">{team.name}</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px]">
                                    <Gamepad2 className="h-3 w-3 mr-1.5" /> {team.gameType?.replace('_', ' ')}
                                </Badge>
                                <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <Shield className="h-3.5 w-3.5" /> Established {new Date(team.members[0].id ? Date.now() : 0).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" className="flex-1 sm:flex-none font-bold" onClick={() => router.push('/dashboard/teams')}>
                            Exit Hub
                        </Button>
                        {isLeader && (
                            <Button variant="destructive" className="flex-1 sm:flex-none font-bold">
                                <Trash2 className="h-4 w-4 mr-2" /> Disband
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content: Roster */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="border-primary/10 shadow-lg overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                        <Users className="h-4 w-4 text-primary" /> Squad Roster
                                    </CardTitle>
                                    <Badge variant="outline" className="font-bold">
                                        {team.members.length} / {team.maxMembers} SLOTS FILLED
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-3">
                                    {team.members.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-transparent hover:border-primary/20 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center font-black">
                                                    {member.user?.avatar ? <img src={member.user.avatar} className="w-full h-full rounded-full object-cover" /> : (member.user?.name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-base">{member.user?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">{member.role}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {member.role === 'LEADER' && <Crown className="h-5 w-5 text-yellow-500 mr-2" />}
                                                {isLeader && member.user?.id !== currentUser?.id && (
                                                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10">
                                                        Kick
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {Array.from({ length: team.maxMembers - team.members.length }).map((_, i) => (
                                        <div key={`vacant-${i}`} className="p-4 rounded-xl border-2 border-dashed border-muted/50 flex items-center justify-center bg-muted/10 opacity-60">
                                            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                <UserPlus className="h-4 w-4" /> Open Slot Available
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar: Invite & Info */}
                    <div className="space-y-6">
                        {/* Invite Card */}
                        <Card className="border-primary shadow-xl bg-primary/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Invite Link</CardTitle>
                                <CardDescription className="text-[10px] font-bold">SHARE THIS WITH YOUR TEAMMATES</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 bg-background border rounded-lg flex flex-col gap-2 shadow-inner">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Team Code</span>
                                        <Badge variant="default" className="text-lg font-black tracking-widest bg-primary px-3">{team.inviteCode}</Badge>
                                    </div>
                                    <button
                                        onClick={copyInviteLink}
                                        className="w-full h-10 mt-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                    >
                                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                        {copied ? 'Copied Link' : 'Copy Invite Link'}
                                    </button>
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center font-medium leading-tight">
                                    Note: Anyone with this link can join your team if slots are available.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Tournament Card Placeholder */}
                        <Card className="border-primary/10 bg-muted/40 grayscale opacity-80">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-black uppercase tracking-widest">Active Entries</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground/40" />
                                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Searching matches...</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
