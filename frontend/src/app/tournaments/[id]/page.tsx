"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Trophy, Calendar, Users, Wallet, AlertCircle, ArrowLeft, Loader2,
    CheckCircle, Clock, Gamepad2, Shield, Swords, Target, MapPin,
    Star, Zap, Timer, Crown, ChevronRight, ExternalLink, MessageCircle,
    Share2, Copy, Hash, Eye, EyeOff, Link2, Globe, Settings2
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { load } from '@cashfreepayments/cashfree-js';
import { LiveLeaderboard } from '@/components/tournament/LiveLeaderboard';
import { TournamentActivityFeed } from '@/components/tournament/TournamentActivityFeed';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tournament {
    id: string;
    title: string;
    description?: string;
    game: string;
    status: string;
    tier: string;
    entryFeePerPerson: number;
    prizePool: number;
    startDate: string;
    endDate?: string;
    maxTeams: number;
    gameMode: string;
    format?: string;
    whatsappGroupLink?: string;
    shareCode?: string;
    roomId?: string;
    roomPassword?: string;
    region?: string;
    streamUrl?: string;
    scoringEngine?: string;
    mapPool?: string;
    gameSettings?: string;
    rules?: string;
    prizeDistribution?: string;
    banner?: string;
    _count?: { teams: number };
    teams?: any[];
}

// Valorant-specific data
const VALORANT_MAPS = ['Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Breeze', 'Fracture', 'Pearl', 'Lotus', 'Sunset', 'Abyss'];
const VALORANT_AGENTS = [
    { name: 'Jett', role: 'Duelist' },
    { name: 'Reyna', role: 'Duelist' },
    { name: 'Phoenix', role: 'Duelist' },
    { name: 'Raze', role: 'Duelist' },
    { name: 'Sage', role: 'Sentinel' },
    { name: 'Killjoy', role: 'Sentinel' },
    { name: 'Cypher', role: 'Sentinel' },
    { name: 'Omen', role: 'Controller' },
    { name: 'Brimstone', role: 'Controller' },
    { name: 'Sova', role: 'Initiator' },
    { name: 'Fade', role: 'Initiator' },
];

const GAME_RULES: Record<string, string[]> = {
    'Valorant': [
        'Standard competitive rules (MR13 / First to 13 rounds)',
        'Overtime: Win by 2 rounds. After 3 overtime rounds, sudden death.',
        'Map veto system: Each team bans and picks maps alternately.',
        'All Agents are allowed unless specified otherwise.',
        'Riot Vanguard anti-cheat must be active at all times.',
        'Players must use their registered Riot ID.',
        'Disconnected players get 5 minutes to reconnect.',
        'Toxic behavior (voice/text) results in immediate disqualification.',
    ],
    'PUBG': [
        'Classic Battle Royale mode (Erangel / Miramar)',
        'Points: Kill = 1pt, Win = 15pt, Top 5 = 10pt, Top 10 = 5pt',
        'Emulators are NOT allowed in mobile lobbies.',
        'Players must use their registered PUBG ID.',
        'No teaming or collusion between teams.',
    ],
    'BGMI': [
        'Classic Battle Royale mode',
        'Points: Kill = 1pt, Win = 15pt, Top 5 = 10pt, Top 10 = 5pt',
        'Device: Mobile only, no emulators allowed.',
        'Players must use their registered BGMI ID.',
        'GFX tools or modified APKs are strictly banned.',
    ],
    'Free Fire': [
        'Battle Royale / Clash Squad mode',
        'Points: Kill = 1pt, Booyah = 12pt',
        'Only mobile devices allowed.',
        'Players must use their registered Free Fire UID.',
        'No hacks, mods, or third-party tools.',
    ],
};

const GAME_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    'Valorant': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', gradient: 'from-red-600/30 via-rose-500/10 to-background' },
    'PUBG': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', gradient: 'from-yellow-600/30 via-amber-500/10 to-background' },
    'BGMI': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', gradient: 'from-blue-600/30 via-sky-500/10 to-background' },
    'Free Fire': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', gradient: 'from-orange-600/30 via-amber-500/10 to-background' },
};

export default function TournamentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [registered, setRegistered] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'rules' | 'players'>('overview');
    const [userTeams, setUserTeams] = useState<any[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const [showTeamSelector, setShowTeamSelector] = useState(false);
    const [myParticipant, setMyParticipant] = useState<any>(null);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);

    useEffect(() => {
        if (params.id) { fetchTournament(); }
    }, [params.id]);

    const fetchTournament = async () => {
        try {
            const res = await api.get(`/tournaments/${params.id}`);
            setTournament(res.data);
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (token && userStr) {
                const user = JSON.parse(userStr);
                const userId = user.id;
                const participants = res.data.teams || []; // tournament.teams is actually participants list
                const me = participants.find((p: any) => p.userId === userId && p.status !== 'CANCELLED');
                setMyParticipant(me);
                setRegistered(!!me);

                if (me?.teamId) {
                    setSelectedTeamId(me.teamId);
                    // Filter other members of the same team in this tournament
                    const sameTeam = participants.filter((p: any) => p.teamId === me.teamId);
                    setTeamMembers(sameTeam);
                }

                // Fetch user's teams for selection if it's a team tournament
                if (res.data.gameMode !== 'SOLO') {
                    const teamsRes = await api.get('/teams');
                    setUserTeams(teamsRes.data || []);
                }
            }
        } catch (err) {
            console.error('Failed to fetch tournament:', err);
        } finally {
            setLoading(false);
        }
    };


    const handleRegister = async () => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        if (!tournament) return;

        // Validation for Team Mode
        if (tournament.gameMode !== 'SOLO' && !selectedTeamId) {
            setShowTeamSelector(true);
            return;
        }

        // Case 1: FREE Entry
        if (tournament.entryFeePerPerson <= 0) {
            setRegistering(true);
            try {
                const res = await api.post(`/tournaments/${params.id}/register`, {
                    teamId: selectedTeamId
                });
                setRegistered(true);
                alert(res.data.message || 'Registered successfully! 🎉');
                fetchTournament(); // Refresh
            } catch (err: any) {
                alert(err.response?.data?.message || 'Registration failed');
            } finally {
                setRegistering(false);
            }
            return;
        }

        // Case 2: PAID Entry -> Cashfree hosted payment page (redirect)
        handleCashfreeRegister();
    };

    const handleCashfreeRegister = async () => {
        if (!tournament) return;
        setRegistering(true);
        try {
            // Step 1: Create Order on backend with team selection
            const orderRes = await api.post(`/tournaments/${params.id}/create-order`, {
                teamId: selectedTeamId
            });
            const { payment_session_id, cf_env } = orderRes.data;

            // Step 2: Initialize Cashfree SDK and Open Checkout
            const cashfree = await load({
                mode: cf_env === 'PRODUCTION' ? 'production' : 'sandbox'
            });

            await cashfree.checkout({
                paymentSessionId: payment_session_id,
                redirectTarget: "_self",
            });

        } catch (err: any) {
            console.error('Cashfree Error:', err);
            alert(err.response?.data?.message || 'Payment initiation failed');
            setRegistering(false);
        }
    };

    // Handle return from Cashfree
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('order_id');
        if (orderId && params.id && !registered) {
            handleVerifyCashfree(orderId);
        }
    }, [params.id]);

    const handleVerifyCashfree = async (orderId: string) => {
        setRegistering(true);
        const urlParams = new URLSearchParams(window.location.search);
        const teamId = urlParams.get('team_id');

        try {
            const verifyRes = await api.post(`/tournaments/${params.id}/register`, {
                orderId: orderId,
                paymentId: orderId,
                signature: 'CASHFREE_DIRECT',
                teamId: teamId || undefined
            });
            setRegistered(true);
            alert(verifyRes.data.message || 'Payment Verified & Registered! 🎉');
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
            fetchTournament(); // Refresh stats
        } catch (err: any) {
            console.error('Final verification failed:', err);
            alert(err.response?.data?.message || 'Verification failed. Please contact support.');
        } finally {
            setRegistering(false);
        }
    };

    // Countdown timer
    const countdown = useMemo(() => {
        if (!tournament) return null;
        const now = new Date().getTime();
        const start = new Date(tournament.startDate).getTime();
        const diff = start - now;
        if (diff <= 0) return null;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return { days, hours, mins };
    }, [tournament]);

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'HIGH': return 'bg-gradient-to-r from-red-500 to-orange-500 text-white';
            case 'MEDIUM': return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white';
            default: return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'LIVE': case 'ONGOING':
                return <Badge className="bg-red-500 text-white animate-pulse"><span className="w-2 h-2 rounded-full bg-white mr-1.5 inline-block" />LIVE</Badge>;
            case 'COMPLETED':
                return <Badge className="bg-gray-500 text-white">COMPLETED</Badge>;
            case 'CANCELLED':
                return <Badge className="bg-yellow-600 text-white">CANCELLED</Badge>;
            default:
                return <Badge className="bg-green-500 text-white">UPCOMING</Badge>;
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" /><p className="text-muted-foreground">Loading tournament...</p></div>
        </div>
    );

    if (!tournament) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <AlertCircle className="h-14 w-14 text-muted-foreground" />
            <h2 className="text-2xl font-bold">Tournament Not Found</h2>
            <Link href="/tournaments"><Button variant="outline">Back to Tournaments</Button></Link>
        </div>
    );

    const spotsLeft = tournament.maxTeams - (tournament._count?.teams || 0);
    const isFull = spotsLeft <= 0;
    const fillPercent = Math.min(((tournament._count?.teams || 0) / tournament.maxTeams) * 100, 100);
    const isValornat = tournament.game.toUpperCase() === 'VALORANT';
    const gameColor = GAME_COLORS[tournament.game] || GAME_COLORS['Valorant'];
    const gameRules = GAME_RULES[tournament.game] || GAME_RULES['Valorant'];

    return (
        <div className="min-h-screen bg-background">
            <div className={cn(
                "relative overflow-hidden border-b min-h-[40vh] flex flex-col justify-end pb-12",
                !tournament.banner && `bg-gradient-to-br ${gameColor.gradient}`
            )}>
                {tournament.banner && (
                    <div className="absolute inset-0 z-0">
                        <img
                            src={tournament.banner}
                            alt={tournament.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                    </div>
                )}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] dark:opacity-[0.1] z-[1]" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-[2]" />

                <div className="container max-w-6xl relative z-10 px-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Link href="/tournaments" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-all group">
                            <div className="p-2 rounded-xl bg-background/20 backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
                                <ArrowLeft className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">Back to Arena</span>
                        </Link>
                    </motion.div>

                    <div className="flex flex-wrap gap-3 mb-6">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
                            {getStatusBadge(tournament.status)}
                        </motion.div>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
                            <Badge className={cn("font-black tracking-widest uppercase border-0 rounded-lg px-3 py-1", getTierColor(tournament.tier))}>
                                {tournament.tier} TIER
                            </Badge>
                        </motion.div>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}>
                            <Badge variant="outline" className={cn("font-black tracking-widest uppercase border-white/20 bg-white/5 backdrop-blur-md rounded-lg px-3 py-1", gameColor.text)}>
                                <Gamepad2 className="mr-2 h-3.5 w-3.5" /> {tournament.game}
                            </Badge>
                        </motion.div>
                    </div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.9] italic"
                    >
                        {tournament.title.toUpperCase()}
                    </motion.h1>

                    {/* Countdown Overlay for Mobile */}
                    {countdown && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center gap-6 p-4 rounded-[2rem] bg-background/40 backdrop-blur-xl border border-white/10 w-fit"
                        >
                            <div className="flex gap-4">
                                {[
                                    { value: countdown.days, label: 'Days' },
                                    { value: countdown.hours, label: 'Hours' },
                                    { value: countdown.mins, label: 'Mins' },
                                ].map((unit, i) => (
                                    <div key={i} className="text-center group">
                                        <div className="text-3xl font-black text-primary tracking-tighter leading-none mb-1 group-hover:scale-110 transition-transform">{unit.value}</div>
                                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{unit.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="h-10 w-[1px] bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Battle Starts In</span>
                                <span className="text-xs font-bold text-muted-foreground">{formatDate(tournament.startDate).split('•')[0]}</span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="container max-w-6xl py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT: Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quick Stats - Horizontal Snap on Mobile */}
                        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x">
                            {[
                                { icon: Trophy, label: 'Prize Pool', value: `${tournament.prizePool.toLocaleString('en-IN')} Coins`, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                                { icon: Wallet, label: 'Entry Fee', value: tournament.entryFeePerPerson > 0 ? `${tournament.entryFeePerPerson} Coins` : 'FREE', color: 'text-green-500', bg: 'bg-green-500/10' },
                                { icon: Users, label: 'Spots', value: `${tournament._count?.teams || 0}/${tournament.maxTeams}`, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                { icon: Calendar, label: 'Start Date', value: new Date(tournament.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), color: 'text-purple-500', bg: 'bg-purple-500/10' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 + i * 0.1 }}
                                    className="snap-start shrink-0 min-w-[160px] md:min-w-0 md:flex-1"
                                >
                                    <Card className="overflow-hidden rounded-3xl border-border/40 bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all duration-300">
                                        <CardContent className="p-5">
                                            <div className={cn("inline-flex p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-500", stat.bg)}>
                                                <stat.icon className={cn("h-6 w-6", stat.color)} />
                                            </div>
                                            <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Spots Progress */}
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium">Registration Progress</span>
                                    <span className={`text-sm font-bold ${isFull ? 'text-red-500' : 'text-primary'}`}>
                                        {isFull ? '🔥 FULL' : `${spotsLeft} spots left`}
                                    </span>
                                </div>
                                <div className="h-3 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${isFull ? 'bg-red-500' : fillPercent > 70 ? 'bg-orange-500' : 'bg-primary'}`}
                                        style={{ width: `${fillPercent}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Premium Tabs - App Segments */}
                        <div className="flex p-1.5 gap-1 bg-muted/30 backdrop-blur-md rounded-2xl border border-border/40 overflow-x-auto scrollbar-hide">
                            {(['overview', 'leaderboard', 'rules', 'players'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest transition-all rounded-xl whitespace-nowrap",
                                        activeTab === tab
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[0.98]"
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    {tab === 'overview' && <Target className="h-4 w-4" />}
                                    {tab === 'leaderboard' && <Trophy className="h-4 w-4" />}
                                    {tab === 'rules' && <Shield className="h-4 w-4" />}
                                    {tab === 'players' && <Users className="h-4 w-4" />}
                                    <span className="hidden sm:inline">{tab}</span>
                                    {tab === 'players' && <span className="text-[10px] opacity-70">({tournament.teams?.length || 0})</span>}
                                </button>
                            ))}
                        </div>

                        {/* Leaderboard Tab */}
                        {activeTab === 'leaderboard' && (
                            <div className="space-y-6">
                                <LiveLeaderboard tournamentId={tournament.id} />
                            </div>
                        )}

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Schedule */}
                                <Card>
                                    <CardHeader><CardTitle className="text-lg">Schedule & Details</CardTitle></CardHeader>
                                    <CardContent className="space-y-3">
                                        {[
                                            { icon: Calendar, label: 'Start', value: formatDate(tournament.startDate) },
                                            tournament.endDate && { icon: Calendar, label: 'End', value: formatDate(tournament.endDate) },
                                            { icon: Swords, label: 'Mode', value: tournament.gameMode },
                                            { icon: Gamepad2, label: 'Game', value: tournament.game },
                                        ].filter(Boolean).map((item: any, i) => (
                                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition">
                                                <div className="p-2 rounded-lg bg-primary/10"><item.icon className="h-4 w-4 text-primary" /></div>
                                                <div><p className="text-xs text-muted-foreground">{item.label}</p><p className="font-medium text-sm">{item.value}</p></div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* Valorant Map Pool */}
                                {isValornat && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <MapPin className="h-5 w-5 text-red-400" /> Map Pool
                                            </CardTitle>
                                            <CardDescription>Maps available for this tournament</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                {VALORANT_MAPS.map(map => (
                                                    <div key={map} className="p-3 rounded-xl bg-gradient-to-br from-red-500/5 to-transparent border border-red-500/10 text-center hover:border-red-500/30 transition">
                                                        <MapPin className="h-5 w-5 mx-auto mb-1 text-red-400/60" />
                                                        <span className="text-xs font-bold">{map}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Valorant Agent Roles */}
                                {isValornat && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Target className="h-5 w-5 text-red-400" /> Agent Roster
                                            </CardTitle>
                                            <CardDescription>All agents are allowed for competitive play</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {VALORANT_AGENTS.map(agent => (
                                                    <div key={agent.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${agent.role === 'Duelist' ? 'bg-red-500/20 text-red-400' :
                                                            agent.role === 'Sentinel' ? 'bg-green-500/20 text-green-400' :
                                                                agent.role === 'Controller' ? 'bg-purple-500/20 text-purple-400' :
                                                                    'bg-blue-500/20 text-blue-400'}`}>
                                                            {agent.name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{agent.name}</p>
                                                            <p className="text-[10px] text-muted-foreground">{agent.role}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Prize Distribution */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Crown className="h-5 w-5 text-yellow-500" /> Prize Distribution
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {[
                                                { position: '🥇 1st Place', pct: 50, color: 'from-yellow-500/20 to-amber-500/5 border-yellow-500/30' },
                                                { position: '🥈 2nd Place', pct: 30, color: 'from-gray-400/20 to-gray-400/5 border-gray-400/30' },
                                                { position: '🥉 3rd Place', pct: 20, color: 'from-orange-600/20 to-orange-600/5 border-orange-600/30' },
                                            ].map((prize, i) => (
                                                <div key={i} className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${prize.color} border`}>
                                                    <span className="font-bold">{prize.position}</span>
                                                    <span className="font-bold text-lg">{Math.round(tournament.prizePool * prize.pct / 100).toLocaleString('en-IN')} Coins</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Rules Tab */}
                        {activeTab === 'rules' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-primary" />
                                        {tournament.game} Tournament Rules
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {gameRules.map((rule, i) => (
                                            <div key={i} className="flex gap-3 p-3 rounded-lg hover:bg-muted/30 transition group">
                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition">
                                                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed pt-1">{rule}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3">
                                        <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-yellow-600">Fair Play Policy</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Any form of cheating, exploitation, or unsportsmanlike conduct will result in immediate disqualification and permanent ban.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Players Tab */}
                        {activeTab === 'players' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Registered Players ({tournament.teams?.length || 0})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {(!tournament.teams || tournament.teams.length === 0) ? (
                                        <div className="text-center py-10 text-muted-foreground">
                                            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                            <p className="font-medium">No registrations yet</p>
                                            <p className="text-sm">Be the first to register!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {tournament.teams.map((p: any, i: number) => (
                                                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                                                            #{i + 1}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium">{p.user?.name || 'Anonymous'}</p>
                                                                {p.team?.name && (
                                                                    <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 border-primary/30 bg-primary/5 text-primary uppercase font-black">
                                                                        {p.team.name}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                Joined {new Date(p.registeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className={`text-xs ${p.status === 'APPROVED' ? 'text-green-500 border-green-500/30' : 'text-yellow-500 border-yellow-500/30'}`}>
                                                        {p.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* RIGHT: Registration Sidebar */}
                    <div className="space-y-6">
                        <Card className="sticky top-24 border-primary/20 shadow-lg overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-primary via-blue-500 to-purple-500" />
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Join This Tournament</CardTitle>
                                <CardDescription>
                                    {isFull ? '🔥 This tournament is full.' : `${spotsLeft} of ${tournament.maxTeams} spots remaining`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <TournamentActivityFeed tournamentId={tournament.id} />

                                {/* Team Selection (if not SOLO) */}
                                {tournament.gameMode !== 'SOLO' && !registered && (
                                    <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-primary">Select Your Squad</label>
                                            <Link href="/dashboard/teams" className="text-[10px] text-muted-foreground hover:text-primary transition underline">Manage Teams</Link>
                                        </div>
                                        {userTeams.length === 0 ? (
                                            <div className="text-center py-2">
                                                <p className="text-[10px] text-muted-foreground mb-2 text-wrap">You don&apos;t have any teams yet.</p>
                                                <Link href="/dashboard/teams">
                                                    <Button size="sm" variant="outline" className="w-full text-[10px] h-8 bg-background">Create Team</Button>
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select
                                                    value={selectedTeamId}
                                                    onChange={(e) => setSelectedTeamId(e.target.value)}
                                                    className="w-full p-2.5 pl-3 rounded-lg bg-background border border-border text-xs font-bold focus:ring-2 ring-primary/20 outline-none appearance-none cursor-pointer pr-8"
                                                >
                                                    <option value="">-- Select Team --</option>
                                                    {userTeams.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground rotate-90 pointer-events-none" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Payment Status (if registered in a team) */}
                                {registered && tournament.gameMode !== 'SOLO' && teamMembers.length > 0 && (
                                    <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Squad Readiness</label>
                                            <Badge variant="outline" className="text-[10px] h-5 bg-background">
                                                {teamMembers.length} / {tournament.gameMode === 'DUO' ? 2 : (tournament.gameMode === 'SQUAD' ? 4 : 5)}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2">
                                            {teamMembers.map((m: any) => (
                                                <div key={m.id} className="flex items-center justify-between">
                                                    <span className="text-[11px] font-medium truncate max-w-[120px]">{m.user?.name}</span>
                                                    <Badge className="bg-green-500/10 text-green-500 text-[9px] h-4 py-0 border-green-500/20">PAID</Badge>
                                                </div>
                                            ))}
                                            {/* Show placeholder for missing members */}
                                            {Array.from({ length: (tournament.gameMode === 'DUO' ? 2 : (tournament.gameMode === 'SQUAD' ? 4 : 5)) - teamMembers.length }).map((_, i) => (
                                                <div key={i} className="flex items-center justify-between opacity-40">
                                                    <span className="text-[11px]">Waiting...</span>
                                                    <Badge variant="outline" className="text-[9px] h-4 py-0">PENDING</Badge>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[9px] text-muted-foreground text-center">Share the tournament link with your teammates so they can pay and join!</p>
                                    </div>
                                )}

                                {/* Pricing */}
                                <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Entry Fee</span>
                                        <span className="text-2xl font-bold text-primary">
                                            {tournament.entryFeePerPerson > 0 ? `${tournament.entryFeePerPerson} Coins` : 'FREE'}
                                        </span>
                                    </div>
                                    {tournament.entryFeePerPerson > 0 && (
                                        <div className="flex justify-end gap-2 mt-2">
                                            <Badge variant="outline" className="text-[10px] h-5">UPI</Badge>
                                            <Badge variant="outline" className="text-[10px] h-5">Cards</Badge>
                                            <Badge variant="outline" className="text-[10px] h-5">NetBanking</Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Registration Button */}
                                {registered ? (
                                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            <span className="font-bold text-green-600">You&apos;re Registered!</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">You will be added to the tournament group soon. Check your notifications.</p>
                                    </div>
                                ) : (
                                    <Button
                                        size="lg"
                                        className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20"
                                        onClick={handleRegister}
                                        disabled={registering || isFull}
                                    >
                                        {registering ? (
                                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Registering...</>
                                        ) : isFull ? (
                                            '🔒 Tournament Full'
                                        ) : (
                                            <>Register Now {tournament.entryFeePerPerson > 0 ? `— ${tournament.entryFeePerPerson} Coins` : '— Free'}</>
                                        )}
                                    </Button>
                                )}

                                {/* WhatsApp Link */}
                                {tournament.whatsappGroupLink && registered && (
                                    <a href={tournament.whatsappGroupLink} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" className="w-full">
                                            <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                                            Join WhatsApp Group
                                            <ExternalLink className="h-3 w-3 ml-auto" />
                                        </Button>
                                    </a>
                                )}

                                {/* Room Credentials (show only to registered users) */}
                                {registered && tournament.roomId && (
                                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2">
                                        <h4 className="text-sm font-bold flex items-center gap-2">
                                            <Hash className="h-4 w-4 text-blue-400" /> Room Credentials
                                        </h4>
                                        <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                                            <span className="text-xs text-muted-foreground">Room ID</span>
                                            <span className="text-sm font-mono font-bold">{tournament.roomId}</span>
                                        </div>
                                        {tournament.roomPassword && (
                                            <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                                                <span className="text-xs text-muted-foreground">Password</span>
                                                <span className="text-sm font-mono font-bold">{tournament.roomPassword}</span>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-muted-foreground">Use these to join the custom room. Do NOT share with non-participants.</p>
                                    </div>
                                )}

                                {/* Share Link */}
                                {tournament.shareCode && (
                                    <div className="space-y-2">
                                        <Button
                                            variant="outline"
                                            className="w-full text-sm"
                                            onClick={() => {
                                                const link = `${window.location.origin}/tournaments/share/${tournament.shareCode}`;
                                                navigator.clipboard.writeText(link);
                                                alert('Share link copied!');
                                            }}
                                        >
                                            <Share2 className="h-4 w-4 mr-2" /> Share Tournament
                                            <Copy className="h-3 w-3 ml-auto" />
                                        </Button>
                                        <a
                                            href={`https://wa.me/?text=${encodeURIComponent(`🏆 Join this tournament!\n🎮 ${tournament.title}\n💰 Entry: ${tournament.entryFeePerPerson ? tournament.entryFeePerPerson + ' Coins' : 'FREE'}\n🔗 ${typeof window !== 'undefined' ? window.location.origin : ''}/tournaments/share/${tournament.shareCode}`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button variant="outline" className="w-full text-xs">
                                                <MessageCircle className="h-3 w-3 mr-1 text-green-500" /> Share via WhatsApp
                                            </Button>
                                        </a>
                                    </div>
                                )}

                                {/* Stream Link */}
                                {tournament.streamUrl && (
                                    <a href={tournament.streamUrl} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" className="w-full text-sm">
                                            <Globe className="h-4 w-4 mr-2 text-red-500" /> Watch Live Stream
                                            <ExternalLink className="h-3 w-3 ml-auto" />
                                        </Button>
                                    </a>
                                )}

                                {/* Region */}
                                {tournament.region && (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs text-muted-foreground">
                                        <Globe className="h-3 w-3" />
                                        <span>Server: <strong className="text-foreground">{tournament.region}</strong></span>
                                    </div>
                                )}

                                <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
                                    By registering, you agree to our Terms and Fair Play Policy.
                                    Entry fees are non-refundable once the match begins.
                                </p>

                                {/* Trust badges */}
                                <div className="flex justify-center gap-4 pt-2 border-t">
                                    {[
                                        { icon: Shield, label: 'Secure' },
                                        { icon: Zap, label: 'Instant' },
                                        { icon: Star, label: 'Verified' },
                                    ].map((b, i) => (
                                        <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <b.icon className="h-3 w-3" />
                                            <span>{b.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            {/* ===== STICKY MOBILE JOIN BAR ===== */}
            <AnimatePresence>
                {!registered && !loading && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:hidden bg-background/80 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] pb-safe"
                    >
                        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Entry Fee</span>
                                <span className="text-2xl font-black text-primary">
                                    {tournament.entryFeePerPerson > 0 ? `${tournament.entryFeePerPerson} Coins` : 'FREE'}
                                </span>
                            </div>
                            <Button
                                size="lg"
                                className="grow h-14 rounded-2xl font-black tracking-widest uppercase shadow-lg shadow-primary/40 active:scale-95 transition-transform"
                                onClick={handleRegister}
                                disabled={registering || isFull}
                            >
                                {registering ? <Loader2 className="animate-spin" /> : isFull ? 'FULL' : 'REGISTER NOW'}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
