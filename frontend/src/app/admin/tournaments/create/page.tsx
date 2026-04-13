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
    CheckCircle, Zap, Crown, Eye, EyeOff, Settings2, Flame, Hash, TrendingUp, RotateCcw,
    Trash2, Plus, Pencil, X, Undo2, Archive, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { MediaUpload } from '@/components/admin/MediaUpload';

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

interface GameConfig {
    label: string;
    icon: string;
    color: string;
    accent: string;
    bg: string;
    modes: string[];
    formats: string[];
    maps: string[];
    regions: string[];
    defaultMaxTeams: number;
    defaultScoring: Record<string, number>;
    settings: Record<string, any>;
    rules: string[];
}

const DEFAULT_GAME_CONFIGS: Record<string, GameConfig> = GAME_CONFIGS as any;

type GameKey = string;

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
    
    // Dynamic settings states
    const [dynamicScoring, setDynamicScoring] = useState<any>({});
    const [dynamicSettings, setDynamicSettings] = useState<any>({});
    const [dynamicRules, setDynamicRules] = useState<string[]>([]);

    // Dynamic Game Configs
    const [customGameConfigs, setCustomGameConfigs] = useState<Record<string, GameConfig>>(() => ({...DEFAULT_GAME_CONFIGS}));
    const [gameEditorOpen, setGameEditorOpen] = useState(false);
    const [editingGameKey, setEditingGameKey] = useState<string | null>(null);
    const [gameEditorData, setGameEditorData] = useState<GameConfig>({
        label: '', icon: '🎮', color: 'from-purple-600 to-pink-500', accent: 'text-purple-400', bg: 'bg-purple-500/10',
        modes: ['Squad'], formats: ['Single Match'], maps: [], regions: [],
        defaultMaxTeams: 25, defaultScoring: { '1': 10, '2': 6, '3': 5, kill: 1 },
        settings: {}, rules: [],
    });
    const [gameEditorMapsInput, setGameEditorMapsInput] = useState('');
    const [gameEditorRegionsInput, setGameEditorRegionsInput] = useState('');
    const [gameEditorModesInput, setGameEditorModesInput] = useState('');
    const [gameEditorFormatsInput, setGameEditorFormatsInput] = useState('');

    // Trash System
    const [trashedGames, setTrashedGames] = useState<Record<string, GameConfig>>({});
    const [showTrash, setShowTrash] = useState(false);

    const { isAdmin, loading: authLoading } = useAdminAuth();

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
        banner: '',
        shareMessage: '',
    });

    // Protect the page
    useEffect(() => {
        if (!authLoading && !isAdmin) {
            // redirection handled by hook or middleware, but safe double check
            window.location.href = '/';
        }
    }, [authLoading, isAdmin]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const gameConfig = selectedGame ? customGameConfigs[selectedGame] : null;

    const updateMaxTeams = (game: string, mode: string) => {
        const cfg = customGameConfigs[game];
        if (cfg) return String(cfg.defaultMaxTeams);
        return '100';
    };

    const handleSelectGame = (game: GameKey) => {
        setSelectedGame(game);
        const config = customGameConfigs[game];
        if (!config) return;
        const initialMode = config.modes.length === 1 && config.modes[0].includes('5v5') ? 'TEAM_5V5' : 'SQUAD';
        setFormData(prev => ({
            ...prev,
            game: game,
            gameMode: initialMode,
            maxTeams: String(config.defaultMaxTeams),
        }));
        setSelectedMaps([...config.maps]);
        
        // Initialize dynamic states from defaults
        setDynamicScoring({...config.defaultScoring});
        setDynamicSettings({...config.settings});
        setDynamicRules([...config.rules]);
        
        setStep(2);
    };

    // ===== GAME EDITOR FUNCTIONS =====
    const openGameEditor = (key?: string) => {
        if (key && customGameConfigs[key]) {
            setEditingGameKey(key);
            const cfg = customGameConfigs[key];
            setGameEditorData({...cfg, modes: [...cfg.modes], formats: [...cfg.formats], maps: [...cfg.maps], regions: [...cfg.regions], rules: [...cfg.rules], settings: {...cfg.settings}, defaultScoring: {...cfg.defaultScoring}});
            setGameEditorMapsInput(cfg.maps.join(', '));
            setGameEditorRegionsInput(cfg.regions.join(', '));
            setGameEditorModesInput(cfg.modes.join(', '));
            setGameEditorFormatsInput(cfg.formats.join(', '));
        } else {
            setEditingGameKey(null);
            setGameEditorData({
                label: '', icon: '🎮', color: 'from-purple-600 to-pink-500', accent: 'text-purple-400', bg: 'bg-purple-500/10',
                modes: [], formats: [], maps: [], regions: [],
                defaultMaxTeams: 25, defaultScoring: { '1': 10, '2': 6, '3': 5, kill: 1 },
                settings: {}, rules: [],
            });
            setGameEditorMapsInput('');
            setGameEditorRegionsInput('');
            setGameEditorModesInput('');
            setGameEditorFormatsInput('');
        }
        setGameEditorOpen(true);
    };

    const saveGameEditor = () => {
        if (!gameEditorData.label.trim()) { alert('Game name is required!'); return; }
        const key = editingGameKey || gameEditorData.label.toUpperCase().replace(/\s+/g, '_');
        const finalData: GameConfig = {
            ...gameEditorData,
            maps: gameEditorMapsInput.split(',').map(s => s.trim()).filter(Boolean),
            regions: gameEditorRegionsInput.split(',').map(s => s.trim()).filter(Boolean),
            modes: gameEditorModesInput.split(',').map(s => s.trim()).filter(Boolean),
            formats: gameEditorFormatsInput.split(',').map(s => s.trim()).filter(Boolean),
        };
        setCustomGameConfigs(prev => ({...prev, [key]: finalData}));
        setGameEditorOpen(false);
    };

    const deleteGame = (key: string) => {
        if (!confirm(`Move "${customGameConfigs[key]?.label}" to trash?`)) return;
        const deleted = customGameConfigs[key];
        if (!deleted) return;
        // Move to trash
        setTrashedGames(prev => ({...prev, [key]: deleted}));
        // Remove from active
        setCustomGameConfigs(prev => {
            const next = {...prev};
            delete next[key];
            return next;
        });
    };

    const restoreFromTrash = (key: string) => {
        const game = trashedGames[key];
        if (!game) return;
        // Move back to active
        setCustomGameConfigs(prev => ({...prev, [key]: game}));
        // Remove from trash
        setTrashedGames(prev => {
            const next = {...prev};
            delete next[key];
            return next;
        });
    };

    const emptyTrash = () => {
        if (!confirm(`Permanently delete ${Object.keys(trashedGames).length} game(s) from trash? This cannot be undone!`)) return;
        setTrashedGames({});
    };

    const resetToDefaults = () => {
        if (!confirm('Reset all games to defaults? This will restore Valorant, BGMI, PUBG Mobile, and Free Fire. Your custom games will remain.')) return;
        setCustomGameConfigs(prev => {
            const merged = {...prev};
            // Restore all default games
            Object.keys(DEFAULT_GAME_CONFIGS).forEach(key => {
                merged[key] = {...DEFAULT_GAME_CONFIGS[key]};
            });
            return merged;
        });
        // Also remove defaults from trash if they were there
        setTrashedGames(prev => {
            const next = {...prev};
            Object.keys(DEFAULT_GAME_CONFIGS).forEach(key => {
                delete next[key];
            });
            return next;
        });
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
            const config = customGameConfigs[selectedGame as string];

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
                // Game-specific JSON (Dynamic)
                scoringEngine: JSON.stringify(dynamicScoring),
                mapPool: JSON.stringify(selectedMaps),
                gameSettings: JSON.stringify(dynamicSettings),
                rules: JSON.stringify(dynamicRules),
                prizeDistribution: JSON.stringify(PRIZE_PRESETS[prizePreset as keyof typeof PRIZE_PRESETS]),
                // Room management
                roomId: formData.roomId || undefined,
                roomPassword: formData.roomPassword || undefined,
                // Links
                whatsappGroupLink: formData.whatsappGroupLink || undefined,
                discordChannelId: formData.discordChannelId || undefined,
                streamUrl: formData.streamUrl || undefined,
                region: formData.region || undefined,
                banner: formData.banner || undefined,
                shareMessage: formData.shareMessage || undefined,
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
                                <a href={`https://wa.me/?text=${encodeURIComponent(`${shareLink}\n\n*=== JOIN THE BATTLE ON PROTOCOL! ===*\n\n*TOURNAMENT:* ${formData.title.toUpperCase()}\n\n* Game:* ${formData.game}\n* Prize Pool:* Coins ${parseFloat(formData.prizePool).toLocaleString('en-IN')}\n* Entry Fee:* ${formData.entryFeePerPerson ? `Coins ${parseFloat(formData.entryFeePerPerson).toLocaleString('en-IN')}` : 'FREE'}\n\n*--- Build your legacy. Win big. ---*`)}`} target="_blank" className="flex-1">
                                    <Button variant="outline" className="w-full text-xs">
                                        <MessageCircle className="h-3 w-3 mr-1 text-green-500" /> WhatsApp
                                    </Button>
                                </a>
                                <Button variant="outline" className="flex-1 text-xs" onClick={() => {
                                    navigator.clipboard.writeText(`${shareLink}\n\n*=== JOIN THE BATTLE ON PROTOCOL! ===*\n\n*TOURNAMENT:* ${formData.title.toUpperCase()}\n\n* Game:* ${formData.game}\n* Prize Pool:* Coins ${parseFloat(formData.prizePool).toLocaleString('en-IN')}\n* Entry Fee:* ${formData.entryFeePerPerson ? `Coins ${parseFloat(formData.entryFeePerPerson).toLocaleString('en-IN')}` : 'FREE'}\n\n*--- Build your legacy. Win big. ---*`);
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
                            {Object.keys(customGameConfigs).map(key => {
                                const config = customGameConfigs[key];
                                return (
                                    <div key={key} className="group text-left relative">
                                        {/* Edit / Delete Buttons */}
                                        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openGameEditor(key); }}
                                                className="p-1.5 rounded-lg bg-black/60 backdrop-blur text-white hover:bg-primary/80 transition-colors"
                                                title="Edit Game"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteGame(key); }}
                                                className="p-1.5 rounded-lg bg-black/60 backdrop-blur text-white hover:bg-red-500/80 transition-colors"
                                                title="Delete Game"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleSelectGame(key)}
                                            className="w-full text-left"
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
                                    </div>
                                );
                            })}

                            {/* ADD NEW GAME CARD */}
                            <button
                                onClick={() => openGameEditor()}
                                className="text-left"
                            >
                                <Card className="overflow-hidden hover:border-primary/50 transition-all hover:shadow-xl cursor-pointer h-full border-dashed border-2 border-border hover:border-primary/40">
                                    <div className="h-32 bg-gradient-to-br from-gray-700/30 to-gray-900/30 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
                                            <Plus className="h-8 w-8 text-primary" />
                                        </div>
                                    </div>
                                    <CardContent className="p-5 space-y-3">
                                        <h3 className="text-xl font-bold text-muted-foreground">Add New Game</h3>
                                        <p className="text-sm text-muted-foreground">Create a custom game with its own tournament settings, scoring, maps, and rules.</p>
                                    </CardContent>
                                </Card>
                            </button>
                        </div>

                        {/* Action Bar: Reset + Trash Toggle */}
                        <div className="flex items-center justify-center gap-3 max-w-4xl mx-auto">
                            <Button variant="outline" size="sm" onClick={resetToDefaults} className="gap-1.5 text-xs">
                                <RefreshCw className="h-3.5 w-3.5" /> Reset to Defaults
                            </Button>
                            <Button
                                variant={showTrash ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setShowTrash(!showTrash)}
                                className="gap-1.5 text-xs"
                            >
                                <Archive className="h-3.5 w-3.5" />
                                Trash {Object.keys(trashedGames).length > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{Object.keys(trashedGames).length}</span>
                                )}
                            </Button>
                        </div>

                        {/* Trash Panel */}
                        {showTrash && (
                            <div className="max-w-4xl mx-auto">
                                <Card className="border-red-500/20">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2 text-red-500">
                                                    <Archive className="h-5 w-5" /> Trash
                                                </CardTitle>
                                                <CardDescription>{Object.keys(trashedGames).length} deleted game(s)</CardDescription>
                                            </div>
                                            {Object.keys(trashedGames).length > 0 && (
                                                <Button variant="outline" size="sm" onClick={emptyTrash} className="gap-1.5 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10">
                                                    <Trash2 className="h-3.5 w-3.5" /> Empty Trash
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {Object.keys(trashedGames).length === 0 ? (
                                            <div className="text-center py-8">
                                                <Archive className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                                                <p className="text-sm text-muted-foreground">Trash is empty</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {Object.keys(trashedGames).map(key => {
                                                    const game = trashedGames[key];
                                                    return (
                                                        <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/30 transition-all group">
                                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${game.color} flex items-center justify-center shrink-0`}>
                                                                <span className="text-lg">{game.icon}</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold truncate">{game.label}</p>
                                                                <p className="text-[10px] text-muted-foreground">{game.modes.join(', ')}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => restoreFromTrash(key)}
                                                                className="p-2 rounded-lg text-green-500 hover:bg-green-500/10 transition-colors shrink-0"
                                                                title="Restore game"
                                                            >
                                                                <Undo2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Game Mode *</Label>
                                        <Select name="gameMode" value={formData.gameMode} onChange={handleModeChange} className="mt-1 w-full">
                                            {gameConfig.modes.map(m => (
                                                <option key={m} value={m.toUpperCase().replace(/\s+/g, '_')}>{m}</option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Format *</Label>
                                        <Select name="format" value={formData.format} onChange={handleChange} className="mt-1 w-full">
                                            {gameConfig.formats.map(f => (
                                                <option key={f} value={f.toUpperCase().replace(/\s+/g, '_').replace(/[()]/g, '')}>{f}</option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>

                                {/* Tier + Region */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Tier *</Label>
                                        <Select name="tier" value={formData.tier} onChange={handleChange} className="mt-1 w-full">
                                            <option value="LOW">🟢 Low — Casual</option>
                                            <option value="MEDIUM">🟡 Medium — Competitive</option>
                                            <option value="HIGH">🔴 High — Pro/Premier</option>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Server Region</Label>
                                        <Select name="region" value={formData.region} onChange={handleChange} className="mt-1 w-full">
                                            <option value="">Select Region</option>
                                            {gameConfig.regions.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>

                                {/* Date + Time */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Start Date *</Label>
                                        <Input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="mt-1 w-full" />
                                    </div>
                                    <div>
                                        <Label>Start Time *</Label>
                                        <Input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="mt-1 w-full" />
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <Label>Entry Fee (Coins)</Label>
                                        <Input type="number" name="entryFeePerPerson" value={formData.entryFeePerPerson} onChange={handleChange} placeholder="0 = Free" className="mt-1 w-full" />
                                    </div>
                                    <div>
                                        <Label>Prize Pool (Coins)</Label>
                                        <Input type="number" name="prizePool" value={formData.prizePool} onChange={handleChange} placeholder="Total prize" className="mt-1 w-full" />
                                    </div>
                                    <div>
                                        <Label>Max Teams</Label>
                                        <Input type="number" name="maxTeams" value={formData.maxTeams} onChange={handleChange} className="mt-1 w-full" />
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
                                                {((parseFloat(formData.entryFeePerPerson) || 0) * (parseInt(formData.maxTeams) || 0) * (formData.gameMode === 'SOLO' ? 1 : formData.gameMode === 'DUO' ? 2 : formData.game === 'VALORANT' ? 5 : 4)).toLocaleString()} Coins
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-background/50 border shadow-sm">
                                            <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
                                            <p className="font-bold text-red-500">
                                                -{(parseFloat(formData.prizePool) || 0).toLocaleString()} Coins
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-background/50 border shadow-sm ring-1 ring-primary/20">
                                            <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
                                            <p className={`font-bold ${((parseFloat(formData.entryFeePerPerson) || 0) * (parseInt(formData.maxTeams) || 0) * (formData.gameMode === 'SOLO' ? 1 : formData.gameMode === 'DUO' ? 2 : formData.game === 'VALORANT' ? 5 : 4) - (parseFloat(formData.prizePool) || 0)) >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                                {((parseFloat(formData.entryFeePerPerson) || 0) * (parseInt(formData.maxTeams) || 0) * (formData.gameMode === 'SOLO' ? 1 : formData.gameMode === 'DUO' ? 2 : formData.game === 'VALORANT' ? 5 : 4) - (parseFloat(formData.prizePool) || 0)).toLocaleString()} Coins
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
                                                <p className="text-xs text-muted-foreground">{p.percent}% — {Math.round((parseFloat(formData.prizePool) || 0) * p.percent / 100)} Coins</p>
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

                                {/* Custom Share Message */}
                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-green-500/10 text-green-600">
                                            <MessageCircle className="h-4 w-4" />
                                        </div>
                                        <h4 className="font-bold text-sm">Custom Sharing Message</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <Label>WhatsApp/Sharing Message Template</Label>
                                        <Textarea
                                            name="shareMessage"
                                            value={formData.shareMessage}
                                            onChange={handleChange}
                                            placeholder="Join our {title} tournament for {game}! Prize pool: {prize}. Fee: {entry}. Register: {link}"
                                            className="mt-1 font-mono text-sm h-32"
                                        />
                                        <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Available Variables</p>
                                            <div className="flex flex-wrap gap-2">
                                                {['{title}', '{game}', '{prize}', '{entry}', '{link}'].map(v => (
                                                    <code key={v} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">{v}</code>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                                Variables will be automatically replaced with tournament data. Leave empty to use the default premium template.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Banner Implementation */}
                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                            <Link2 className="h-4 w-4" />
                                        </div>
                                        <h4 className="font-bold text-sm">Tournament Banner</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <MediaUpload 
                                            label="Upload Banner Image"
                                            type="image"
                                            currentUrl={formData.banner}
                                            onUploadSuccess={(url) => setFormData(prev => ({ ...prev, banner: url }))}
                                        />
                                        <div>
                                            <Label className="text-[10px] text-muted-foreground mb-1 block">Or provide Direct Image URL</Label>
                                            <Input
                                                name="banner"
                                                value={formData.banner}
                                                onChange={handleChange}
                                                placeholder="https://images.unsplash.com/photo-..."
                                                className="text-xs"
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            Recommended: 1920x1080px (16:9). JPG, PNG or WEBP up to 20MB.
                                        </p>
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
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <MapPin className={`h-5 w-5 ${gameConfig.accent}`} /> Map Pool
                                        </CardTitle>
                                        <CardDescription>Select maps for this tournament. Unselected maps will be excluded.</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const name = prompt('Enter new map name');
                                            if (name && name.trim()) {
                                                const mapName = name.trim();
                                                // Add to game config maps
                                                if (selectedGame) {
                                                    setCustomGameConfigs(prev => ({
                                                        ...prev,
                                                        [selectedGame]: {
                                                            ...prev[selectedGame],
                                                            maps: [...prev[selectedGame].maps, mapName]
                                                        }
                                                    }));
                                                }
                                                // Auto-select new map
                                                setSelectedMaps(prev => [...prev, mapName]);
                                            }
                                        }}
                                        className="gap-1.5"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add Map
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {gameConfig.maps.map(map => (
                                        <div key={map} className="relative group">
                                            <button
                                                onClick={() => toggleMap(map)}
                                                className={`w-full p-3 rounded-xl border text-center text-sm font-medium transition-all ${selectedMaps.includes(map)
                                                    ? `${gameConfig.bg} border-primary/30 shadow-sm`
                                                    : 'bg-muted/30 border-transparent opacity-50 hover:opacity-80'}`}
                                            >
                                                <MapPin className={`h-4 w-4 mx-auto mb-1 ${selectedMaps.includes(map) ? gameConfig.accent : ''}`} />
                                                {map}
                                            </button>
                                            {/* Edit button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newName = prompt('Rename map:', map);
                                                    if (newName && newName.trim() && newName.trim() !== map) {
                                                        const renamed = newName.trim();
                                                        if (selectedGame) {
                                                            setCustomGameConfigs(prev => ({
                                                                ...prev,
                                                                [selectedGame]: {
                                                                    ...prev[selectedGame],
                                                                    maps: prev[selectedGame].maps.map(m => m === map ? renamed : m)
                                                                }
                                                            }));
                                                        }
                                                        setSelectedMaps(prev => prev.map(m => m === map ? renamed : m));
                                                    }
                                                }}
                                                className="absolute top-1 left-1 w-5 h-5 rounded-md bg-black/60 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                title="Rename map"
                                            >
                                                <Pencil className="h-2.5 w-2.5" />
                                            </button>
                                            {/* Delete button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (selectedGame) {
                                                        setCustomGameConfigs(prev => ({
                                                            ...prev,
                                                            [selectedGame]: {
                                                                ...prev[selectedGame],
                                                                maps: prev[selectedGame].maps.filter(m => m !== map)
                                                            }
                                                        }));
                                                    }
                                                    setSelectedMaps(prev => prev.filter(m => m !== map));
                                                }}
                                                className="absolute top-1 right-1 w-5 h-5 rounded-md bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                title="Delete map"
                                            >
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">{selectedMaps.length} maps selected</p>
                            </CardContent>
                        </Card>

                        {/* Scoring System */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Target className={`h-5 w-5 ${gameConfig.accent}`} /> Scoring System
                                        </CardTitle>
                                        <CardDescription>Official {gameConfig.label} competitive scoring</CardDescription>
                                    </div>
                                    {selectedGame !== 'VALORANT' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const keys = Object.keys(dynamicScoring).filter(k => k !== 'kill');
                                                const nextPlace = keys.length > 0 ? Math.max(...keys.map(Number)) + 1 : 1;
                                                setDynamicScoring({...dynamicScoring, [String(nextPlace)]: 0});
                                            }}
                                            className="gap-1.5"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> Add Rank
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {selectedGame === 'VALORANT' ? (
                                    <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="font-medium">5v5 Competitive — Round-based</p>
                                            <Badge className="bg-primary/20 text-primary border-primary/30">Lobby Points</Badge>
                                        </div>
                                        <div className="flex gap-4 mt-3">
                                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center flex-1 space-y-2">
                                                <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Win Points</p>
                                                <Input 
                                                    type="number" 
                                                    value={dynamicScoring.win}
                                                    onChange={(e) => setDynamicScoring({...dynamicScoring, win: parseInt(e.target.value) || 0})}
                                                    className="h-12 text-center text-xl font-black bg-background/50"
                                                />
                                            </div>
                                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center flex-1 space-y-2">
                                                <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Loss Points</p>
                                                <Input 
                                                    type="number" 
                                                    value={dynamicScoring.loss}
                                                    onChange={(e) => setDynamicScoring({...dynamicScoring, loss: parseInt(e.target.value) || 0})}
                                                    className="h-12 text-center text-xl font-black bg-background/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {Object.entries(dynamicScoring)
                                                .filter(([k]) => k !== 'kill')
                                                .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                                                .map(([place, pts]) => (
                                                    <div key={place} className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all relative group ${parseInt(place) <= 3 ? 'bg-yellow-500/5 border-yellow-500/30' : 'bg-muted/30 border-transparent'}`}>
                                                        <button
                                                            onClick={() => {
                                                                const newScoring = {...dynamicScoring};
                                                                delete newScoring[place];
                                                                setDynamicScoring(newScoring);
                                                            }}
                                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                            title="Remove rank"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"># {place} Rank</span>
                                                        <Input 
                                                            type="number" 
                                                            value={pts as number}
                                                            onChange={(e) => setDynamicScoring({...dynamicScoring, [place]: parseInt(e.target.value) || 0})}
                                                            className="h-10 text-center font-bold bg-background/40 border-none shadow-none focus-visible:ring-1"
                                                        />
                                                    </div>
                                                ))}
                                        </div>
                                        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-center justify-between group hover:border-red-500/40 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                                                    <Zap className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">Kill Bonus</p>
                                                    <p className="text-[10px] text-muted-foreground">Points awarded per confirmed elimination</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-red-500">PTS</span>
                                                <Input 
                                                    type="number" 
                                                    value={dynamicScoring.kill}
                                                    onChange={(e) => setDynamicScoring({...dynamicScoring, kill: parseInt(e.target.value) || 0})}
                                                    className="w-20 h-10 text-center font-black text-lg bg-background/40 border-red-500/20"
                                                />
                                            </div>
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
                            <CardContent className="space-y-5">
                                {/* Toggle Settings (Boolean) */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Toggle Settings</p>
                                        <button
                                            onClick={() => {
                                                const name = prompt('Enter toggle setting name (e.g. "redZone")');
                                                if (name && name.trim()) setDynamicSettings({...dynamicSettings, [name.trim()]: false});
                                            }}
                                            className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold"
                                        >
                                            <Plus className="h-3 w-3" /> Add Toggle
                                        </button>
                                    </div>
                                    {Object.entries(dynamicSettings).filter(([, v]) => typeof v === 'boolean').length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {Object.entries(dynamicSettings).filter(([, v]) => typeof v === 'boolean').map(([key, value]) => (
                                                <div key={key} className="relative group">
                                                    <button
                                                        onClick={() => setDynamicSettings({...dynamicSettings, [key]: !(value as boolean)})}
                                                        className={`w-full p-3 rounded-xl border text-left transition-all ${(value as boolean) ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/20 border-border/50 hover:border-border'}`}
                                                    >
                                                        <p className="text-xs font-bold capitalize mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${(value as boolean) ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                                            {String(value)}
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => { const s = {...dynamicSettings}; delete s[key]; setDynamicSettings(s); }}
                                                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                                                        title="Delete"
                                                    >
                                                        <X className="h-2.5 w-2.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center py-3 bg-muted/10 rounded-lg border border-dashed">No toggle settings. Click "Add Toggle" above.</p>
                                    )}
                                </div>

                                {/* Value Settings (String/Number) */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Value Settings</p>
                                        <button
                                            onClick={() => {
                                                const name = prompt('Enter value setting name (e.g. "shrinkSpeed")');
                                                if (name && name.trim()) setDynamicSettings({...dynamicSettings, [name.trim()]: ''});
                                            }}
                                            className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold"
                                        >
                                            <Plus className="h-3 w-3" /> Add Value
                                        </button>
                                    </div>
                                    {Object.entries(dynamicSettings).filter(([, v]) => typeof v !== 'boolean').length > 0 ? (
                                        <div className="space-y-2">
                                            {Object.entries(dynamicSettings).filter(([, v]) => typeof v !== 'boolean').map(([key, value]) => (
                                                <div key={key} className="flex items-center gap-4 p-3 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/20 transition-all group relative">
                                                    <button
                                                        onClick={() => { const s = {...dynamicSettings}; delete s[key]; setDynamicSettings(s); }}
                                                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                                                        title="Delete"
                                                    >
                                                        <X className="h-2.5 w-2.5" />
                                                    </button>
                                                    <span className="text-sm font-bold capitalize flex-1 whitespace-nowrap">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                    <Input
                                                        value={String(value)}
                                                        onChange={(e) => setDynamicSettings({...dynamicSettings, [key]: e.target.value})}
                                                        className="w-36 sm:w-44 h-9 text-right text-sm font-bold bg-background/50 border-primary/10 shrink-0"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center py-3 bg-muted/10 rounded-lg border border-dashed">No value settings. Click "Add Value" above.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Rules */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Shield className={`h-5 w-5 ${gameConfig.accent}`} /> Official Rules
                                        </CardTitle>
                                        <CardDescription>{dynamicRules.length} rules will be displayed to players</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDynamicRules([...dynamicRules, ''])}
                                        className="gap-1.5"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add Rule
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    {dynamicRules.map((rule, i) => (
                                        <div key={i} className="flex items-center gap-2 p-3 rounded-2xl bg-muted/20 hover:bg-muted/30 transition-all group border border-transparent hover:border-primary/10">
                                            <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-xs font-black text-primary shadow-sm">{i + 1}</span>
                                            <Input 
                                                value={rule}
                                                onChange={(e) => {
                                                    const newRules = [...dynamicRules];
                                                    newRules[i] = e.target.value;
                                                    setDynamicRules(newRules);
                                                }}
                                                placeholder="Enter rule description..."
                                                className="flex-1 bg-transparent border-none shadow-none p-0 h-auto text-sm focus-visible:ring-0"
                                            />
                                            <button 
                                                onClick={() => setDynamicRules(dynamicRules.filter((_, idx) => idx !== i))}
                                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                                                title="Delete rule"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {dynamicRules.length === 0 && (
                                    <div className="text-center p-8 rounded-xl bg-muted/10 border border-dashed border-border">
                                        <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                        <p className="text-sm text-muted-foreground">No rules added yet. Click "Add Rule" to start.</p>
                                    </div>
                                )}
                                <Button 
                                    variant="outline" 
                                    onClick={() => setDynamicRules([...dynamicRules, ''])}
                                    className="w-full border-dashed border-2 hover:border-primary/50 hover:bg-primary/5"
                                >
                                    <Plus className="h-4 w-4 mr-2 text-primary" /> Add Custom Rule
                                </Button>
                                <p className="text-[10px] text-center text-muted-foreground italic">Click on any rule text to edit it inline. Rules are displayed to all players on the tournament page.</p>
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
                                        { label: 'Entry Fee', value: formData.entryFeePerPerson ? `${formData.entryFeePerPerson} Coins` : 'FREE' },
                                        { label: 'Prize Pool', value: formData.prizePool ? `${formData.prizePool} Coins` : '0 Coins' },
                                        { label: 'Max Teams', value: formData.maxTeams },
                                        { label: 'Start', value: `${formData.startDate} ${formData.startTime}` },
                                        { label: 'Maps', value: `${selectedMaps.length} selected` },
                                        { label: 'Custom Rules', value: `${dynamicRules.length} rules` },
                                        { label: 'Scoring', value: `${Object.keys(dynamicScoring).length} factors` },
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

            {/* ===== GAME EDITOR MODAL ===== */}
            {gameEditorOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setGameEditorOpen(false)} />
                    <div className="relative bg-popover border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                        <div className="sticky top-0 bg-popover/95 backdrop-blur border-b border-border p-5 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-xl font-bold">{editingGameKey ? 'Edit Game' : 'Add New Game'}</h2>
                                <p className="text-sm text-muted-foreground">Configure tournament system for this game</p>
                            </div>
                            <button onClick={() => setGameEditorOpen(false)} className="p-2 rounded-lg hover:bg-muted transition"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-5 space-y-5">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Game Name *</Label>
                                    <Input value={gameEditorData.label} onChange={(e) => setGameEditorData({...gameEditorData, label: e.target.value})} placeholder="e.g. Call of Duty" className="mt-1" />
                                </div>
                                <div>
                                    <Label>Icon (Emoji)</Label>
                                    <Input value={gameEditorData.icon} onChange={(e) => setGameEditorData({...gameEditorData, icon: e.target.value})} placeholder="🎮" className="mt-1" />
                                </div>
                            </div>

                            {/* Colors */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Gradient Color</Label>
                                    <Select value={gameEditorData.color} onChange={(e) => setGameEditorData({...gameEditorData, color: e.target.value})} className="mt-1 w-full">
                                        <option value="from-red-600 to-rose-500">Red</option>
                                        <option value="from-blue-600 to-sky-500">Blue</option>
                                        <option value="from-green-600 to-emerald-500">Green</option>
                                        <option value="from-purple-600 to-pink-500">Purple</option>
                                        <option value="from-amber-600 to-yellow-500">Amber</option>
                                        <option value="from-orange-600 to-amber-500">Orange</option>
                                        <option value="from-cyan-600 to-teal-500">Cyan</option>
                                        <option value="from-pink-600 to-fuchsia-500">Pink</option>
                                        <option value="from-indigo-600 to-violet-500">Indigo</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Max Teams (Default)</Label>
                                    <Input type="number" value={gameEditorData.defaultMaxTeams} onChange={(e) => setGameEditorData({...gameEditorData, defaultMaxTeams: parseInt(e.target.value) || 25})} className="mt-1" />
                                </div>
                            </div>

                            {/* Preview */}
                            <div className={`h-20 rounded-xl bg-gradient-to-br ${gameEditorData.color} flex items-center justify-center gap-3`}>
                                <span className="text-4xl">{gameEditorData.icon}</span>
                                <span className="text-xl font-bold text-white">{gameEditorData.label || 'Game Name'}</span>
                            </div>

                            {/* Modes */}
                            <div>
                                <Label>Game Modes (comma-separated)</Label>
                                <Input value={gameEditorModesInput} onChange={(e) => setGameEditorModesInput(e.target.value)} placeholder="Solo, Duo, Squad" className="mt-1" />
                            </div>

                            {/* Formats */}
                            <div>
                                <Label>Tournament Formats (comma-separated)</Label>
                                <Input value={gameEditorFormatsInput} onChange={(e) => setGameEditorFormatsInput(e.target.value)} placeholder="Single Match, Multi-Match (3), Round Robin" className="mt-1" />
                            </div>

                            {/* Maps */}
                            <div>
                                <Label>Maps (comma-separated)</Label>
                                <Input value={gameEditorMapsInput} onChange={(e) => setGameEditorMapsInput(e.target.value)} placeholder="Erangel, Miramar, Sanhok" className="mt-1" />
                            </div>

                            {/* Regions */}
                            <div>
                                <Label>Regions (comma-separated)</Label>
                                <Input value={gameEditorRegionsInput} onChange={(e) => setGameEditorRegionsInput(e.target.value)} placeholder="India, SEA, Europe, Global" className="mt-1" />
                            </div>

                            {/* Rules */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label>Default Rules</Label>
                                    <button onClick={() => setGameEditorData({...gameEditorData, rules: [...gameEditorData.rules, '']})} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="h-3 w-3" /> Add Rule</button>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {gameEditorData.rules.map((rule, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <span className="text-xs text-muted-foreground w-5 shrink-0">{i+1}.</span>
                                            <Input
                                                value={rule}
                                                onChange={(e) => {
                                                    const r = [...gameEditorData.rules];
                                                    r[i] = e.target.value;
                                                    setGameEditorData({...gameEditorData, rules: r});
                                                }}
                                                placeholder="Rule description..."
                                                className="flex-1 text-sm h-9"
                                            />
                                            <button onClick={() => setGameEditorData({...gameEditorData, rules: gameEditorData.rules.filter((_, idx) => idx !== i)})} className="p-1 text-red-500 hover:bg-red-500/10 rounded shrink-0">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {gameEditorData.rules.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No rules yet. Click "Add Rule" above.</p>}
                                </div>
                            </div>

                            {/* Scoring Preview */}
                            <div className="p-4 rounded-xl bg-muted/20 border">
                                <p className="text-xs font-bold text-muted-foreground mb-2">💡 Scoring, Settings, Maps, and detailed Rules can be further customized in Step 3 after selecting this game.</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-popover/95 backdrop-blur border-t border-border p-4 flex gap-3">
                            <Button variant="outline" onClick={() => setGameEditorOpen(false)} className="flex-1">Cancel</Button>
                            <Button onClick={saveGameEditor} className="flex-1">
                                <Save className="h-4 w-4 mr-2" /> {editingGameKey ? 'Update Game' : 'Create Game'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
