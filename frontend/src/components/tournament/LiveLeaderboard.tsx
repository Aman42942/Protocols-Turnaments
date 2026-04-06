"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
    teamId: string;
    teamName: string;
    points: number;
    kills: number;
    rank: number;
    change?: number; // +1, -1, 0
}

export function LiveLeaderboard({ tournamentId }: { tournamentId: string }) {
    const socket = useSocket();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!socket) return;

        setIsConnected(socket.connected);

        // Initial fetch (mock for now, replace with API call)
        // api.get(/tournaments/${tournamentId}/leaderboard).then(...)

        // Listen for real-time updates
        socket.on(`leaderboard-update-${tournamentId}`, (data: LeaderboardEntry[]) => {
            // Calculate rank changes locally if not provided
            setLeaderboard((prev) => {
                return data.map((entry) => {
                    const prevEntry = prev.find((p) => p.teamId === entry.teamId);
                    const change = prevEntry ? prevEntry.rank - entry.rank : 0;
                    return { ...entry, change };
                });
            });
        });

        return () => {
            socket.off(`leaderboard-update-${tournamentId}`);
        };
    }, [socket, tournamentId]);

    // Mock Data for specific tournament if empty
    useEffect(() => {
        if (leaderboard.length === 0) {
            setLeaderboard([
                { teamId: '1', teamName: 'Team Alpha', points: 45, kills: 12, rank: 1, change: 0 },
                { teamId: '2', teamName: 'Bravo Squad', points: 38, kills: 8, rank: 2, change: 0 },
                { teamId: '3', teamName: 'Charlie Force', points: 30, kills: 5, rank: 3, change: 0 },
            ]);
        }
    }, []);

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                <h3 className="font-semibold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Live Leaderboard
                </h3>
                {isConnected ? (
                    <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium px-2 py-1 bg-green-500/10 rounded-full animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        LIVE
                    </span>
                ) : (
                    <span className="text-xs text-muted-foreground">Connecting...</span>
                )}
            </div>

            <div className="flex flex-col">
                <div className="grid grid-cols-12 gap-4 p-3 text-xs font-medium text-muted-foreground border-b border-border/50">
                    <div className="col-span-1 text-center">Rank</div>
                    <div className="col-span-5">Team</div>
                    <div className="col-span-2 text-center">Kills</div>
                    <div className="col-span-2 text-center">Pts</div>
                    <div className="col-span-2 text-center">Trend</div>
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    <AnimatePresence>
                        {leaderboard.map((team) => (
                            <motion.div
                                key={team.teamId}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                className={cn(
                                    "grid grid-cols-12 gap-4 p-3 items-center border-b border-border/50 hover:bg-muted/30 transition-colors",
                                    team.rank <= 3 && "bg-gradient-to-r from-yellow-500/5 to-transparent"
                                )}
                            >
                                <div className="col-span-1 flex justify-center">
                                    <span
                                        className={cn(
                                            "w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold",
                                            team.rank === 1 && "bg-yellow-500 text-black",
                                            team.rank === 2 && "bg-gray-300 text-black",
                                            team.rank === 3 && "bg-amber-600 text-white",
                                            team.rank > 3 && "text-muted-foreground"
                                        )}
                                    >
                                        {team.rank}
                                    </span>
                                </div>
                                <div className="col-span-5 font-medium flex items-center gap-2 truncate">
                                    {team.teamName}
                                    {team.kills > 10 && <Flame className="w-4 h-4 text-orange-500 animate-pulse" />}
                                </div>
                                <div className="col-span-2 text-center font-mono text-sm">{team.kills}</div>
                                <div className="col-span-2 text-center font-bold text-primary">{team.points}</div>
                                <div className="col-span-2 flex justify-center">
                                    {team.change && team.change > 0 ? (
                                        <span className="flex items-center text-xs text-green-500">
                                            <ChevronUp className="w-3 h-3" /> {Math.abs(team.change)}
                                        </span>
                                    ) : team.change && team.change < 0 ? (
                                        <span className="flex items-center text-xs text-red-500">
                                            <ChevronDown className="w-3 h-3" /> {Math.abs(team.change)}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
