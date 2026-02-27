"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    Search, Filter, Trophy, Calendar, Users, Wallet, Loader2, Gamepad2,
    Swords, Timer, Flame, Star, Crown, ChevronRight, SlidersHorizontal, Zap
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { TournamentCard } from '@/components/TournamentCard';

interface Tournament {
    id: string;
    title: string;
    game: string;
    tier: string;
    entryFeePerPerson: number;
    prizePool: number;
    startDate: string;
    maxTeams: number;
    gameMode: string;
    status: string;
    _count?: { teams: number };
}

const GAMES = [
    { key: 'ALL', label: 'All Games', icon: Gamepad2 },
    { key: 'VALORANT', label: 'Valorant', icon: Swords },
    { key: 'PUBG', label: 'PUBG', icon: Trophy },
    { key: 'BGMI', label: 'BGMI', icon: Flame },
    { key: 'FREEFIRE', label: 'Free Fire', icon: Zap },
];

export default function TournamentsPage() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGame, setSelectedGame] = useState('ALL');
    const [selectedTier, setSelectedTier] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'prize' | 'spots'>('date');

    useEffect(() => { fetchTournaments(); }, []);

    const fetchTournaments = async () => {
        try {
            const res = await api.get('/tournaments');
            setTournaments(res.data);
        } catch (err) {
            console.error('Failed to fetch tournaments:', err);
        } finally { setLoading(false); }
    };

    const filteredTournaments = tournaments
        .filter(t => {
            const matchesGame = selectedGame === 'ALL' || t.game.toUpperCase() === selectedGame;
            const matchesTier = selectedTier === 'ALL' || t.tier === selectedTier;
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesGame && matchesTier && matchesSearch;
        })
        .sort((a, b) => {
            if (sortBy === 'prize') return b.prizePool - a.prizePool;
            if (sortBy === 'spots') return (b.maxTeams - (b._count?.teams || 0)) - (a.maxTeams - (a._count?.teams || 0));
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });

    // Stats
    const totalPrize = tournaments.reduce((a, t) => a + t.prizePool, 0);
    const liveCount = tournaments.filter(t => ['LIVE', 'ONGOING'].includes(t.status?.toUpperCase())).length;

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Hero Header */}
            <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
                <div className="container py-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Tournaments</h1>
                            <p className="text-muted-foreground text-lg">Find your next battle. Compete for real prizes.</p>
                        </div>

                        {/* Quick Stats - Horizontal Scroll on Mobile */}
                        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                            {[
                                { label: 'Active', value: tournaments.filter(t => !['COMPLETED', 'CANCELLED'].includes(t.status?.toUpperCase())).length, icon: Gamepad2 },
                                { label: 'Live Now', value: liveCount, icon: Flame },
                                { label: 'Total Prizes', value: `₹${(totalPrize / 1000).toFixed(0)}K`, icon: Trophy },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border shrink-0">
                                    <s.icon className="h-4 w-4 text-primary" />
                                    <div>
                                        <p className="text-lg font-bold leading-none">{s.value}</p>
                                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-8">
                {/* Filters Row */}
                <div className="flex flex-col gap-4 mb-8">
                    {/* Search + Sort */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 max-w-lg">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tournaments..."
                                className="pl-10 h-11"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground ml-1 mb-1 sm:mb-0">Sort By</span>
                            <div className="flex flex-wrap gap-2">
                                {(['date', 'prize', 'spots'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSortBy(s)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${sortBy === s
                                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                            : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground border-border'}`}
                                    >
                                        {s === 'date' ? 'Upcoming' : s === 'prize' ? 'Highest Prize' : 'Most Spots'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Game Filter Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {GAMES.map(game => (
                            <button
                                key={game.key}
                                onClick={() => setSelectedGame(game.key)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedGame === game.key
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border'}`}
                            >
                                <game.icon className="h-4 w-4" />
                                {game.label}
                            </button>
                        ))}
                    </div>

                    {/* Tier Filter */}
                    <div className="flex gap-2 items-center">
                        <span className="text-xs text-muted-foreground font-medium">Tier:</span>
                        {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map(tier => (
                            <button
                                key={tier}
                                onClick={() => setSelectedTier(tier)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition ${selectedTier === tier
                                    ? tier === 'HIGH' ? 'bg-red-500/20 text-red-400'
                                        : tier === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400'
                                            : tier === 'LOW' ? 'bg-green-500/20 text-green-400'
                                                : 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground'}`}
                            >
                                {tier}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">Loading tournaments...</p>
                        </div>
                    </div>
                )}

                {/* Grid */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTournaments.length > 0 ? (
                            filteredTournaments.map(t => (
                                <TournamentCard
                                    key={t.id}
                                    id={t.id}
                                    title={t.title}
                                    game={t.game}
                                    tier={t.tier as any}
                                    entryFee={t.entryFeePerPerson}
                                    prizePool={t.prizePool}
                                    startDate={t.startDate}
                                    maxTeams={t.maxTeams}
                                    registeredTeams={t._count?.teams || 0}
                                    gameMode={t.gameMode}
                                    status={t.status}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
                                <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                                <h3 className="text-xl font-bold mb-2">No tournaments found</h3>
                                <p className="text-muted-foreground text-sm mb-4">Try adjusting your filters or check back later.</p>
                                <Button variant="outline" onClick={() => { setSelectedGame('ALL'); setSelectedTier('ALL'); setSearchQuery(''); }}>
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
