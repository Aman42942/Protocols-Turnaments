"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trophy, Medal, Crown, Flame, Zap, Target, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { io } from 'socket.io-client';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import LeaderboardEmptyState from '@/components/LeaderboardEmptyState';

interface Player {
    id: string;
    rank: number;
    name: string;
    points: number;
    winRate: string;
    game: string;
    avatar?: string;
}

export default function LeaderboardPage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [filter, setFilter] = useState('ALL');

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/leaderboard?limit=100');
            setPlayers(res.data);
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const socket = io(`${socketUrl}/leaderboard`);

        socket.on('connect', () => {
            console.log('Connected to Leaderboard WebSocket');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Leaderboard WebSocket');
            setIsConnected(false);
        });

        socket.on('global_leaderboard_update', (data) => {
            console.log('Live Update Received:', data);
            fetchData();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500 drop-shadow-md animate-pulse" />;
            case 2: return <Medal className="w-7 h-7 text-gray-400 fill-gray-400 drop-shadow-md" />;
            case 3: return <Medal className="w-7 h-7 text-amber-700 fill-amber-700 drop-shadow-md" />;
            default: return <span className="font-mono font-bold text-muted-foreground">#{rank}</span>;
        }
    };

    const getLastMatchTrend = (index: number) => {
        return index % 3 === 0 ? <Flame className="w-4 h-4 text-orange-500" /> : <div className="w-4" />;
    };

    const filteredPlayers = filter === 'ALL' ? players : players.filter(p => p.game === filter);

    return (
        <div className="min-h-screen bg-background text-foreground py-12 relative overflow-hidden transition-colors duration-300">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.1]" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col items-center text-center mb-12">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-primary blur-xl opacity-30 rounded-full animate-pulse"></div>
                        <div className="bg-card border border-border p-4 rounded-full relative shadow-lg">
                            <Trophy className="w-10 h-10 text-primary" />
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
                        ELITE <span className="text-primary">LEADERBOARD</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-light">
                        Real-time rankings of the <span className="text-primary font-bold">top 100</span> players.
                        Forge your legacy in the arena.
                    </p>

                    <div className="mt-6 flex items-center gap-3">
                        {isConnected ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1">
                                <Zap className="w-3 h-3 mr-2 animate-pulse" />
                                LIVE UPDATES ACTIVE
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-3 py-1">
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                CONNECTING...
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                {players.length > 0 && (
                    <div className="flex justify-center mb-8 gap-2 flex-wrap">
                        {['ALL', 'VALORANT', 'PUBG', 'BGMI', 'FREE FIRE'].map((game) => (
                            <button
                                key={game}
                                onClick={() => setFilter(game === 'FREE FIRE' ? 'Free Fire' : game === 'ALL' ? 'ALL' : titleCase(game))}
                                className={`px-4 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-300 border ${(filter === game || (game === 'FREE FIRE' && filter === 'Free Fire') || (game === 'VALORANT' && filter === 'Valorant') || (game === 'PUBG' && filter === 'PUBG') || (game === 'BGMI' && filter === 'BGMI'))
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                                        : 'bg-card border-border hover:bg-accent hover:text-accent-foreground'
                                    }`}
                            >
                                {game}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content Area */}
                <div className="w-full max-w-5xl mx-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground animate-pulse">Syncing logic core...</p>
                        </div>
                    ) : players.length === 0 ? (
                        <LeaderboardEmptyState />
                    ) : (
                        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-xl overflow-hidden">
                            <CardHeader className="border-b border-border bg-muted/20">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-xl font-bold tracking-wide flex items-center gap-2">
                                        <Target className="w-5 h-5 text-primary" />
                                        GLOBAL RANKINGS
                                    </CardTitle>
                                    <span className="text-xs font-mono text-muted-foreground">
                                        UPDATED: {new Date().toLocaleTimeString()}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="p-5 font-semibold">Rank</th>
                                                <th className="p-5 font-semibold">Player</th>
                                                <th className="p-5 font-semibold">Game</th>
                                                <th className="p-5 font-semibold text-right">Points</th>
                                                <th className="p-5 font-semibold text-right">Win Rate</th>
                                                <th className="p-5 font-semibold text-center">Trend</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {filteredPlayers.map((player, index) => (
                                                <tr key={index} className={`group hover:bg-muted/30 transition-colors ${player.rank <= 3 ? 'bg-primary/5' : ''}`}>
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-3">
                                                            {getRankIcon(player.rank)}
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ${player.rank === 1 ? 'bg-yellow-100 text-yellow-700 ring-yellow-500' :
                                                                    player.rank === 2 ? 'bg-gray-100 text-gray-700 ring-gray-400' :
                                                                        player.rank === 3 ? 'bg-orange-100 text-orange-700 ring-orange-500' :
                                                                            'bg-muted text-muted-foreground ring-transparent'
                                                                }`}>
                                                                {player.avatar ? (
                                                                    <img src={player.avatar} alt={player.name} className="w-full h-full rounded-full object-cover" />
                                                                ) : (
                                                                    player.name.charAt(0).toUpperCase()
                                                                )}
                                                            </div>
                                                            <span className={`font-bold tracking-tight ${player.rank <= 3 ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                                                {player.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                                                            {player.game}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-5 text-right font-mono text-lg font-bold text-primary">
                                                        {player.points.toLocaleString()}
                                                    </td>
                                                    <td className="p-5 text-right font-mono text-sm text-green-600 dark:text-green-400 font-semibold">
                                                        {player.winRate}
                                                    </td>
                                                    <td className="p-5 text-center flex justify-center items-center">
                                                        {getLastMatchTrend(index)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="md:hidden divide-y divide-border">
                                    {filteredPlayers.map((player, index) => (
                                        <div key={index} className="p-4 flex items-center justify-between active:bg-muted/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 flex justify-center">
                                                    {getRankIcon(player.rank)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">{player.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                            {player.game}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-primary font-mono">{player.points}</p>
                                                <p className="text-[10px] text-green-600 dark:text-green-400 font-mono tracking-widest">{player.winRate}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

function titleCase(str: string) {
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}
