"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ALL_BADGES, AchievementBadge } from '@/components/profile/BadgeShowcase';

const CATEGORIES = ['All', 'Tournament', 'Streak', 'Skill', 'Leadership', 'Community', 'Leaderboard', 'Social', 'Activity', 'Milestone', 'Profile', 'Verified', 'Comeback'];
const TIERS = ['All', 'legendary', 'epic', 'rare', 'special', 'common'] as const;

const TIER_LABELS: Record<string, string> = {
    legendary: '👑 Legendary',
    epic: '💜 Epic',
    rare: '💙 Rare',
    special: '💚 Special',
    common: '⬜ Common',
};

const TIER_GLOW: Record<string, string> = {
    legendary: 'text-yellow-300',
    epic: 'text-purple-300',
    rare: 'text-blue-300',
    special: 'text-emerald-300',
    common: 'text-gray-300',
};

import { AnimatePresence } from 'framer-motion';

function BadgeDetailModal({ badge, onClose }: { badge: AchievementBadge; onClose: () => void }) {
    const tierColors: Record<string, string> = {
        legendary: 'border-yellow-400/60 shadow-yellow-400/30',
        epic: 'border-purple-500/60 shadow-purple-500/30',
        rare: 'border-blue-400/60 shadow-blue-400/30',
        special: 'border-emerald-400/60 shadow-emerald-400/30',
        common: 'border-gray-500/40',
    };
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                onClick={e => e.stopPropagation()}
                className={`bg-gray-950 border rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl ${tierColors[badge.tier]}`}
            >
                <div className="text-8xl mb-6 select-none">{badge.emoji}</div>
                <h2 className="text-2xl font-black text-white mb-1">{badge.name}</h2>
                <span className={`text-xs font-black uppercase tracking-widest ${TIER_GLOW[badge.tier]} mb-4 block`}>
                    {TIER_LABELS[badge.tier]} · {badge.category}
                </span>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">{badge.description}</p>

                {badge.progress && !badge.earned && (
                    <div className="mb-6">
                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                            <span>Progress</span><span>{badge.progress.current} / {badge.progress.max}</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(badge.progress.current / badge.progress.max) * 100}%` }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className={`h-full rounded-full bg-gradient-to-r ${badge.color}`}
                            />
                        </div>
                    </div>
                )}

                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black ${badge.earned ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                    {badge.earned ? `✅ Earned ${badge.earnedDate ? `· ${badge.earnedDate}` : ''}` : '🔒 Not yet earned'}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function BadgesPage() {
    const [tierFilter, setTierFilter] = useState<string>('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState<'all' | 'earned' | 'locked'>('all');
    const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);

    const earned = ALL_BADGES.filter(b => b.earned);

    const filtered = ALL_BADGES.filter(b => {
        const matchTier = tierFilter === 'All' || b.tier === tierFilter;
        const matchCat = categoryFilter === 'All' || b.category === categoryFilter;
        const matchStatus = statusFilter === 'all' || (statusFilter === 'earned' ? b.earned : !b.earned);
        return matchTier && matchCat && matchStatus;
    });

    const tierColors: Record<string, string> = {
        legendary: 'border-yellow-400/60 from-yellow-950/60 via-amber-900/40 to-yellow-950/60 shadow-[0_0_30px_-5px_rgba(234,179,8,0.5)]',
        epic: 'border-purple-500/60 from-purple-950/60 via-fuchsia-900/30 to-purple-950/60 shadow-[0_0_30px_-5px_rgba(168,85,247,0.5)]',
        rare: 'border-blue-400/60 from-blue-950/60 via-sky-900/30 to-blue-950/60 shadow-[0_0_25px_-5px_rgba(59,130,246,0.5)]',
        special: 'border-emerald-400/60 from-emerald-950/60 via-green-900/30 to-emerald-950/60 shadow-[0_0_25px_-5px_rgba(52,211,153,0.4)]',
        common: 'border-gray-600/40 from-gray-900/60 via-gray-800/30 to-gray-900/60',
    };

    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="container max-w-6xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <h1 className="text-5xl font-black text-white mb-3">
                        🏅 <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-400 to-blue-400">Achievement Badges</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">Earn badges by dominating tournaments and completing challenges</p>
                    <div className="flex justify-center gap-6 mt-6 text-center">
                        <div><p className="text-3xl font-black text-yellow-400">{earned.length}</p><p className="text-xs text-muted-foreground">Earned</p></div>
                        <div className="w-px bg-border" />
                        <div><p className="text-3xl font-black">{ALL_BADGES.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
                        <div className="w-px bg-border" />
                        <div><p className="text-3xl font-black text-green-400">{Math.round((earned.length / ALL_BADGES.length) * 100)}%</p><p className="text-xs text-muted-foreground">Complete</p></div>
                    </div>
                </motion.div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                    {(['all', 'earned', 'locked'] as const).map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${statusFilter === s ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>
                            {s === 'all' ? 'All' : s === 'earned' ? '✅ Earned' : '🔒 Locked'}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2 mb-8 justify-center">
                    {TIERS.map(t => (
                        <button key={t} onClick={() => setTierFilter(t)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${tierFilter === t
                                ? t === 'legendary' ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300'
                                    : t === 'epic' ? 'bg-purple-500/20 border-purple-400/50 text-purple-300'
                                        : t === 'rare' ? 'bg-blue-500/20 border-blue-400/50 text-blue-300'
                                            : t === 'special' ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                                                : 'bg-white/10 border-white/20 text-white'
                                : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                            {t === 'All' ? '🌟 All Tiers' : TIER_LABELS[t]}
                        </button>
                    ))}
                </div>

                {/* Badge Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    <AnimatePresence>
                        {filtered.map((badge, i) => (
                            <motion.div
                                key={badge.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ delay: i * 0.04, type: 'spring', stiffness: 250 }}
                                whileHover={{ scale: 1.06, y: -4 }}
                                onClick={() => setSelectedBadge(badge)}
                                className={`relative flex flex-col items-center text-center p-4 rounded-2xl border bg-gradient-to-b cursor-pointer
                                    ${badge.earned ? tierColors[badge.tier] : 'border-gray-700/30 from-gray-900/40 to-gray-900/40 opacity-50 grayscale'}
                                `}
                            >
                                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${badge.color} opacity-${badge.earned ? '80' : '20'}`} />
                                <div className="text-4xl mb-2 select-none">{badge.emoji}</div>
                                <p className="font-black text-xs text-white leading-tight">{badge.name}</p>
                                <span className={`text-[9px] mt-1 font-bold uppercase tracking-wider ${badge.earned ? TIER_GLOW[badge.tier] : 'text-gray-600'}`}>
                                    {badge.tier}
                                </span>
                                {badge.earned
                                    ? <span className="text-[9px] text-green-400/70 mt-1">{badge.earnedDate || '✓'}</span>
                                    : badge.progress
                                        ? <div className="w-full mt-2">
                                            <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
                                                <div className={`h-full bg-gradient-to-r ${badge.color}`} style={{ width: `${(badge.progress.current / badge.progress.max) * 100}%` }} />
                                            </div>
                                        </div>
                                        : <span className="text-[9px] text-gray-600 mt-1">🔒 Locked</span>
                                }
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        <p className="text-4xl mb-3">🏜️</p>
                        <p>No badges match your filters</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedBadge && <BadgeDetailModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />}
            </AnimatePresence>
        </div>
    );
}
