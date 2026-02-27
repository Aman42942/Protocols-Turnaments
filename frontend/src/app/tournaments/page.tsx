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

const GAME_STYLES: Record<string, { gradient: string; accent: string; glow: string }> = {
    'VALORANT': { gradient: 'from-red-600/20 via-rose-500/10 to-transparent', accent: 'text-red-400', glow: 'shadow-red-500/10' },
    'PUBG': { gradient: 'from-yellow-600/20 via-amber-500/10 to-transparent', accent: 'text-yellow-400', glow: 'shadow-yellow-500/10' },
    'BGMI': { gradient: 'from-blue-600/20 via-sky-500/10 to-transparent', accent: 'text-blue-400', glow: 'shadow-blue-500/10' },
    'FREEFIRE': { gradient: 'from-orange-600/20 via-amber-500/10 to-transparent', accent: 'text-orange-400', glow: 'shadow-orange-500/10' },
};

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

    const getTimeLeft = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - Date.now();
        if (diff <= 0) return null;
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        if (d > 0) return `${d}d ${h}h`;
        const m = Math.floor((diff % 3600000) / 60000);
        return `${h}h ${m}m`;
    };

    const getTierBadge = (tier: string) => {
        switch (tier) {
            case 'HIGH': return <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] border-0"><Crown className="h-3 w-3 mr-1" />HIGH</Badge>;
            case 'MEDIUM': return <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-[10px] border-0"><Star className="h-3 w-3 mr-1" />MED</Badge>;
            default: return <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] border-0">LOW</Badge>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'LIVE': case 'ONGOING':
                return <span className="flex items-center gap-1 text-[10px] font-bold text-red-500"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />LIVE</span>;
            case 'COMPLETED':
                return <span className="text-[10px] font-bold text-gray-400">ENDED</span>;
            default: return null;
        }
    };

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
                            filteredTournaments.map(t => {
                                const registered = t._count?.teams || 0;
                                const fillPercent = Math.min((registered / t.maxTeams) * 100, 100);
                                const isFull = registered >= t.maxTeams;
                                const timeLeft = getTimeLeft(t.startDate);
                                const style = GAME_STYLES[t.game.toUpperCase()] || GAME_STYLES['VALORANT'];

                                return (
                                    <Link key={t.id} href={`/tournaments/${t.id}`}>
                                        <Card className={`overflow-hidden hover:shadow-xl ${style.glow} hover:border-primary/30 transition-all duration-300 cursor-pointer h-full group border-border/50`}>
                                            {/* Game Banner */}
                                            <div className={`relative h-28 bg-gradient-to-br ${style.gradient} border-b flex items-center justify-center`}>
                                                <div className="text-center">
                                                    <Gamepad2 className={`h-8 w-8 mx-auto mb-1 ${style.accent} opacity-60 group-hover:opacity-100 transition`} />
                                                    <span className={`text-sm font-bold tracking-widest ${style.accent}`}>{t.game}</span>
                                                </div>

                                                {/* Status overlay */}
                                                <div className="absolute top-3 left-3">
                                                    {getStatusBadge(t.status)}
                                                </div>
                                                <div className="absolute top-3 right-3">
                                                    {getTierBadge(t.tier)}
                                                </div>

                                                {/* Countdown */}
                                                {timeLeft && (
                                                    <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 backdrop-blur text-[10px] font-medium">
                                                        <Timer className="h-3 w-3 text-primary" />
                                                        <span>{timeLeft}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <CardHeader className="pb-2 pt-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-[10px] px-2 py-0">{t.gameMode}</Badge>
                                                </div>
                                                <CardTitle className="line-clamp-1 text-lg group-hover:text-primary transition">{t.title}</CardTitle>
                                                <CardDescription className="flex items-center gap-1.5 text-xs">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(t.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent className="pb-3 space-y-3">
                                                {/* Prize + Entry */}
                                                <div className="flex gap-3">
                                                    <div className="flex-1 p-2.5 rounded-lg bg-yellow-500/10 text-center">
                                                        <Trophy className="h-4 w-4 mx-auto text-yellow-500 mb-1" />
                                                        <p className="text-sm font-bold">₹{t.prizePool.toLocaleString('en-IN')}</p>
                                                        <p className="text-[10px] text-muted-foreground">Prize</p>
                                                    </div>
                                                    <div className="flex-1 p-2.5 rounded-lg bg-green-500/10 text-center">
                                                        <Wallet className="h-4 w-4 mx-auto text-green-500 mb-1" />
                                                        <p className="text-sm font-bold">{t.entryFeePerPerson > 0 ? `₹${t.entryFeePerPerson}` : 'FREE'}</p>
                                                        <p className="text-[10px] text-muted-foreground">Entry</p>
                                                    </div>
                                                </div>

                                                {/* Progress bar */}
                                                <div>
                                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                                        <span className="text-muted-foreground flex items-center gap-1">
                                                            <Users className="h-3 w-3" /> {registered}/{t.maxTeams}
                                                        </span>
                                                        <span className={`font-medium ${isFull ? 'text-red-500' : fillPercent > 70 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                                                            {isFull ? '🔥 Full' : `${t.maxTeams - registered} left`}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ${isFull ? 'bg-red-500' : fillPercent > 70 ? 'bg-orange-500' : 'bg-primary'}`}
                                                            style={{ width: `${fillPercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>

                                            <CardFooter className="pt-0">
                                                <Button
                                                    className="w-full group-hover:shadow-md transition-all"
                                                    variant={isFull ? "outline" : "default"}
                                                    disabled={isFull}
                                                >
                                                    {isFull ? '🔒 Full' : 'View & Register'}
                                                    {!isFull && <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />}
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                );
                            })
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
