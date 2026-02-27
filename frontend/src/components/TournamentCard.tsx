import React from 'react';
import { Trophy, Calendar, Users, Clock } from 'lucide-react';
import { Button } from './ui/Button';
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
        LOW: 'text-green-400 border-green-500/30 bg-green-500/10',
        MEDIUM: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
        HIGH: 'text-red-500 border-red-500/30 bg-red-500/10',
    };

    return (
        <div className="group relative rounded-xl bg-[#0a0a16] border border-white/10 overflow-hidden hover:border-[#00f0ff]/50 transition-all duration-300 shadow-lg hover:shadow-[#00f0ff]/20">
            <div className="h-48 overflow-hidden relative">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a16] to-transparent opacity-80" />
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold border ${tierColors[tier]} backdrop-blur-sm`}>
                    {tier} TIER
                </div>
                <div className="absolute bottom-4 left-4">
                    <span className="text-[#00f0ff] text-sm font-bold tracking-wider">{game}</span>
                    <h3 className="text-xl font-bold text-white leading-tight">{title}</h3>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center text-gray-400 gap-2">
                        <Trophy className="w-4 h-4 text-[#fcee0a]" />
                        <span>Prize Pool</span>
                    </div>
                    <span className="text-[#fcee0a] font-bold text-lg">₹{prizePool}</span>
                </div>

                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                    <div className="flex items-center text-gray-400 gap-2">
                        <Users className="w-4 h-4" />
                        <span>Slots</span>
                    </div>
                    <span className="text-white">{registeredTeams}/{maxTeams} Teams</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{startDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Registration Open</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="text-white font-bold">
                        Entry: <span className={entryFee === 0 ? "text-green-400" : "text-white"}>{entryFee === 0 ? "FREE" : `₹${entryFee}`}</span>
                    </div>
                    <Link href={`/tournaments/${id}`}>
                        <Button variant="outline" className="border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black">
                            Join Now
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
