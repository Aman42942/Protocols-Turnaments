import React from 'react';
import { Trophy, Calendar, Users, Clock, ArrowRight, Zap, Target, Timer } from 'lucide-react';
import { Button } from './ui/Button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TournamentCardProps {
    id: string;
    title: string;
    game: string;
    tier: string;
    entryFee: number;
    prizePool: number;
    startDate: string;
    maxTeams: number;
    registeredTeams: number;
    image?: string;
    gameMode?: string;
    status?: string;
}

export function TournamentCard({
    id,
    title,
    game,
    tier,
    entryFee,
    prizePool,
    startDate,
    maxTeams,
    registeredTeams,
    image,
    gameMode = 'SQUAD',
    status = 'UPCOMING',
}: TournamentCardProps) {
    const tierStyles: Record<string, { color: string; badge: string }> = {
        HIGH: { color: 'text-red-500', badge: 'bg-red-500/10 border-red-500/20' },
        MEDIUM: { color: 'text-yellow-500', badge: 'bg-yellow-500/10 border-yellow-500/20' },
        LOW: { color: 'text-green-500', badge: 'bg-green-500/10 border-green-500/20' },
    };

    const style = tierStyles[tier?.toUpperCase()] || tierStyles.LOW;
    const isFull = registeredTeams >= maxTeams;
    const fillPercent = Math.min((registeredTeams / maxTeams) * 100, 100);

    const getTimeLeft = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - Date.now();
        if (diff <= 0) return null;
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        return d > 0 ? `${d}d ${h}h` : `${h}h ${Math.floor((diff % 3600000) / 60000)}m`;
    };

    const timeLeft = getTimeLeft(startDate);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="group relative h-full gpu-accel"
        >
            <Link href={`/tournaments/${id}`} className="block h-full">
                <div className="relative h-full flex flex-col rounded-[2.5rem] bg-card/60 backdrop-blur-sm border border-border/40 overflow-hidden shadow-2xl transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-primary/10">
                    {/* Media Container */}
                    <div className="relative h-48 overflow-hidden bg-muted/20">
                        {image ? (
                            <img
                                src={image}
                                alt={title}
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-500/10">
                                <Trophy className="w-12 h-12 text-primary/20" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />

                        {/* Badges */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                            <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md", style.badge, style.color)}>
                                {tier} TIER
                            </div>
                            {isFull && (
                                <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500 text-white border border-red-500/50 shadow-lg shadow-red-500/20">
                                    Full
                                </div>
                            )}
                        </div>

                        {/* Game Tag */}
                        <div className="absolute bottom-4 left-6">
                            <div className="bg-background/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-xl">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{game}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black text-primary px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20">{gameMode}</span>
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tighter mb-4 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {title.toUpperCase()}
                        </h3>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-3 rounded-2xl bg-muted/30 border border-border/10">
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Trophy className="w-3 h-3 text-yellow-500" /> Winnings
                                </p>
                                <p className="text-lg font-black text-foreground">₹{prizePool.toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-muted/30 border border-border/10">
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Zap className="w-3 h-3 text-primary" /> Entry
                                </p>
                                <p className="text-lg font-black text-foreground">
                                    {entryFee === 0 ? "FREE" : `₹${entryFee}`}
                                </p>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2 mb-6">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-muted-foreground uppercase tracking-wider">{registeredTeams}/{maxTeams} REGISTERED</span>
                                <span className="text-primary italic">{Math.round(fillPercent)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${fillPercent}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className={cn("h-full", isFull ? "bg-red-500" : "bg-primary")}
                                />
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/10">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                    {timeLeft ? 'Starts In' : 'Status'}
                                </span>
                                <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                                    {timeLeft ? (
                                        <>
                                            <Timer className="w-3 h-3 text-primary" />
                                            {timeLeft}
                                        </>
                                    ) : (
                                        status.toUpperCase()
                                    )}
                                </span>
                            </div>

                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

