'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader2, Users, Crown, Gamepad2, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';

interface TeamData {
    id: string;
    name: string;
    logo?: string;
    gameType: string;
    maxMembers: number;
    members: { user: { id: string; name: string; avatar?: string } }[];
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
            setError(err.response?.data?.message || 'Failed to load team invite');
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
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to join team');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading team details...</p>
            </div>
        );
    }

    if (error && !team) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <div className="bg-red-500/10 p-4 rounded-full mb-4">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Invite Invalid</h1>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={() => router.push('/')}>Go Home</Button>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <div className="bg-green-500/10 p-4 rounded-full mb-4 animate-bounce">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Welcome to {team?.name}!</h1>
                <p className="text-muted-foreground mb-6">You have successfully joined the team. Redirecting...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-primary/20 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="h-2 bg-primary w-full" />

                <CardHeader className="text-center pb-2">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-inner">
                        {team?.logo ? (
                            <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                            <Users className="h-10 w-10 text-primary" />
                        )}
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight">{team?.name}</CardTitle>
                    <CardDescription className="flex items-center justify-center gap-2 mt-2">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            <Gamepad2 className="h-3 w-3 mr-1" /> {team?.gameType?.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">
                            {team?._count.members}/{team?.maxMembers} Members
                        </Badge>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="bg-muted/50 rounded-xl p-4 border border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Crown className="h-3 w-3 text-yellow-500" /> Team Roster
                        </p>
                        <div className="space-y-3">
                            {team?.members.map((member, i) => (
                                <div key={member.user.id} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-background border flex items-center justify-center text-xs font-bold">
                                        {member.user.avatar ? (
                                            <img src={member.user.avatar} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            member.user.name?.[0] || '?'
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">{member.user.name}</span>
                                    {i === 0 && <Badge variant="secondary" className="ml-auto text-[10px] h-4">Leader</Badge>}
                                </div>
                            ))}
                            {Array.from({ length: (team?.maxMembers || 0) - (team?._count.members || 0) }).map((_, i) => (
                                <div key={`empty-${i}`} className="flex items-center gap-3 opacity-40 grayscale">
                                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <span className="text-sm font-medium italic text-muted-foreground underline decoration-dotted decoration-muted-foreground/30">Vacant Slot</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-3 pt-2">
                        <Button
                            className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
                            size="lg"
                            onClick={handleJoin}
                            disabled={joining || (team?._count.members || 0) >= (team?.maxMembers || 0)}
                        >
                            {joining ? (
                                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Joining...</>
                            ) : (
                                <><ShieldCheck className="h-5 w-5 mr-2" /> Accept Invite & Join</>
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground hover:text-foreground"
                            onClick={() => router.push('/')}
                        >
                            Decline Invite
                        </Button>
                    </div>
                </CardContent>

                <div className="px-6 py-4 bg-muted/30 border-t text-center">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                        Join responsibly. Team leaders represent the &quot;Protocol&quot; standards.
                    </p>
                </div>
            </Card>
        </div>
    );
}
