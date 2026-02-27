'use client';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

// ─── Badge Tier Config ──────────────────────────────────────────────────────
type BadgeTier = 'legendary' | 'epic' | 'rare' | 'common' | 'special' | 'rank';

export interface AchievementBadge {
    id: string;
    name: string;
    description: string;
    tier: BadgeTier;
    category: string;
    earned?: boolean;
    earnedDate?: string;
    progress?: { current: number; max: number };
    emoji: string;
    color: string;        // Tailwind gradient string
}

export const ALL_BADGES: AchievementBadge[] = [
    // ── RANKS (Game-like Hierarchy) ────────────────
    {
        id: 'rank_bronze', name: 'Bronze III', description: 'Complete your first match', tier: 'rank', category: 'Rank', emoji: '🥉', color: 'from-orange-800 to-orange-950',
    },
    {
        id: 'rank_silver', name: 'Silver I', description: 'Participate in 5 tournaments', tier: 'rank', category: 'Rank', emoji: '🥈', color: 'from-gray-400 to-gray-600',
    },
    {
        id: 'rank_gold', name: 'Gold IV', description: 'Participate in 15 tournaments', tier: 'rank', category: 'Rank', emoji: '🥇', color: 'from-yellow-400 to-amber-600',
    },
    {
        id: 'rank_platinum', name: 'Platinum II', description: 'Participate in 30 tournaments', tier: 'rank', category: 'Rank', emoji: '💎', color: 'from-cyan-400 to-blue-600',
    },
    {
        id: 'rank_diamond', name: 'Diamond Master', description: 'Participate in 50 tournaments', tier: 'rank', category: 'Rank', emoji: '💠', color: 'from-blue-400 to-indigo-600',
    },
    {
        id: 'rank_heroic', name: 'Heroic Ruler', description: 'Participate in 100 tournaments', tier: 'rank', category: 'Rank', emoji: '🚩', color: 'from-red-500 to-orange-700',
    },
    {
        id: 'rank_grandmaster', name: 'Grandmaster', description: 'Join 250 tournaments and lead the arena', tier: 'rank', category: 'Rank', emoji: '👑', color: 'from-yellow-300 to-red-600',
    },

    // ── PERFORMANCE ──────────────────────────────
    {
        id: 'first_blood', name: 'First Entry', description: 'Join your first paid tournament', tier: 'rare', category: 'Performance', emoji: '🩸', color: 'from-red-600 to-red-900',
    },
    {
        id: 'wallet_warrior', name: 'Wallet Warrior', description: 'Have more than ₹500 in your wallet', tier: 'rare', category: 'Wealth', emoji: '💰', color: 'from-green-400 to-emerald-600',
    },
    {
        id: 'veteran', name: 'Veteran Player', description: 'Account age over 30 days', tier: 'special', category: 'Milestone', emoji: '🎖️', color: 'from-blue-600 to-purple-600',
    }
];

// ─── Tier Styling ───────────────────────────────────────────────────────────
const TIER_CONFIG: Record<BadgeTier, {
    label: string;
    border: string;
    bg: string;
    glow: string;
    text: string;
    ring: string;
    shimmer: string;
}> = {
    legendary: {
        label: 'Legendary',
        border: 'border-yellow-400/60',
        bg: 'from-yellow-950/60 via-amber-900/40 to-yellow-950/60',
        glow: 'shadow-[0_0_30px_-5px_rgba(234,179,8,0.6)]',
        text: 'text-yellow-300',
        ring: 'ring-yellow-400/50',
        shimmer: 'from-yellow-400/0 via-yellow-300/40 to-yellow-400/0',
    },
    rank: {
        label: 'Ranked',
        border: 'border-orange-500/60',
        bg: 'from-orange-950/60 via-red-900/30 to-orange-950/60',
        glow: 'shadow-[0_0_30px_-5px_rgba(249,115,22,0.6)]',
        text: 'text-orange-300',
        ring: 'ring-orange-500/50',
        shimmer: 'from-orange-400/0 via-red-300/40 to-orange-400/0',
    },
    epic: {
        label: 'Epic',
        border: 'border-purple-500/60',
        bg: 'from-purple-950/60 via-fuchsia-900/30 to-purple-950/60',
        glow: 'shadow-[0_0_30px_-5px_rgba(168,85,247,0.6)]',
        text: 'text-purple-300',
        ring: 'ring-purple-500/50',
        shimmer: 'from-purple-400/0 via-fuchsia-300/40 to-purple-400/0',
    },
    rare: {
        label: 'Rare',
        border: 'border-blue-400/60',
        bg: 'from-blue-950/60 via-sky-900/30 to-blue-950/60',
        glow: 'shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)]',
        text: 'text-blue-300',
        ring: 'ring-blue-400/50',
        shimmer: 'from-blue-400/0 via-sky-300/40 to-blue-400/0',
    },
    special: {
        label: 'Special',
        border: 'border-emerald-400/60',
        bg: 'from-emerald-950/60 via-green-900/30 to-emerald-950/60',
        glow: 'shadow-[0_0_30px_-5px_rgba(52,211,153,0.5)]',
        text: 'text-emerald-300',
        ring: 'ring-emerald-400/50',
        shimmer: 'from-emerald-400/0 via-green-300/40 to-emerald-400/0',
    },
    common: {
        label: 'Common',
        border: 'border-gray-500/40',
        bg: 'from-gray-900/60 via-gray-800/30 to-gray-900/60',
        glow: 'shadow-[0_0_20px_-5px_rgba(107,114,128,0.3)]',
        text: 'text-gray-300',
        ring: 'ring-gray-500/30',
        shimmer: 'from-gray-400/0 via-gray-300/20 to-gray-400/0',
    },
};

// ─── Single Badge Card ───────────────────────────────────────────────────────
function BadgeCard({ badge, compact = false }: { badge: AchievementBadge; compact?: boolean }) {
    const [hovered, setHovered] = useState(false);
    const tier = TIER_CONFIG[badge.tier];

    return (
        <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: badge.earned ? 1.07 : 1.03, y: -3 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`relative flex flex-col items-center text-center rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300
                    ${badge.earned
                        ? `bg-gradient-to-b ${tier.bg} ${tier.border} ${tier.glow}`
                        : 'bg-gray-800/10 border-gray-800/50 opacity-80 backdrop-blur-sm grayscale-[0.8]'
                    }
                    ${compact ? 'p-3' : 'p-4'}
                `}
            >
                {/* Shimmer on hover */}
                {badge.earned && hovered && (
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 0.7, ease: 'linear' }}
                        className={`absolute inset-0 bg-gradient-to-r ${tier.shimmer} -skew-x-12 pointer-events-none z-10`}
                    />
                )}

                {/* Tier label top bar */}
                {!compact && (
                    <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${badge.color} opacity-80`} />
                )}

                {/* Emoji Icon */}
                <div className={`relative ${compact ? 'text-3xl mb-1.5' : 'text-5xl mb-3'} select-none`}>
                    <span className={badge.earned ? '' : 'blur-[2px]'}>{badge.earned ? badge.emoji : '🔒'}</span>
                    {badge.earned && (
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
                            transition={{ repeat: Infinity, duration: 3, delay: Math.random() * 2 }}
                            className={`absolute inset-0 blur-xl bg-gradient-to-r ${badge.color} rounded-full -z-10`}
                        />
                    )}
                </div>

                {/* Name */}
                <p className={`font-black leading-tight ${compact ? 'text-[10px]' : 'text-xs'} text-white truncate max-w-full px-1`}>
                    {badge.name}
                </p>

                {/* Tier pill */}
                {!compact && (
                    <span className={`mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${tier.text} bg-black/30`}>
                        {badge.earned ? tier.label : 'Locked'}
                    </span>
                )}

                {/* Progress bar */}
                {badge.progress && !badge.earned && !compact && (
                    <div className="w-full mt-2">
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(badge.progress.current / badge.progress.max) * 100}%` }}
                                transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
                                className={`h-full bg-gradient-to-r ${badge.color} rounded-full`}
                            />
                        </div>
                        <p className="text-[9px] text-gray-500 mt-0.5">{badge.progress.current}/{badge.progress.max}</p>
                    </div>
                )}

                {/* Earned date / Locked */}
                {!compact && (
                    <p className="text-[9px] text-gray-500 mt-1">
                        {badge.earned ? (badge.earnedDate || 'Earned') : '🔒 Locked'}
                    </p>
                )}
            </motion.div>

            {/* Hover tooltip */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 pointer-events-none"
                    >
                        <div className={`bg-gray-950 border ${tier.border} rounded-xl p-3 shadow-2xl ${tier.glow}`}>
                            <p className={`font-black text-sm ${tier.text}`}>{badge.earned ? badge.emoji : '🔒'} {badge.name}</p>
                            <p className={`text-[10px] uppercase font-bold ${tier.text} opacity-70 mb-1`}>{badge.earned ? tier.label : 'Locked'} · {badge.category}</p>
                            <p className="text-xs text-gray-400 leading-snug">{badge.earned ? badge.description : 'Connect and compete to unlock this badge!'}</p>
                            {badge.progress && !badge.earned && (
                                <p className="text-[10px] text-gray-500 mt-1">Progress: {badge.progress.current}/{badge.progress.max}</p>
                            )}
                        </div>
                        <div className="w-3 h-3 bg-gray-950 border-b border-r border-gray-700 rotate-45 mx-auto -mt-1.5" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── BadgeShowcase Component ────────────────────────────────────────────────
export function BadgeShowcase({ user, compact = false }: { user?: any; compact?: boolean }) {
    const badges = useMemo(() => {
        const matchesCount = user?.teams?.length || 0;
        const walletBalance = user?.wallet?.balance || 0;
        const accountAgeDays = user?.createdAt ? (Date.now() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000) : 0;

        return ALL_BADGES.map(badge => {
            let earned = false;
            let current = 0;
            let max = 0;

            if (badge.id === 'rank_bronze') { earned = matchesCount >= 1; current = matchesCount; max = 1; }
            if (badge.id === 'rank_silver') { earned = matchesCount >= 5; current = matchesCount; max = 5; }
            if (badge.id === 'rank_gold') { earned = matchesCount >= 15; current = matchesCount; max = 15; }
            if (badge.id === 'rank_platinum') { earned = matchesCount >= 30; current = matchesCount; max = 30; }
            if (badge.id === 'rank_diamond') { earned = matchesCount >= 50; current = matchesCount; max = 50; }
            if (badge.id === 'rank_heroic') { earned = matchesCount >= 100; current = matchesCount; max = 100; }
            if (badge.id === 'rank_grandmaster') { earned = matchesCount >= 250; current = matchesCount; max = 250; }

            if (badge.id === 'wallet_warrior') { earned = walletBalance >= 500; current = Math.min(walletBalance, 500); max = 500; }
            if (badge.id === 'veteran') { earned = accountAgeDays >= 30; current = Math.min(accountAgeDays, 30); max = 30; }

            return {
                ...badge,
                earned,
                progress: max > 0 ? { current, max } : undefined
            };
        });
    }, [user]);

    const earned = badges.filter(b => b.earned);
    const locked = badges.filter(b => !b.earned);

    return (
        <Card className="border-border/40 bg-card/40 backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-3 px-6 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black italic tracking-tight uppercase flex items-center gap-2">
                            Achievements
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1 text-muted-foreground italic">
                            {earned.length} badges earned · {locked.length} to unlock · Tournament Tier: {earned.length > 0 ? earned[earned.length - 1].name : 'Unranked'}
                        </CardDescription>
                    </div>
                </div>
                {/* Overall progress bar */}
                <div className="mt-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                        <span>Rank Progression</span>
                        <span className="text-primary italic">{Math.round((earned.length / badges.length) * 100)}% Complete</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(earned.length / badges.length) * 100}%` }}
                            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                            className="h-full rounded-full bg-gradient-to-r from-orange-600 via-primary to-blue-400"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 pt-2">
                {/* Earned row */}
                {earned.length > 0 && (
                    <div className="mb-8">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-6 flex items-center gap-4">
                            <span className="shrink-0 text-primary italic">Unlocked Legend</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {earned.map(b => <BadgeCard key={b.id} badge={b} compact={compact} />)}
                        </div>
                    </div>
                )}

                {/* Locked section */}
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-6 flex items-center gap-4">
                        <span className="shrink-0 italic">Battle Vault (Locked)</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-muted/20 to-transparent" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {locked.map(b => <BadgeCard key={b.id} badge={b} compact={compact} />)}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
