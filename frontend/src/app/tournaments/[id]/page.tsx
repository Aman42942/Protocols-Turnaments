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
import { LiveLeaderboard } from '@/components/tournament/LiveLeaderboard';
import { TournamentActivityFeed } from '@/components/tournament/TournamentActivityFeed';

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
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'rules' | 'players'>('overview');

    useEffect(() => {
        if (params.id) { fetchTournament(); }
    }, [params.id]);

    const fetchTournament = async () => {
        try {
            const res = await api.get(`/tournaments/${params.id}`);
            setTournament(res.data);
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            if (token && user) {
                const userId = JSON.parse(user).id;
                const isRegistered = res.data.teams?.some((t: any) => t.userId === userId);
                setRegistered(!!isRegistered);
            }
        } catch (err) { console.error('Failed to fetch tournament:', err); } finally { setLoading(false); }
    };

    const handleRegister = async () => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        if (!tournament) return;

        setRegistering(true);
        try {
            // Case 1: FREE Entry
            if (tournament.entryFeePerPerson <= 0) {
                const res = await api.post(`/tournaments/${params.id}/register`);
                setRegistered(true);
                alert(res.data.message || 'Registered successfully! 🎉');
                setRegistering(false);
                return;
            }

            // Case 2: PAID Entry -> Razorpay
            // Step 1: Create Order
            const orderRes = await api.post(`/tournaments/${params.id}/payment-order`);
            const { id: orderId, amount, key_id, currency } = orderRes.data;

            if (!key_id) {
                throw new Error("Payment gateway not configured");
            }

            // Step 2: Open Checkout
            const options = {
                key: key_id,
                amount: amount,
                currency: currency,
                name: "Protocol Tournaments",
                description: `Entry Fee for ${tournament.title}`,
                order_id: orderId,
                handler: async function (response: any) {
                    try {
                        // Step 3: Verify & Register
                        const verifyRes = await api.post(`/tournaments/${params.id}/register`, {
                            paymentId: response.razorpay_payment_id,
                            orderId: response.razorpay_order_id,
                            signature: response.razorpay_signature,
                        });
                        setRegistered(true);
                        alert(verifyRes.data.message || 'Registered successfully! 🎉');
                    } catch (err: any) {
                        alert(err.response?.data?.message || 'Verification failed');
                    } finally {
                        setRegistering(false);
                    }
                },
                prefill: {
                    name: JSON.parse(localStorage.getItem('user') || '{}').name,
                    email: JSON.parse(localStorage.getItem('user') || '{}').email,
                },
                theme: {
                    color: "#22c55e"
                },
                modal: {
                    ondismiss: function () {
                        setRegistering(false);
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (err: any) {
            alert(err.response?.data?.message || 'Registration failed.');
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
            {/* ===== HERO BANNER ===== */}
            <div className={`relative overflow-hidden bg-gradient-to-br ${gameColor.gradient} border-b`}>
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="container max-w-6xl py-8">
                    <Link href="/tournaments" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm">
                        <ArrowLeft className="h-4 w-4" /> All Tournaments
                    </Link>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {getStatusBadge(tournament.status)}
                        <Badge className={getTierColor(tournament.tier)}>{tournament.tier} TIER</Badge>
                        <Badge variant="outline" className={`${gameColor.text} ${gameColor.border}`}>
                            <Gamepad2 className="mr-1 h-3 w-3" /> {tournament.game}
                        </Badge>
                        <Badge variant="outline"><Swords className="mr-1 h-3 w-3" /> {tournament.gameMode}</Badge>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">{tournament.title}</h1>
                    {tournament.description && (
                        <p className="text-muted-foreground text-lg max-w-3xl mb-6">{tournament.description}</p>
                    )}

                    {/* Countdown Timer */}
                    {countdown && (
                        <div className="flex items-center gap-4 mb-4">
                            <Timer className="h-5 w-5 text-primary" />
                            <span className="text-sm text-muted-foreground font-medium">Starts in:</span>
                            <div className="flex gap-3">
                                {[
                                    { value: countdown.days, label: 'Days' },
                                    { value: countdown.hours, label: 'Hours' },
                                    { value: countdown.mins, label: 'Mins' },
                                ].map((unit, i) => (
                                    <div key={i} className="text-center">
                                        <div className="bg-background/80 backdrop-blur border rounded-lg px-3 py-2 min-w-[52px]">
                                            <span className="text-xl font-bold text-primary">{unit.value}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-medium">{unit.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="container max-w-6xl py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT: Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { icon: Trophy, label: 'Prize Pool', value: `₹${tournament.prizePool.toLocaleString('en-IN')}`, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                                { icon: Wallet, label: 'Entry Fee', value: tournament.entryFeePerPerson > 0 ? `₹${tournament.entryFeePerPerson}` : 'FREE', color: 'text-green-500', bg: 'bg-green-500/10' },
                                { icon: Users, label: 'Spots', value: `${tournament._count?.teams || 0}/${tournament.maxTeams}`, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                { icon: Calendar, label: 'Start Date', value: new Date(tournament.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), color: 'text-purple-500', bg: 'bg-purple-500/10' },
                            ].map((stat, i) => (
                                <Card key={i} className="overflow-hidden">
                                    <CardContent className="p-4">
                                        <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-3`}>
                                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                        </div>
                                        <p className="text-xl font-bold">{stat.value}</p>
                                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                                    </CardContent>
                                </Card>
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

                        {/* Tabs */}
                        <div className="flex gap-1 border-b overflow-x-auto">
                            {(['overview', 'leaderboard', 'rules', 'players'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap ${activeTab === tab
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                >
                                    {tab === 'overview' && <Target className="inline h-4 w-4 mr-1.5" />}
                                    {tab === 'leaderboard' && <Trophy className="inline h-4 w-4 mr-1.5" />}
                                    {tab === 'rules' && <Shield className="inline h-4 w-4 mr-1.5" />}
                                    {tab === 'players' && <Users className="inline h-4 w-4 mr-1.5" />}
                                    {tab} {tab === 'players' && `(${tournament.teams?.length || 0})`}
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
                                                    <span className="font-bold text-lg">₹{Math.round(tournament.prizePool * prize.pct / 100).toLocaleString('en-IN')}</span>
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
                                                            <p className="text-sm font-medium">{p.user?.name || 'Anonymous'}</p>
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
                                {/* Pricing */}
                                <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Entry Fee</span>
                                        <span className="text-2xl font-bold text-primary">
                                            {tournament.entryFeePerPerson > 0 ? `₹${tournament.entryFeePerPerson}` : 'FREE'}
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
                                            <>Register Now {tournament.entryFeePerPerson > 0 ? `— ₹${tournament.entryFeePerPerson}` : '— Free'}</>
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
                                            href={`https://wa.me/?text=${encodeURIComponent(`🏆 Join this tournament!\n🎮 ${tournament.title}\n💰 Entry: ₹${tournament.entryFeePerPerson || 'FREE'}\n🔗 ${typeof window !== 'undefined' ? window.location.origin : ''}/tournaments/share/${tournament.shareCode}`)}`}
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
        </div>
    );
}
