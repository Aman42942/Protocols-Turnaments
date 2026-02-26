import React from 'react';
import { Trophy, Calendar, Users, Clock, ArrowRight, Zap, Target } from 'lucide-react';
import { Button } from './ui/Button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
    image: string;
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
}: TournamentCardProps) {
    const tierColors = {
        LOW: 'text-green-500 bg-green-500/10 border-green-500/20',
        MEDIUM: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
        HIGH: 'text-primary bg-primary/10 border-primary/20',
    };

    const isFull = registeredTeams >= maxTeams;

    return (
        <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="group relative h-full"
        >
            <Link href={`/tournaments/${id}`} className="block h-full">
                <div className="relative h-full flex flex-col rounded-[2.5rem] bg-card/40 backdrop-blur-md border border-border/40 overflow-hidden shadow-2xl transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-primary/10">

                    {/* Media Container */}
                    <div className="relative h-56 overflow-hidden">
                        <img
                            src={image}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

                        {/* Status Overlay */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-4">
                            <div className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md",
                                tierColors[tier]
                            )}>
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
                            <div className="flex items-center gap-2 bg-background/20 backdrop-blur-md border border-white/10 px-3 py-1 rounded-xl">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{game}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 flex flex-col">
                        <h3 className="text-2xl font-black text-foreground tracking-tighter mb-4 leading-none group-hover:text-primary transition-colors">
                            {title.toUpperCase()}
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 rounded-2xl bg-muted/30 border border-border/20">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Trophy className="w-3 h-3 text-yellow-500" /> Winnings
                                </p>
                                <p className="text-xl font-black text-foreground tracking-tight">₹{prizePool.toLocaleString()}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/30 border border-border/20">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Zap className="w-3 h-3 text-primary" /> Entry
                                </p>
                                <p className="text-xl font-black text-foreground tracking-tight">
                                    {entryFee === 0 ? "FREE" : `₹${entryFee}`}
                                </p>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-3 mb-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-xs font-bold text-muted-foreground">{registeredTeams}/{maxTeams} REGISTERED</span>
                                </div>
                                <span className="text-xs font-black text-primary italic">{Math.round((registeredTeams / maxTeams) * 100)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(registeredTeams / maxTeams) * 100}%` }}
                                    className="h-full bg-primary"
                                />
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="mt-auto flex items-center justify-between pt-6 border-t border-border/20">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Starts On</span>
                                <span className="text-sm font-black text-foreground">{startDate}</span>
                            </div>

                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:shadow-primary/40 transition-all duration-300">
                                <ArrowRight className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
