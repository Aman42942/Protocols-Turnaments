"use client";
import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Trophy, Users, Calendar, Gamepad2, Timer, ArrowRight, Zap, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface TournamentCardProps {
    id: string;
    title: string;
    game: string;
    tier: 'LOW' | 'MEDIUM' | 'HIGH';
    entryFee: number;
    prizePool: number;
    startDate: string;
    maxTeams: number;
    registeredTeams: number;
    gameMode: string;
    status: string;
}

// ═══ GAME THEMES DEFINITION ══════════════════════════════════════════════════
const GAME_THEMES: Record<string, {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
    gradient: string;
}> = {
    BGMI: {
        primary: "text-orange-500",
        secondary: "bg-orange-500",
        accent: "border-orange-500/20",
        glow: "rgba(249, 115, 22, 0.4)",
        gradient: "from-orange-500/30 via-orange-500/5 to-amber-500/10"
    },
    PUBG: {
        primary: "text-yellow-500",
        secondary: "bg-yellow-500",
        accent: "border-yellow-500/20",
        glow: "rgba(234, 179, 8, 0.4)",
        gradient: "from-yellow-500/30 via-yellow-500/5 to-amber-400/10"
    },
    FREEFIRE: {
        primary: "text-cyan-500",
        secondary: "bg-cyan-500",
        accent: "border-cyan-500/20",
        glow: "rgba(6, 182, 212, 0.4)",
        gradient: "from-cyan-500/30 via-cyan-500/5 to-blue-500/10"
    },
    VALORANT: {
        primary: "text-rose-500",
        secondary: "bg-rose-500",
        accent: "border-rose-500/20",
        glow: "rgba(244, 63, 94, 0.4)",
        gradient: "from-rose-500/30 via-rose-500/5 to-purple-500/10"
    }
};

const DEFAULT_THEME = {
    primary: "text-primary",
    secondary: "bg-primary",
    accent: "border-primary/20",
    glow: "rgba(var(--primary), 0.4)",
    gradient: "from-primary/30 via-primary/5 to-primary/10"
};

export function TournamentCard({
    id, title, game, tier, entryFee, prizePool, startDate, maxTeams, registeredTeams, gameMode, status
}: TournamentCardProps) {
    const isFull = registeredTeams >= maxTeams;
    const isHot = registeredTeams >= maxTeams / 2;
    const fillPercent = Math.min((registeredTeams / maxTeams) * 100, 100);

    // Select Theme Based on Game Name
    const themeKey = game.toUpperCase().replace(/\s+/g, '');
    const theme = GAME_THEMES[themeKey] || DEFAULT_THEME;

    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="h-full"
        >
            <Link href={`/tournaments/${id}`} className="block h-full group">
                <Card className={cn(
                    "overflow-hidden rounded-[2rem] border-border/50 bg-card/40 backdrop-blur-xl hover:border-border transition-all duration-500 h-full flex flex-col relative shadow-[0_15px_40px_rgba(0,0,0,0.1)]",
                    `hover:shadow-[0_20px_50px_${theme.glow}]`
                )}>
                    {/* Game Visual Header - Enhanced with Mesh */}
                    <div className="relative h-44 bg-muted/20 flex flex-col items-center justify-center overflow-hidden">
                        {/* Mesh Gradients - Enhanced Visibility */}
                        <div className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity duration-700">
                            <div className={cn("absolute top-[-20%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br blur-3xl animate-pulse", theme.gradient)} />
                            <div className={cn("absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] blur-2xl opacity-40", theme.secondary)} />
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent z-10" />

                        {/* Elite Top Badges */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
                            <div className="px-3 py-1 rounded-full bg-background/40 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-[0.1em] text-foreground/80 shadow-sm">
                                {tier} TIER
                            </div>
                            <div className="flex flex-col gap-1.5 items-end">
                                {isFull ? (
                                    <Badge variant="destructive" className="h-5 text-[9px] animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]">FULL</Badge>
                                ) : isHot ? (
                                    <Badge className="h-5 text-[9px] bg-orange-500 hover:bg-orange-600 text-white border-none animate-bounce shadow-[0_0_15px_rgba(249,115,22,0.5)] flex items-center gap-1">
                                        <Flame className="w-2.5 h-2.5" /> HOT
                                    </Badge>
                                ) : null}
                            </div>
                        </div>

                        {/* Centered Game Icon & Name - Compact Visibility */}
                        <div className="relative z-20 flex flex-col items-center gap-3 group-hover:scale-110 transition-all duration-500 ease-out">
                            <div className="relative">
                                <div className={cn("absolute inset-0 blur-2xl rounded-full scale-125 group-hover:scale-150 transition-all duration-500 opacity-20", theme.secondary)} />
                                <Gamepad2 className={cn("w-16 h-16 relative z-10 transition-colors duration-500", theme.primary)} style={{ filter: `drop-shadow(0 0 10px ${theme.glow})` }} />
                            </div>

                            {/* Game Label - Compact & Centered */}
                            <div className={cn("bg-background/90 backdrop-blur-2xl border-2 px-6 py-1.5 rounded-xl shadow-lg transition-all duration-500", theme.accent, "group-hover:border-white/20")}>
                                <span className={cn("text-sm font-black uppercase tracking-[0.2em] transition-colors duration-500", theme.primary)}>{game}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-6 flex flex-col relative">
                        {/* Title Section */}
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider", theme.primary, theme.accent, "bg-muted/10")}>{gameMode}</span>
                            </div>
                            <h3 className="text-xl font-black text-foreground tracking-tight leading-none group-hover:text-primary transition-colors line-clamp-1">
                                {title.toUpperCase()}
                            </h3>
                        </div>

                        {/* Financial Stats - Compact Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="p-3 rounded-2xl bg-muted/20 border border-border/50 backdrop-blur-sm group-hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Trophy className="w-3 h-3 text-yellow-500" />
                                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Winnings</span>
                                </div>
                                <p className="text-lg font-black text-foreground tracking-tight">₹{prizePool.toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-muted/20 border border-border/50 backdrop-blur-sm group-hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Zap className={cn("w-3 h-3", theme.primary)} />
                                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Entry</span>
                                </div>
                                <p className="text-lg font-black text-foreground tracking-tight">
                                    {entryFee === 0 ? "FREE" : `₹${entryFee}`}
                                </p>
                            </div>
                        </div>

                        {/* Progress Tracker - Compact */}
                        <div className="space-y-2.5 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-muted-foreground font-bold tracking-tight">
                                    <Users className="w-3.5 h-3.5" />
                                    <span className="text-[9px] uppercase tracking-wider">{registeredTeams}/{maxTeams} REGISTERED</span>
                                </div>
                                <span className={cn("text-[10px] font-black italic", theme.primary)}>{Math.round(fillPercent)}%</span>
                            </div>
                            <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden p-[1.5px]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${fillPercent}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                    className={cn(
                                        "h-full rounded-full relative overflow-hidden",
                                        isFull ? "bg-red-500" : theme.secondary
                                    )}
                                    style={{ boxShadow: !isFull ? `0 0 10px ${theme.glow}` : 'none' }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-pulse" />
                                </motion.div>
                            </div>
                        </div>

                        {/* Footer Action - Compact */}
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Starts</span>
                                <span className="text-xs font-black text-foreground">{new Date(startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                            </div>

                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-300 group-hover:scale-105", theme.secondary)}
                                style={{ boxShadow: `0 6px 20px ${theme.glow}` }}
                            >
                                <ArrowRight className="w-5 h-5" />
                            </motion.div>
                        </div>
                    </div>
                </Card>
            </Link>
        </motion.div>
    );
}
