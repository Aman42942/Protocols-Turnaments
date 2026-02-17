"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Users, Plus, Shield, Crown, UserPlus, Loader2, Trophy, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';

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

export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [gameFormat, setGameFormat] = useState<'PUBG_SQUAD' | 'PUBG_DUO' | 'PUBG_SOLO' | 'VALORANT_5V5' | 'FREEFIRE_SQUAD'>('PUBG_SQUAD');

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const res = await api.get('/teams');
            setTeams(res.data || []);
        } catch (err: any) {
            if (err.response?.status === 401) {
                window.location.href = '/login';
            }
            console.error('Failed to fetch teams:', err);
        } finally {
            setLoading(false);
        }
    };

    const createTeam = async () => {
        if (!newTeamName.trim()) return;
        setCreating(true);

        // Map format to max members
        const formatMap = {
            'PUBG_SQUAD': 4,
            'PUBG_DUO': 2,
            'PUBG_SOLO': 1,
            'VALORANT_5V5': 5,
            'FREEFIRE_SQUAD': 4
        };

        try {
            await api.post('/teams', {
                name: newTeamName,
                gameType: gameFormat,
                maxMembers: formatMap[gameFormat]
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

    const joinTeam = async (teamId: string) => {
        try {
            await api.post(`/teams/${teamId}/join`);
            await fetchTeams();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to join team');
        }
    };

    const deleteTeam = async (teamId: string) => {
        if (!confirm('Are you sure you want to delete this team?')) return;
        try {
            await api.delete(`/teams/${teamId}`);
            await fetchTeams();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete team');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 pt-8 pb-12">
            <div className="container max-w-5xl">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Users className="h-8 w-8 text-primary" />
                            My Teams
                        </h1>
                        <p className="text-muted-foreground">Manage your teams, invite players, and track performance.</p>
                    </div>
                    <Button size="lg" onClick={() => setShowCreate(!showCreate)}>
                        <Plus className="mr-2 h-5 w-5" />
                        Create Team
                    </Button>
                </div>

                {/* Create Team Form */}
                {showCreate && (
                    <Card className="mb-8 border-primary/30 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">Create New Team</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground">TEAM NAME</label>
                                    <Input
                                        placeholder="Dominators X"
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                        className="h-12"
                                    />
                                </div>
                                <div className="w-full sm:w-48 space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground">GAME FORMAT</label>
                                    <select
                                        className="w-full h-12 bg-background border rounded-lg px-3 text-sm"
                                        value={gameFormat}
                                        onChange={(e) => setGameFormat(e.target.value as any)}
                                    >
                                        <option value="PUBG_SQUAD">PUBG Squad (4)</option>
                                        <option value="PUBG_DUO">PUBG Duo (2)</option>
                                        <option value="PUBG_SOLO">PUBG Solo (1)</option>
                                        <option value="VALORANT_5V5">Valorant 5v5 (5)</option>
                                        <option value="FREEFIRE_SQUAD">FreeFire Squad (4)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                                <Button onClick={createTeam} disabled={creating || !newTeamName.trim()}>
                                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                    Create Team
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Teams Grid */}
                {teams.length === 0 ? (
                    <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed">
                        <Users className="h-16 w-16 text-muted-foreground/20 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Build Your Squad</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                            Create a team to start competing in tournaments. You&apos;ll get a unique invite link to share with your friends.
                        </p>
                        <Button onClick={() => setShowCreate(true)} size="lg">
                            <Plus className="mr-2 h-5 w-5" /> Start a Team
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {teams.map((team) => (
                            <Card key={team.id} className="group hover:shadow-xl transition-all duration-300 border-primary/10">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-black shadow-inner group-hover:bg-primary group-hover:text-white transition-colors">
                                                {team.logo ? <img src={team.logo} className="w-full h-full object-cover rounded-2xl" /> : team.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-bold">{team.name}</CardTitle>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-5">
                                                        {team.gameType?.replace('_', ' ')}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {team.members?.length || 0} / {team.maxMembers} Members
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                                            <Shield className="mr-1 h-3 w-3" />
                                            Verified
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Members Roster */}
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Roster</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {team.members?.map((member) => (
                                                <div key={member.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-transparent hover:border-primary/20 transition-all">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-8 w-8 rounded-full bg-background border shadow-sm flex items-center justify-center overflow-hidden">
                                                            {member.user?.avatar ? (
                                                                <img src={member.user.avatar} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs font-bold">{(member.user?.name || 'U').charAt(0).toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold">{member.user?.name || 'Unknown'}</span>
                                                            {member.role === 'LEADER' && <span className="text-[9px] text-yellow-600 font-bold uppercase flex items-center gap-0.5"><Crown className="h-2 w-2" /> Captain</span>}
                                                        </div>
                                                    </div>
                                                    {member.role === 'LEADER' && team.inviteCode && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-[10px] font-bold gap-1.5"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const link = `${window.location.origin}/teams/invite/${team.inviteCode}`;
                                                                navigator.clipboard.writeText(link);
                                                                alert('Invite link copied to clipboard!');
                                                            }}
                                                        >
                                                            <UserPlus className="h-3.5 w-3.5" />
                                                            Invite
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                            {/* Vacant Slots */}
                                            {Array.from({ length: Math.max(0, team.maxMembers - (team.members?.length || 0)) }).map((_, i) => (
                                                <div key={`empty-${i}`} className="p-2.5 rounded-xl border-2 border-dashed border-muted/50 flex items-center justify-center opacity-40">
                                                    <span className="text-[10px] font-medium text-muted-foreground">Open Slot</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex gap-2 pt-2 border-t mt-4">
                                        <Button variant="default" size="sm" className="flex-1 font-bold" onClick={() => window.location.href = `/dashboard/teams/${team.id}`}>
                                            Manage Team
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive transition-colors px-2" onClick={() => deleteTeam(team.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
