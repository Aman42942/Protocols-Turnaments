"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Trophy, Users, Calendar, Gamepad2, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
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

export function TournamentCard({
    id, title, game, tier, entryFee, prizePool, startDate, maxTeams, registeredTeams, gameMode, status
}: TournamentCardProps) {
    const isFull = registeredTeams >= maxTeams;
    const fillPercent = Math.min((registeredTeams / maxTeams) * 100, 100);

    return (
        <Link href={`/tournaments/${id}`} className="block h-full group">
            <Card className="overflow-hidden rounded-[1.5rem] border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
                {/* Header Section */}
                <div className="relative h-32 bg-muted/20 flex flex-col items-center justify-center border-b border-border/10 overflow-hidden">
                    <div className="absolute top-3 left-3 flex gap-2">
                        <Badge variant="outline" className="bg-background/80 text-[9px] font-bold tracking-wider">{game}</Badge>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-bold">{tier}</Badge>
                    </div>

                    <div className="p-3 rounded-2xl bg-primary/5 group-hover:scale-105 transition-transform duration-300">
                        <Gamepad2 className="h-8 w-8 text-primary/60" />
                    </div>
                </div>

                <CardHeader className="pt-5 pb-2 px-5">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px] font-bold bg-muted text-muted-foreground">{gameMode}</Badge>
                    </div>
                    <CardTitle className="text-lg font-bold tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{title}</CardTitle>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                </CardHeader>

                <CardContent className="px-5 py-4 flex-grow space-y-4">
                    {/* Prize Info */}
                    <div className="flex gap-2">
                        <div className="flex-1 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-0.5">Prize Pool</p>
                            <p className="text-lg font-black tracking-tight">₹{prizePool.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex-1 p-3 rounded-xl bg-primary/5 border border-primary/10 text-right">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">Entry</p>
                            <p className="text-lg font-black tracking-tight">{entryFee > 0 ? `₹${entryFee}` : 'FREE'}</p>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" /> {registeredTeams} / {maxTeams}
                            </span>
                            <span className={isFull ? 'text-red-500' : 'text-primary'}>
                                {isFull ? 'FULL' : `${maxTeams - registeredTeams} Slots Left`}
                            </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn("h-full transition-all duration-500", isFull ? 'bg-red-500' : 'bg-primary')}
                                style={{ width: `${fillPercent}%` }}
                            />
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="px-5 pb-5 pt-0">
                    <Button
                        className="w-full h-11 rounded-xl font-bold tracking-tight text-sm"
                        variant={isFull ? "outline" : "default"}
                        disabled={isFull}
                    >
                        {isFull ? 'REGISTRATION CLOSED' : 'REGISTER NOW'}
                    </Button>
                </CardFooter>
            </Card>
        </Link>
    );
}
