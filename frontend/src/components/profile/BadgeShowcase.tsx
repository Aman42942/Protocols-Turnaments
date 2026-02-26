'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Link from 'next/link';

// ─── Badge Tier Config ──────────────────────────────────────────────────────
type BadgeTier = 'legendary' | 'epic' | 'rare' | 'common' | 'special';

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
    glow: string;         // Box shadow color
}

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

// ─── All Available Badges ───────────────────────────────────────────────────
export const ALL_BADGES: AchievementBadge[] = [
    // ── LEGENDARY ─────────────────────────
    { id: 'champion', name: 'Champion', description: 'Won 1st place in any tournament', tier: 'legendary', category: 'Tournament', emoji: '👑', color: 'from-yellow-400 to-amber-600', glow: '#f59e0b', earned: true, earnedDate: 'Jan 2025' },
    { id: 'unstoppable', name: 'Unstoppable', description: 'Won 5 tournaments in a row', tier: 'legendary', category: 'Streak', emoji: '⚡', color: 'from-yellow-300 to-orange-500', glow: '#f97316', earned: false },
    { id: 'goat', name: 'G.O.A.T', description: 'Top 1% of all players on leaderboard', tier: 'legendary', category: 'Leaderboard', emoji: '🐐', color: 'from-amber-400 to-yellow-600', glow: '#f59e0b', earned: false },

    // ── EPIC ──────────────────────────────
    { id: 'mvp', name: 'MVP', description: 'Named Most Valuable Player in a match', tier: 'epic', category: 'Tournament', emoji: '🏆', color: 'from-purple-400 to-fuchsia-600', glow: '#a855f7', earned: true, earnedDate: 'Dec 2024' },
    { id: 'sharpshooter', name: 'Sharpshooter', description: '50%+ headshot rate in a season', tier: 'epic', category: 'Skill', emoji: '🎯', color: 'from-fuchsia-400 to-pink-600', glow: '#ec4899', earned: true, earnedDate: 'Feb 2025' },
    { id: 'warlord', name: 'Warlord', description: 'Led a team to 10 victories', tier: 'epic', category: 'Leadership', emoji: '⚔️', color: 'from-red-400 to-rose-600', glow: '#ef4444', earned: false },
    { id: 'phoenix', name: 'Phoenix', description: 'Won a tournament from last place', tier: 'epic', category: 'Comeback', emoji: '🔥', color: 'from-orange-400 to-red-600', glow: '#f97316', earned: false },

    // ── RARE ──────────────────────────────
    { id: 'early_bird', name: 'Early Bird', description: 'Joined during the beta phase', tier: 'rare', category: 'Community', emoji: '🐦', color: 'from-blue-400 to-cyan-600', glow: '#06b6d4', earned: true, earnedDate: 'Nov 2023' },
    { id: 'sweeper', name: 'Tournament Sweep', description: 'Registered in 10+ tournaments', tier: 'rare', category: 'Activity', emoji: '🧹', color: 'from-sky-400 to-blue-600', glow: '#3b82f6', earned: true, earnedDate: 'Mar 2025', progress: { current: 10, max: 10 } },
    { id: 'team_player', name: 'Team Player', description: 'Played with 5 different teams', tier: 'rare', category: 'Social', emoji: '🤝', color: 'from-indigo-400 to-purple-600', glow: '#6366f1', earned: false, progress: { current: 3, max: 5 } },
    { id: 'streak_5', name: 'Win Streak', description: '5 consecutive match wins', tier: 'rare', category: 'Streak', emoji: '🔥', color: 'from-orange-400 to-yellow-600', glow: '#f59e0b', earned: true, earnedDate: 'Dec 2024' },

    // ── SPECIAL ───────────────────────────
    { id: 'verified', name: 'Verified Pro', description: 'Verified professional player', tier: 'special', category: 'Verified', emoji: '✅', color: 'from-emerald-400 to-green-600', glow: '#10b981', earned: true, earnedDate: 'Jan 2025' },
    { id: 'content_creator', name: 'Content Creator', description: 'Official streamer / content creator', tier: 'special', category: 'Community', emoji: '📹', color: 'from-teal-400 to-emerald-600', glow: '#06b6d4', earned: false },

    // ── COMMON ────────────────────────────
    { id: 'first_win', name: 'First Win', description: 'Won your very first match', tier: 'common', category: 'Milestone', emoji: '🥇', color: 'from-gray-400 to-slate-600', glow: '#6b7280', earned: true, earnedDate: 'Oct 2023' },
    { id: 'registered', name: 'Registered', description: 'Created your player account', tier: 'common', category: 'Milestone', emoji: '🎮', color: 'from-gray-400 to-slate-600', glow: '#6b7280', earned: true, earnedDate: 'Oct 2023' },
    { id: 'profile_complete', name: 'Profile Pro', description: 'Filled out your complete profile', tier: 'common', category: 'Profile', emoji: '📋', color: 'from-gray-400 to-slate-600', glow: '#6b7280', earned: false, progress: { current: 4, max: 5 } },
];

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
                        : 'bg-gray-900/40 border-gray-700/30 opacity-55 grayscale'
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
                    <span>{badge.emoji}</span>
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
                        {tier.label}
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
                            <p className={`font-black text-sm ${tier.text}`}>{badge.emoji} {badge.name}</p>
                            <p className={`text-[10px] uppercase font-bold ${tier.text} opacity-70 mb-1`}>{tier.label} · {badge.category}</p>
                            <p className="text-xs text-gray-400 leading-snug">{badge.description}</p>
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

// ─── BadgeShowcase Component (for Profile Page) ──────────────────────────────
export function BadgeShowcase({ compact = false }: { compact?: boolean }) {
    const earned = ALL_BADGES.filter(b => b.earned);
    const locked = ALL_BADGES.filter(b => !b.earned);

    return (
        <Card className="border-border/40 bg-card/40 backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-xl">🏅</span>
                            Badges & Achievements
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                            {earned.length} earned · {locked.length} remaining
                        </CardDescription>
                    </div>
                    <Link href="/badges">
                        <button className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
                            View All →
                        </button>
                    </Link>
                </div>
                {/* Overall progress bar */}
                <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Overall Completion</span>
                        <span>{Math.round((earned.length / ALL_BADGES.length) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(earned.length / ALL_BADGES.length) * 100}%` }}
                            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                            className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-purple-500 to-blue-400"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Earned row */}
                <div className="mb-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                        <div className="h-px flex-1 bg-white/10" />
                        ✨ Earned
                        <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {earned.map(b => <BadgeCard key={b.id} badge={b} compact={compact} />)}
                    </div>
                </div>

                {/* Locked section */}
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                        <div className="h-px flex-1 bg-white/5" />
                        🔒 Locked
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {locked.map(b => <BadgeCard key={b.id} badge={b} compact={compact} />)}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
