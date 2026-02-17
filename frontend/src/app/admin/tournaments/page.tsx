"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import api from '@/lib/api';
import {
    Plus, Search, Trophy, Loader2, Trash2, Edit, Eye,
    Users, IndianRupee, Calendar, MoreHorizontal
} from 'lucide-react';
import { ADMIN_ROLES } from '@/lib/roles';

interface Tournament {
    id: string;
    title: string;
    game: string;
    tier: string;
    entryFeePerPerson: number;
    prizePool: number;
    maxTeams: number;
    gameMode: string;
    status: string;
    startDate: string;
    _count?: { teams: number };
}

export default function AdminTournamentsPage() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [gameFilter, setGameFilter] = useState('ALL');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editStatus, setEditStatus] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            window.location.href = '/login';
            return;
        }

        try {
            const user = JSON.parse(userStr);
            // Use the centralized ADMIN_ROLES array
            if (!ADMIN_ROLES.includes(user.role)) {
                console.error('Unauthorized access attempt:', user.role);
                window.location.href = '/';
                return;
            }
        } catch {
            window.location.href = '/login';
            return;
        }

        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        try {
            const res = await api.get('/tournaments');
            setTournaments(res.data);
        } catch (err) {
            console.error('Failed to fetch tournaments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"? This action is permanent.`)) return;
        setProcessingId(id);
        try {
            await api.delete(`/tournaments/${id}`);
            await fetchTournaments();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete');
        } finally {
            setProcessingId(null);
        }
    };

    const handleStatusUpdate = async (id: string) => {
        if (!editStatus) return;
        setProcessingId(id);
        try {
            await api.patch(`/tournaments/${id}`, { status: editStatus });
            setEditingId(null);
            setEditStatus('');
            await fetchTournaments();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update');
        } finally {
            setProcessingId(null);
        }
    };

    const filtered = tournaments.filter(t => {
        const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.game.toLowerCase().includes(search.toLowerCase());
        const matchesGame = gameFilter === 'ALL' || t.game === gameFilter;
        return matchesSearch && matchesGame;
    });

    const games = ['ALL', ...Array.from(new Set(tournaments.map(t => t.game)))];

    const totalPrizePool = tournaments.reduce((s, t) => s + (t.prizePool || 0), 0);
    const totalParticipants = tournaments.reduce((s, t) => s + (t._count?.teams || 0), 0);
    const totalEntryFees = tournaments.reduce((s, t) => s + (t.entryFeePerPerson || 0) * (t._count?.teams || 0), 0);

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'LIVE': return 'bg-red-500/10 text-red-500 border-red-500/30';
            case 'UPCOMING': return 'bg-green-500/10 text-green-500 border-green-500/30';
            case 'COMPLETED': return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
            case 'CANCELLED': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier?.toUpperCase()) {
            case 'HIGH': return 'border-amber-500/50 text-amber-500 bg-amber-500/10';
            case 'MEDIUM': return 'border-blue-500/50 text-blue-500 bg-blue-500/10';
            default: return 'border-green-500/50 text-green-500 bg-green-500/10';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Trophy className="h-8 w-8 text-primary" />
                        Tournaments
                    </h1>
                    <p className="text-muted-foreground">Manage all esports events — {tournaments.length} total</p>
                </div>
                <Link href="/admin/tournaments/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Tournament
                    </Button>
                </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-2xl font-bold">{tournaments.length}</p>
                        <p className="text-xs text-muted-foreground">Total Events</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-2xl font-bold text-green-500">₹{totalPrizePool.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-muted-foreground">Total Prize Pools</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-2xl font-bold text-blue-500">{totalParticipants}</p>
                        <p className="text-xs text-muted-foreground">Total Registrations</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-2xl font-bold text-orange-500">₹{totalEntryFees.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-muted-foreground">Entry Fee Revenue</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tournaments..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {games.map(g => (
                                <Button
                                    key={g}
                                    size="sm"
                                    variant={gameFilter === g ? 'default' : 'outline'}
                                    onClick={() => setGameFilter(g)}
                                >
                                    {g === 'ALL' ? 'All Games' : g}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium">
                                <tr>
                                    <th className="p-4">Tournament</th>
                                    <th className="p-4">Game</th>
                                    <th className="p-4">Tier</th>
                                    <th className="p-4">Entry Fee</th>
                                    <th className="p-4">Prize</th>
                                    <th className="p-4">Participants</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                            No tournaments found
                                        </td>
                                    </tr>
                                ) : filtered.map((t) => (
                                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-4">
                                            <div>
                                                <p className="font-medium">{t.title}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{t.id.slice(0, 8)}...</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                {t.game}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getTierColor(t.tier)}`}>
                                                {t.tier}
                                            </span>
                                        </td>
                                        <td className="p-4">₹{t.entryFeePerPerson || 0}</td>
                                        <td className="p-4 font-medium">₹{(t.prizePool || 0).toLocaleString('en-IN')}</td>
                                        <td className="p-4 text-muted-foreground">
                                            {t._count?.teams || 0} / {t.maxTeams || '∞'}
                                        </td>
                                        <td className="p-4">
                                            {editingId === t.id ? (
                                                <div className="flex gap-1">
                                                    <select
                                                        className="text-xs border rounded px-2 py-1 bg-background"
                                                        value={editStatus}
                                                        onChange={(e) => setEditStatus(e.target.value)}
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="UPCOMING">UPCOMING</option>
                                                        <option value="LIVE">LIVE</option>
                                                        <option value="COMPLETED">COMPLETED</option>
                                                        <option value="CANCELLED">CANCELLED</option>
                                                    </select>
                                                    <Button size="sm" className="h-7 text-xs" onClick={() => handleStatusUpdate(t.id)}>
                                                        Save
                                                    </Button>
                                                </div>
                                            ) : (
                                                <button
                                                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${getStatusColor(t.status)}`}
                                                    onClick={() => { setEditingId(t.id); setEditStatus(t.status || 'UPCOMING'); }}
                                                    title="Click to change status"
                                                >
                                                    {t.status === 'LIVE' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />}
                                                    {t.status || 'UPCOMING'}
                                                </button>
                                            )}
                                        </td>
                                        <td className="p-4 text-muted-foreground text-xs">{formatDate(t.startDate)}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link href={`/tournaments/${t.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                    title="Delete"
                                                    onClick={() => handleDelete(t.id, t.title)}
                                                    disabled={processingId === t.id}
                                                >
                                                    {processingId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
