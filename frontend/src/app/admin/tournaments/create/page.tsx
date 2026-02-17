"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    ArrowLeft, Save, Loader2, Trophy, Gamepad2, Swords, MapPin, Shield,
    Target, Users, Wallet, Calendar, Globe, Link2, MessageCircle, Copy,
    CheckCircle, Zap, Crown, Eye, EyeOff, Settings2, Flame, Hash, TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

// ===== GAME CONFIGURATIONS =====
const GAME_CONFIGS = {
    VALORANT: {
        label: 'Valorant',
        icon: '🎯',
        color: 'from-red-600 to-rose-500',
        accent: 'text-red-400',
        bg: 'bg-red-500/10',
        modes: ['5v5 Competitive'],
        formats: ['Best of 1', 'Best of 3', 'Best of 5', 'Round Robin'],
        maps: ['Ascent', 'Bind', 'Breeze', 'Haven', 'Icebox', 'Lotus', 'Sunset', 'Split', 'Pearl', 'Fracture', 'Abyss'],
        regions: ['Mumbai', 'Singapore', 'Tokyo', 'Frankfurt', 'London', 'N. Virginia', 'Oregon', 'Illinois'],
        defaultMaxTeams: 16,
        defaultScoring: { win: 1, loss: 0 },
        settings: {
            mode: 'Tournament',
            cheats: 'Off',
            overtime: 'Win by Two',
            playOutAllRounds: 'Off',
            hideMatchHistory: 'Off',
            tacticalTimeouts: 2,
            techPauseDuration: 'Unlimited',
        },
        rules: [
            'Standard competitive rules (MR13 / First to 13 rounds)',
            'Overtime: Win by 2 rounds. After 3 OT rounds, sudden death.',
            'Map veto system: Teams ban and pick maps alternately.',
            'All Agents are allowed unless specified otherwise.',
            'Riot Vanguard anti-cheat must be active at all times.',
            'Players must use their registered Riot ID.',
            'Disconnected players get 5 minutes to reconnect.',
            'Each team gets 2 tactical timeouts per map (60 seconds each).',
            'Technical pauses: No communication allowed between players.',
            'Toxic behavior results in immediate disqualification.',
        ],
    },
    BGMI: {
        label: 'BGMI',
        icon: '🔫',
        color: 'from-blue-600 to-sky-500',
        accent: 'text-blue-400',
        bg: 'bg-blue-500/10',
        modes: ['Solo', 'Duo', 'Squad'],
        formats: ['Single Match', 'Multi-Match (3)', 'Multi-Match (6)', 'Round Robin'],
        maps: ['Erangel', 'Miramar', 'Sanhok', 'Vikendi', 'Livik', 'Nusa'],
        regions: ['India', 'SEA', 'MENA', 'Europe'],
        defaultMaxTeams: 25,
        defaultScoring: {
            "1": 10, "2": 6, "3": 5, "4": 4, "5": 3, "6": 2, "7": 1, "8": 1,
            "kill": 1
        },
        settings: {
            esportsMode: true,
            shrinkSpeed: 'x1.1',
            vagueInformation: true,
            allWeaponsSpawn: '2x',
            redZone: false,
            flareGuns: false,
            streamDelay: '10 minutes',
        },
        rules: [
            'Esports Mode must be enabled in custom room.',
            'Blue Zone: Shrink Speed x1.1 (PMGC Standard).',
            'Vague Information: ON — Kill feed is anonymized.',
            'All Weapons Spawn Rate: 2x for competitive.',
            'Red Zone: DISABLED — No random bombing.',
            'Flare Guns: DISABLED — No super airdrops.',
            'Stream delay: Minimum 10 minutes for broadcasts.',
            'Players must use registered BGMI ID.',
            'No emulators allowed in mobile lobbies.',
            'Points: 10-point system (1st=10, 2nd=6, ... + 1pt/kill).',
            'Tie-breaker: Total Wins → Placement Pts → Total Kills.',
        ],
    },
    PUBG: {
        label: 'PUBG Mobile',
        icon: '🍗',
        color: 'from-amber-600 to-yellow-500',
        accent: 'text-amber-500',
        bg: 'bg-amber-500/10',
        modes: ['Solo', 'Duo', 'Squad'],
        formats: ['Single Match', 'Multi-Match (3)', 'Multi-Match (6)', 'Round Robin'],
        maps: ['Erangel', 'Miramar', 'Sanhok', 'Vikendi', 'Karakin', 'Livik'],
        regions: ['Global', 'Asia', 'Europe', 'North America', 'South America', 'KR/JP'],
        defaultMaxTeams: 25,
        defaultScoring: {
            "1": 15, "2": 12, "3": 10, "4": 8, "5": 6, "6": 4, "7": 2, "8": 1,
            "kill": 1
        },
        settings: {
            esportsMode: true,
            hardcoreMode: false,
            redZone: false,
            flareGuns: false,
            vehicleSpawns: 'High',
            streamDelay: '15 minutes',
        },
        rules: [
            'Esports Mode must be enabled.',
            'Hardcore Mode: OFF (unless specified).',
            'Red Zone: DISABLED.',
            'Flare Guns: DISABLED.',
            'Stream delay: Minimum 15 minutes required.',
            'Emulators are stricly prohibited.',
            'Teaming/Hacking results in immediate ban.',
            'Points: 15-point system (1st=15, 2nd=12...).',
            'Tie-breaker: Total Wins → Placement Pts → Total Kills.',
        ],
    },
    FREEFIRE: {
        label: 'Free Fire',
        icon: '🔥',
        color: 'from-orange-600 to-amber-500',
        accent: 'text-orange-400',
        bg: 'bg-orange-500/10',
        modes: ['Battle Royale', 'Clash Squad'],
        formats: ['Single Match', 'Multi-Match (3)', 'Multi-Match (6)', 'Champion Rush'],
        maps: ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine'],
        regions: ['India', 'SEA', 'LATAM', 'MENA', 'Europe'],
        defaultMaxTeams: 12,
        defaultScoring: {
            "1": 12, "2": 9, "3": 8, "4": 7, "5": 6, "6": 5,
            "7": 4, "8": 3, "9": 2, "10": 1, "kill": 1
        },
        settings: {
            gunProperty: false,
            characterSkills: true,
            cyberAirdrop: true,
            defaultCoin: 1500,
            revivalPoints: true,
            glooWallExploits: false,
            clashSquadRounds: 13,
        },
        rules: [
            'BR Mode: Standard Battle Royale (Punch Table scoring).',
            'CS Mode: First to 7 wins (13 rounds maximum).',
            'Gun Property: OFF — All weapon skin stats disabled.',
            'Character Skills: Enabled (banned combos listed below).',
            'Cyber Airdrop: Enabled.',
            'Default Coin (CS): 1500.',
            'Revival Points: Enabled for BR mode.',
            'Gloo Wall glitching/exploits: BANNED.',
            'Scripting/macros (Auto-Gloo): INSTANT BAN.',
            'Players must use their registered Free Fire UID.',
            'Champion Rush: Cross 80pts then win a Booyah to win tournament.',
        ],
    },
};

type GameKey = keyof typeof GAME_CONFIGS;

// ===== PRIZE DISTRIBUTION PRESETS =====
const PRIZE_PRESETS = {
    'top1': [
        { place: '🥇 1st', percent: 100 },
    ],
    'top2': [
        { place: '🥇 1st', percent: 70 },
        { place: '🥈 2nd', percent: 30 },
    ],
    'top3': [
        { place: '🥇 1st', percent: 50 },
        { place: '🥈 2nd', percent: 30 },
        { place: '🥉 3rd', percent: 20 },
    ],
    'top4': [
        { place: '🥇 1st', percent: 45 },
        { place: '🥈 2nd', percent: 30 },
        { place: '🥉 3rd', percent: 15 },
        { place: '4th', percent: 10 },
    ],
    'top5': [
        { place: '🥇 1st', percent: 40 },
        { place: '🥈 2nd', percent: 25 },
        { place: '🥉 3rd', percent: 15 },
        { place: '4th', percent: 12 },
        { place: '5th', percent: 8 },
    ],
    'winner': [
        { place: '🏆 Winner', percent: 100 },
    ],
};

export default function CreateTournamentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [createdShareCode, setCreatedShareCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [step, setStep] = useState(1); // 1=Game, 2=Details, 3=Settings, 4=Review
    const [selectedGame, setSelectedGame] = useState<GameKey | ''>('');
    const [selectedMaps, setSelectedMaps] = useState<string[]>([]);
    const [prizePreset, setPrizePreset] = useState('top3');
    const [showRoomPassword, setShowRoomPassword] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            window.location.href = '/login';
            return;
        }

        try {
            const user = JSON.parse(userStr);
            if (user.role !== 'ADMIN') {
                window.location.href = '/';
                return;
            }
        } catch {
            window.location.href = '/login';
            return;
        }
    }, [router]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        game: '',
        gameMode: 'SQUAD',
        tier: 'LOW',
        format: 'SINGLE_ELIM',
        entryFeePerPerson: '',
        prizePool: '',
        startDate: '',
        startTime: '',
        maxTeams: '',
        region: '',
        whatsappGroupLink: '',
        discordChannelId: '',
        streamUrl: '',
        roomId: '',
        roomPassword: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const gameConfig = selectedGame ? GAME_CONFIGS[selectedGame] : null;

    const updateMaxTeams = (game: string, mode: string) => {
        let max = 100; // Default fallback
        if (game === 'VALORANT') max = 16;
        else if (game === 'BGMI' || game === 'PUBG') {
            if (mode === 'SOLO') max = 100;
            else if (mode === 'DUO') max = 50;
            else max = 25; // Squad
        } else if (game === 'FREEFIRE') {
            if (mode === 'SOLO') max = 50; // FF usually smaller map? or 48. Let's say 48.
            else if (mode === 'DUO') max = 24;
            else max = 12; // Squad
        }
        return String(max);
    };

    const handleSelectGame = (game: GameKey) => {
        setSelectedGame(game);
        const config = GAME_CONFIGS[game];
        const initialMode = game === 'VALORANT' ? 'TEAM_5V5' : 'SQUAD';
        setFormData(prev => ({
            ...prev,
            game: game,
            gameMode: initialMode,
            maxTeams: updateMaxTeams(game, initialMode),
        }));
        setSelectedMaps([...config.maps]);
        setStep(2);
    };

    const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newMode = e.target.value;
        setFormData(prev => ({
            ...prev,
            gameMode: newMode,
            maxTeams: updateMaxTeams(prev.game, newMode)
        }));
    };

    const toggleMap = (map: string) => {
        setSelectedMaps(prev =>
            prev.includes(map) ? prev.filter(m => m !== map) : [...prev, map]
        );
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const startDateTime = `${formData.startDate}T${formData.startTime || '00:00'}:00.000Z`;
            const config = GAME_CONFIGS[selectedGame as GameKey];

            const payload = {
                title: formData.title,
                description: formData.description || undefined,
                game: selectedGame,
                tier: formData.tier,
                entryFeePerPerson: parseFloat(formData.entryFeePerPerson) || 0,
                prizePool: parseFloat(formData.prizePool) || 0,
                startDate: startDateTime,
                maxTeams: parseInt(formData.maxTeams) || config.defaultMaxTeams,
                gameMode: formData.gameMode,
                format: formData.format,
                // Game-specific JSON
                scoringEngine: JSON.stringify(config.defaultScoring),
                mapPool: JSON.stringify(selectedMaps),
                gameSettings: JSON.stringify(config.settings),
                rules: JSON.stringify(config.rules),
                prizeDistribution: JSON.stringify(PRIZE_PRESETS[prizePreset as keyof typeof PRIZE_PRESETS]),
                // Room management
                roomId: formData.roomId || undefined,
                roomPassword: formData.roomPassword || undefined,
                // Links
                whatsappGroupLink: formData.whatsappGroupLink || undefined,
                discordChannelId: formData.discordChannelId || undefined,
                streamUrl: formData.streamUrl || undefined,
                region: formData.region || undefined,
            };

            const res = await api.post('/tournaments', payload);
            setCreatedShareCode(res.data.shareCode || '');
            setSuccess(true);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to create tournament');
        } finally {
            setLoading(false);
        }
    };

    const copyShareLink = () => {
        const link = `${window.location.origin}/tournaments/share/${createdShareCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ===== SUCCESS SCREEN =====
    if (success) {
        const shareLink = typeof window !== 'undefined'
            ? `${window.location.origin}/tournaments/share/${createdShareCode}` : '';
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-lg w-full text-center overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500" />
                    <CardContent className="p-8 space-y-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                            <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Tournament Created! 🎉</h2>
                            <p className="text-muted-foreground">Share the link with players to start registrations.</p>
                        </div>

                        {/* Share Link */}
                        <div className="p-4 rounded-xl bg-muted/50 border space-y-3">
                            <p className="text-sm font-medium">Share Tournament Link</p>
                            <div className="flex gap-2">
                                <Input value={shareLink} readOnly className="text-sm font-mono" />
                                <Button onClick={copyShareLink} variant="outline" size="sm">
                                    {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <a href={`https://wa.me/?text=${encodeURIComponent(`🏆 Join our tournament!\n${shareLink}`)}`} target="_blank" className="flex-1">
                                    <Button variant="outline" className="w-full text-xs">
                                        <MessageCircle className="h-3 w-3 mr-1 text-green-500" /> WhatsApp
                                    </Button>
                                </a>
                                <Button variant="outline" className="flex-1 text-xs" onClick={() => {
                                    navigator.clipboard.writeText(`🏆 Join our tournament!\n🎮 ${formData.title}\n💰 Entry: ₹${formData.entryFeePerPerson || 'FREE'}\n🔗 ${shareLink}`);
                                    alert('Copied to clipboard!');
                                }}>
                                    <Copy className="h-3 w-3 mr-1" /> Copy Message
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Link href="/admin/tournaments" className="flex-1">
                                <Button variant="outline" className="w-full">View All</Button>
                            </Link>
                            <Button className="flex-1" onClick={() => { setSuccess(false); setStep(1); setSelectedGame(''); setCreatedShareCode(''); }}>
                                Create Another
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-12">
            {/* Header */}
            <div className="border-b bg-card/50 backdrop-blur">
                <div className="container py-6">
                    <Link href="/admin/tournaments" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                        <ArrowLeft className="h-4 w-4" /> Back to Tournaments
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Trophy className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Create Tournament</h1>
                            <p className="text-sm text-muted-foreground">Set up game-specific rules and configurations</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="container py-6">
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                    {[
                        { n: 1, label: 'Select Game', icon: Gamepad2 },
                        { n: 2, label: 'Details', icon: Settings2 },
                        { n: 3, label: 'Game Settings', icon: Swords },
                        { n: 4, label: 'Review & Create', icon: CheckCircle },
                    ].map((s, i) => (
                        <React.Fragment key={s.n}>
                            <button
                                onClick={() => { if (selectedGame && s.n <= step) setStep(s.n); }}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${step === s.n ? 'bg-primary text-white shadow-lg' : step > s.n ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}
                            >
                                {step > s.n ? <CheckCircle className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                                {s.label}
                            </button>
                            {i < 3 && <div className={`hidden sm:block w-12 h-0.5 ${step > s.n ? 'bg-green-500' : 'bg-muted'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                {/* ===== STEP 1: SELECT GAME ===== */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-2">Choose Your Game</h2>
                            <p className="text-muted-foreground">Each game has unique tournament settings, scoring systems, and rules.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            {(Object.keys(GAME_CONFIGS) as GameKey[]).map(key => {
                                const config = GAME_CONFIGS[key];
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleSelectGame(key)}
                                        className="group text-left"
                                    >
                                        <Card className={`overflow-hidden hover:border-primary/50 transition-all hover:shadow-xl cursor-pointer h-full ${selectedGame === key ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                                            <div className={`h-32 bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                                                <span className="text-5xl">{config.icon}</span>
                                            </div>
                                            <CardContent className="p-5 space-y-3">
                                                <h3 className="text-xl font-bold">{config.label}</h3>
                                                <div className="space-y-2 text-sm text-muted-foreground">
                                                    <p className="flex items-center gap-2"><Swords className="h-3.5 w-3.5" /> {config.modes.join(', ')}</p>
                                                    <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {config.maps.length} Maps</p>
                                                    <p className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Up to {config.defaultMaxTeams} teams</p>
                                                    <p className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> {config.rules.length} Official Rules</p>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {config.modes.map(m => (
                                                        <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ===== STEP 2: TOURNAMENT DETAILS ===== */}
                {step === 2 && gameConfig && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-2xl">{gameConfig.icon}</span>
                                    {gameConfig.label} Tournament Details
                                </CardTitle>
                                <CardDescription>Basic info about your tournament</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Title */}
                                <div>
                                    <Label>Tournament Title *</Label>
                                    <Input name="title" value={formData.title} onChange={handleChange} placeholder={`e.g. ${gameConfig.label} Champions Series`} className="mt-1" />
                                </div>

                                {/* Description */}
                                <div>
                                    <Label>Description</Label>
                                    <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe your tournament, sponsors, special rules..." className="mt-1" rows={3} />
                                </div>

                                {/* Mode + Format */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Game Mode *</Label>
                                        <Select name="gameMode" value={formData.gameMode} onChange={handleModeChange} className="mt-1">
                                            {selectedGame === 'VALORANT' && <option value="TEAM_5V5">5v5 Competitive</option>}
                                            {selectedGame !== 'VALORANT' && (
                                                <>
                                                    <option value="SOLO">Solo</option>
                                                    <option value="DUO">Duo</option>
                                                    <option value="SQUAD">Squad</option>
                                                </>
                                            )}
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Format *</Label>
                                        <Select name="format" value={formData.format} onChange={handleChange} className="mt-1">
                                            {gameConfig.formats.map(f => (
                                                <option key={f} value={f.toUpperCase().replace(/\s+/g, '_').replace(/[()]/g, '')}>{f}</option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>

                                {/* Tier + Region */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Tier *</Label>
                                        <Select name="tier" value={formData.tier} onChange={handleChange} className="mt-1">
                                            <option value="LOW">🟢 Low — Casual</option>
                                            <option value="MEDIUM">🟡 Medium — Competitive</option>
                                            <option value="HIGH">🔴 High — Pro/Premier</option>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Server Region</Label>
                                        <Select name="region" value={formData.region} onChange={handleChange} className="mt-1">
                                            <option value="">Select Region</option>
                                            {gameConfig.regions.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>

                                {/* Date + Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Start Date *</Label>
                                        <Input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label>Start Time *</Label>
                                        <Input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="mt-1" />
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label>Entry Fee (₹)</Label>
                                        <Input type="number" name="entryFeePerPerson" value={formData.entryFeePerPerson} onChange={handleChange} placeholder="0 = Free" className="mt-1" />
                                    </div>
                                    <div>
                                        <Label>Prize Pool (₹)</Label>
                                        <Input type="number" name="prizePool" value={formData.prizePool} onChange={handleChange} placeholder="Total prize" className="mt-1" />
                                    </div>
                                    <div>
                                        <Label>Max Teams</Label>
                                        <Input type="number" name="maxTeams" value={formData.maxTeams} onChange={handleChange} className="mt-1" />
                                    </div>
                                </div>

                                {/* Financial Analysis */}
                                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border border-green-500/20 space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 rounded-lg bg-green-500/20 text-green-600">
                                            <TrendingUp className="h-4 w-4" />
                                        </div>
                                        <h4 className="font-bold text-sm text-green-700 dark:text-green-400">Profit Analysis</h4>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-3 rounded-lg bg-background/50 border shadow-sm">
                                            <p className="text-xs text-muted-foreground mb-1">Potential Revenue</p>
                                            <p className="font-bold text-green-600">
                                                ₹{((parseFloat(formData.entryFeePerPerson) || 0) * (parseInt(formData.maxTeams) || 0) * (formData.gameMode === 'SOLO' ? 1 : formData.gameMode === 'DUO' ? 2 : formData.game === 'VALORANT' ? 5 : 4)).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-background/50 border shadow-sm">
                                            <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
                                            <p className="font-bold text-red-500">
                                                -₹{(parseFloat(formData.prizePool) || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-background/50 border shadow-sm ring-1 ring-primary/20">
                                            <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
                                            <p className={`font-bold ${((parseFloat(formData.entryFeePerPerson) || 0) * (parseInt(formData.maxTeams) || 0) * (formData.gameMode === 'SOLO' ? 1 : formData.gameMode === 'DUO' ? 2 : formData.game === 'VALORANT' ? 5 : 4) - (parseFloat(formData.prizePool) || 0)) >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                                ₹{((parseFloat(formData.entryFeePerPerson) || 0) * (parseInt(formData.maxTeams) || 0) * (formData.gameMode === 'SOLO' ? 1 : formData.gameMode === 'DUO' ? 2 : formData.game === 'VALORANT' ? 5 : 4) - (parseFloat(formData.prizePool) || 0)).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-center text-muted-foreground">
                                        *Calculated based on full lobby ({(parseInt(formData.maxTeams) || 0) * (formData.gameMode === 'SOLO' ? 1 : formData.gameMode === 'DUO' ? 2 : formData.game === 'VALORANT' ? 5 : 4)} players). Actual revenue depends on registrations.
                                    </p>
                                </div>

                                {/* Prize Distribution */}
                                <div>
                                    <Label className="mb-2 block">Prize Distribution</Label>
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        {Object.entries({
                                            top1: 'Top 1',
                                            top2: 'Top 2',
                                            top3: 'Top 3',
                                            top4: 'Top 4',
                                            top5: 'Top 5',
                                            winner: 'Winner Takes All'
                                        }).map(([key, label]) => (
                                            <button
                                                key={key}
                                                onClick={() => setPrizePreset(key)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${prizePreset === key ? 'bg-primary text-white border-primary' : 'bg-muted text-muted-foreground border-transparent hover:border-primary/30'}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {PRIZE_PRESETS[prizePreset as keyof typeof PRIZE_PRESETS].map((p, i) => (
                                            <div key={i} className="p-3 rounded-lg bg-muted/50 text-center">
                                                <span className="text-sm font-bold">{p.place}</span>
                                                <p className="text-xs text-muted-foreground">{p.percent}% — ₹{Math.round((parseFloat(formData.prizePool) || 0) * p.percent / 100)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Links */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>WhatsApp Group Link</Label>
                                        <Input name="whatsappGroupLink" value={formData.whatsappGroupLink} onChange={handleChange} placeholder="https://chat.whatsapp.com/..." className="mt-1" />
                                    </div>
                                    <div>
                                        <Label>Stream URL</Label>
                                        <Input name="streamUrl" value={formData.streamUrl} onChange={handleChange} placeholder="https://youtube.com/live/..." className="mt-1" />
                                    </div>
                                </div>

                                {/* Room ID/Password (BGMI/FF only) */}
                                {(selectedGame === 'BGMI' || selectedGame === 'FREEFIRE') && (
                                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-4">
                                        <h4 className="font-bold flex items-center gap-2 text-sm">
                                            <Hash className="h-4 w-4 text-blue-400" />
                                            Custom Room Credentials
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            Room ID and Password will be shared with registered players only. You can update these later.
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Room ID</Label>
                                                <Input name="roomId" value={formData.roomId} onChange={handleChange} placeholder="e.g. 12345678" className="mt-1" />
                                            </div>
                                            <div>
                                                <Label>Room Password</Label>
                                                <div className="relative mt-1">
                                                    <Input
                                                        type={showRoomPassword ? 'text' : 'password'}
                                                        name="roomPassword"
                                                        value={formData.roomPassword}
                                                        onChange={handleChange}
                                                        placeholder="e.g. abc123"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowRoomPassword(!showRoomPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                                    >
                                                        {showRoomPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                <ArrowLeft className="h-4 w-4 mr-2" /> Change Game
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={() => setStep(3)}
                                disabled={!formData.title || !formData.startDate}
                            >
                                Next: Game Settings <Swords className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ===== STEP 3: GAME-SPECIFIC SETTINGS ===== */}
                {step === 3 && gameConfig && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Map Pool */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className={`h-5 w-5 ${gameConfig.accent}`} /> Map Pool
                                </CardTitle>
                                <CardDescription>Select maps for this tournament. Unselected maps will be excluded.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {gameConfig.maps.map(map => (
                                        <button
                                            key={map}
                                            onClick={() => toggleMap(map)}
                                            className={`p-3 rounded-xl border text-center text-sm font-medium transition-all ${selectedMaps.includes(map)
                                                ? `${gameConfig.bg} border-primary/30 shadow-sm`
                                                : 'bg-muted/30 border-transparent opacity-50 hover:opacity-80'}`}
                                        >
                                            <MapPin className={`h-4 w-4 mx-auto mb-1 ${selectedMaps.includes(map) ? gameConfig.accent : ''}`} />
                                            {map}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">{selectedMaps.length} maps selected</p>
                            </CardContent>
                        </Card>

                        {/* Scoring System */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className={`h-5 w-5 ${gameConfig.accent}`} /> Scoring System
                                </CardTitle>
                                <CardDescription>Official {gameConfig.label} competitive scoring</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {selectedGame === 'VALORANT' ? (
                                    <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                                        <p className="font-medium">5v5 Competitive — Round-based</p>
                                        <p className="text-sm text-muted-foreground">First to 13 rounds wins. Overtime: Win by 2.</p>
                                        <div className="flex gap-4 mt-3">
                                            <div className="p-3 rounded-lg bg-green-500/10 text-center flex-1">
                                                <p className="text-lg font-bold text-green-500">WIN</p>
                                                <p className="text-xs text-muted-foreground">+1 Point</p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-red-500/10 text-center flex-1">
                                                <p className="text-lg font-bold text-red-500">LOSS</p>
                                                <p className="text-xs text-muted-foreground">0 Points</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-5 gap-2">
                                            {Object.entries(gameConfig.defaultScoring)
                                                .filter(([k]) => k !== 'kill')
                                                .map(([place, pts]) => (
                                                    <div key={place} className={`p-2 rounded-lg text-center ${parseInt(place) <= 3 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-muted/30'}`}>
                                                        <p className="text-xs text-muted-foreground">#{place}</p>
                                                        <p className="text-lg font-bold">{pts as number}</p>
                                                    </div>
                                                ))}
                                        </div>
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                                            <span className="font-medium flex items-center gap-2">
                                                <Zap className="h-4 w-4 text-red-400" /> Per Kill
                                            </span>
                                            <span className="text-lg font-bold">+1</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Game-Specific Settings Display */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings2 className={`h-5 w-5 ${gameConfig.accent}`} /> {gameConfig.label} Settings
                                </CardTitle>
                                <CardDescription>Official esports mode configuration</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Object.entries(gameConfig.settings).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                            <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <Badge variant="outline" className={`text-xs ${value === true || value === 'On' ? 'text-green-500 border-green-500/30'
                                                : value === false || value === 'Off' ? 'text-red-500 border-red-500/30'
                                                    : 'text-primary border-primary/30'}`}>
                                                {String(value)}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Rules */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className={`h-5 w-5 ${gameConfig.accent}`} /> Official Rules
                                </CardTitle>
                                <CardDescription>{gameConfig.rules.length} rules will be displayed to players</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {gameConfig.rules.map((rule, i) => (
                                        <div key={i} className="flex gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition">
                                            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">{i + 1}</span>
                                            <span className="text-sm text-muted-foreground">{rule}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep(2)}>
                                <ArrowLeft className="h-4 w-4 mr-2" /> Back
                            </Button>
                            <Button className="flex-1" onClick={() => setStep(4)}>
                                Review & Create <CheckCircle className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ===== STEP 4: REVIEW & CREATE ===== */}
                {step === 4 && gameConfig && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        <Card className="overflow-hidden">
                            <div className={`h-2 bg-gradient-to-r ${gameConfig.color}`} />
                            <CardHeader>
                                <CardTitle>Review Tournament</CardTitle>
                                <CardDescription>Verify all details before creating</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Summary Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Game', value: `${gameConfig.icon} ${gameConfig.label}` },
                                        { label: 'Title', value: formData.title },
                                        { label: 'Mode', value: formData.gameMode },
                                        { label: 'Format', value: formData.format },
                                        { label: 'Tier', value: formData.tier },
                                        { label: 'Region', value: formData.region || 'Not set' },
                                        { label: 'Entry Fee', value: formData.entryFeePerPerson ? `₹${formData.entryFeePerPerson}` : 'FREE' },
                                        { label: 'Prize Pool', value: formData.prizePool ? `₹${formData.prizePool}` : '₹0' },
                                        { label: 'Max Teams', value: formData.maxTeams },
                                        { label: 'Start', value: `${formData.startDate} ${formData.startTime}` },
                                        { label: 'Maps', value: `${selectedMaps.length} selected` },
                                        { label: 'Rules', value: `${gameConfig.rules.length} rules` },
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between p-3 rounded-lg bg-muted/30">
                                            <span className="text-sm text-muted-foreground">{item.label}</span>
                                            <span className="text-sm font-medium">{item.value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Room Credentials */}
                                {(formData.roomId || formData.roomPassword) && (
                                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                        <p className="text-sm font-bold mb-2">🔐 Room Credentials</p>
                                        <p className="text-xs text-muted-foreground">Room ID: {formData.roomId} | Password: {'•'.repeat(formData.roomPassword.length)}</p>
                                    </div>
                                )}

                                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                                    <p className="text-sm text-muted-foreground">
                                        ✅ A <strong>unique share link</strong> will be generated automatically. Share it on WhatsApp, Discord, or any platform to invite players.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep(3)}>
                                <ArrowLeft className="h-4 w-4 mr-2" /> Back
                            </Button>
                            <Button
                                className="flex-1 h-14 text-lg font-bold"
                                onClick={handleSubmit}
                                disabled={loading || !formData.title || !formData.startDate}
                            >
                                {loading ? (
                                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Creating...</>
                                ) : (
                                    <><Trophy className="h-5 w-5 mr-2" /> Create Tournament</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
