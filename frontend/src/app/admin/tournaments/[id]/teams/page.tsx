"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import Link from 'next/link';
import {
    ArrowLeft, Loader2, ShieldOff, Search, Users2,
    Crown, AlertTriangle, CheckCircle2, XCircle, Swords,
    GamepadIcon, Trophy, Eye
} from 'lucide-react';
import { ADMIN_ROLES } from '@/lib/roles';

interface TeamMember { userId: string; role: string; user: { id: string; name: string; avatar: string | null }; }
interface Team { id: string; name: string; logo: string | null; leaderId: string; gameType: string; members: TeamMember[]; }
interface Participant {
    id: string;
    userId: string;
    teamId: string | null;
    status: string;
    paymentStatus: string;
    paymentId: string | null;
    registeredAt: string;
    user: { id: string; name: string; email: string; avatar: string | null };
    team: Team | null;
}
interface Tournament {
    id: string; title: string; game: string; gameMode: string; maxTeams: number; entryFeePerPerson: number;
}

export default function AdminTeamsPage({ params }: { params: { id: string } }) {
    const [loading, setLoading] = useState(true);
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [search, setSearch] = useState('');
    const [disqualifyingId, setDisqualifyingId] = useState<string | null>(null);
    const [confirmingTeam, setConfirmingTeam] = useState<Team | null>(null);
    const [reason, setReason] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (!token || !userStr) { window.location.href = '/login'; return; }
        try { const user = JSON.parse(userStr); if (!ADMIN_ROLES.includes(user.role)) { window.location.href = '/'; return; } }
        catch { window.location.href = '/login'; return; }
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/teams/tournament/${params.id}`);
            setTournament(res.data.tournament);
            setParticipants(res.data.participants);
        } catch (err) { console.error('Failed to fetch:', err); }
        finally { setLoading(false); }
    };

    const handleDisqualify = async () => {
        if (!confirmingTeam) return;
        setDisqualifyingId(confirmingTeam.id);
        try {
            const res = await api.delete(`/teams/${confirmingTeam.id}/disqualify/${params.id}`, {
                data: { reason: reason || 'Disqualified by admin' }
            });
            setSuccessMsg(res.data.message);
            setConfirmingTeam(null);
            setReason('');
            await fetchData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to disqualify team');
        } finally { setDisqualifyingId(null); }
    };

    // Group participants by team (including solo players with no team)
    const teamMap = new Map<string, { team: Team; members: Participant[] }>();
    const soloPlayers: Participant[] = [];

    participants.forEach(p => {
        if (p.team) {
            if (!teamMap.has(p.team.id)) { teamMap.set(p.team.id, { team: p.team, members: [] }); }
            teamMap.get(p.team.id)!.members.push(p);
        } else {
            soloPlayers.push(p);
        }
    });

    const teams = Array.from(teamMap.values());
    const filteredTeams = teams.filter(({ team }) =>
        !search || team.name.toLowerCase().includes(search.toLowerCase())
    );
    const activeTeams = teams.filter(({ members }) => members.some(m => m.status !== 'CANCELLED')).length;

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/tournaments">
                    <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Swords className="w-6 h-6 text-primary" /> Team Monitor
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {tournament?.title} · {tournament?.game} · {tournament?.gameMode}
                    </p>
                </div>
                <Link href={`/admin/tournaments/${params.id}/participants`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                        <Users2 className="w-4 h-4" /> View Participants
                    </Button>
                </Link>
            </div>

            {/* Success Toast */}
            {successMsg && (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 font-medium">
                    <CheckCircle2 className="w-5 h-5 shrink-0" /> {successMsg}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card><CardContent className="pt-5 text-center">
                    <p className="text-2xl font-bold text-blue-400">{teams.length}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Trophy className="w-3 h-3" /> Total Teams</p>
                </CardContent></Card>
                <Card><CardContent className="pt-5 text-center">
                    <p className="text-2xl font-bold text-green-400">{activeTeams}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> Active</p>
                </CardContent></Card>
                <Card><CardContent className="pt-5 text-center">
                    <p className="text-2xl font-bold text-muted-foreground">{soloPlayers.length}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><GamepadIcon className="w-3 h-3" /> Solo Players</p>
                </CardContent></Card>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search teams..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Teams Grid */}
            {filteredTeams.length === 0 ? (
                <Card><CardContent className="py-16 text-center text-muted-foreground">
                    <Swords className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No teams found in this tournament.</p>
                </CardContent></Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTeams.map(({ team, members }) => {
                        const isDisqualified = members.every(m => m.status === 'CANCELLED');
                        const hasFraud = members.some(m => m.paymentStatus !== 'PAID' && m.status === 'APPROVED');
                        const leaderParticipant = members.find(m => m.userId === team.leaderId);

                        return (
                            <Card key={team.id} className={`relative overflow-hidden transition-all ${isDisqualified ? 'opacity-50 border-dashed' :
                                    hasFraud ? 'border-red-500/40 bg-red-500/5' : ''
                                }`}>
                                {hasFraud && !isDisqualified && (
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500" />
                                )}
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm shrink-0">
                                                {team.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm flex items-center gap-1.5">
                                                    {team.name}
                                                    {hasFraud && !isDisqualified && <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">{team.gameType}</p>
                                            </div>
                                        </div>
                                        {isDisqualified ? (
                                            <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20 text-[10px]">
                                                <XCircle className="w-3 h-3 mr-1" /> DQ'd
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Members */}
                                    <div className="space-y-1.5">
                                        {members.map(m => (
                                            <div key={m.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                                        {m.user.name?.charAt(0) || '?'}
                                                    </div>
                                                    <span className="text-xs font-medium">{m.user.name}</span>
                                                    {m.userId === team.leaderId && <Crown className="w-3 h-3 text-yellow-500" />}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {m.paymentStatus === 'PAID' ? (
                                                        <span className="text-[10px] text-green-400 font-bold">✓ Paid</span>
                                                    ) : m.status === 'CANCELLED' ? (
                                                        <span className="text-[10px] text-gray-400 font-bold">Removed</span>
                                                    ) : (
                                                        <span className="text-[10px] text-orange-400 font-bold flex items-center gap-0.5">
                                                            <AlertTriangle className="w-3 h-3" /> No Pay
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    {!isDisqualified && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all gap-1.5 mt-2"
                                            onClick={() => setConfirmingTeam(team)}
                                            disabled={disqualifyingId === team.id}
                                        >
                                            {disqualifyingId === team.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <ShieldOff className="w-3.5 h-3.5" />
                                            )}
                                            Disqualify Team
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Confirm Disqualify Modal */}
            {confirmingTeam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-card border border-red-500/30 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                <ShieldOff className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Disqualify Team?</h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    You are about to disqualify <strong>"{confirmingTeam.name}"</strong> from this tournament. All team members will be removed from the registration list.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reason (optional)</label>
                            <Input
                                placeholder="e.g. Cheating, smurfing, no payment proof..."
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => { setConfirmingTeam(null); setReason(''); }}>
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white border-none"
                                onClick={handleDisqualify}
                                disabled={!!disqualifyingId}
                            >
                                {disqualifyingId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldOff className="w-4 h-4 mr-2" />}
                                Confirm Disqualify
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
