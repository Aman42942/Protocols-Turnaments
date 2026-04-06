'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2, Users, Check, X, Bell, Shield, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';

export default function TeamInvitesPage() {
    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchInvites = async () => {
        try {
            const res = await api.get('/teams/invitations/me');
            setInvites(res.data);
        } catch (err) {
            console.error('Failed to load invites:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const handleRespond = async (invitationId: string, action: 'ACCEPT' | 'DECLINE') => {
        try {
            await api.patch(`/teams/invitations/${invitationId}/respond`, { action });
            if (action === 'ACCEPT') {
                // Find the team id from invites
                const invite = invites.find(i => i.id === invitationId);
                if (invite) {
                    router.push(`/dashboard/teams/${invite.team.id}`);
                    return;
                }
            }
            fetchInvites();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to respond to invitation');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-10 pb-20 px-4">
            <div className="container max-w-4xl mx-auto">
                <div className="mb-10 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-2">
                        <Bell className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter">Squad Recruitment Requests</h1>
                    <p className="text-muted-foreground text-sm uppercase font-bold tracking-widest max-w-md">
                        Review and respond to battalion invitations from other squad leaders.
                    </p>
                </div>

                {invites.length === 0 ? (
                    <Card className="bg-card/50 border-dashed border-2 border-border p-12 text-center rounded-[2.5rem]">
                        <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                        <h2 className="text-xl font-black uppercase text-muted-foreground/50">No Pending Requests</h2>
                        <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">
                            You are not currently being recruited by any squads.
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        <AnimatePresence>
                            {invites.map((invite) => (
                                <motion.div
                                    key={invite.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="relative group"
                                >
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/20 blur opacity-0 group-hover:opacity-100 transition rounded-[2rem]" />
                                    <div className="relative bg-card border border-border p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center text-2xl font-black text-primary overflow-hidden shadow-inner">
                                                {invite.team.logo ? (
                                                    <img src={invite.team.logo} className="w-full h-full object-cover" />
                                                ) : (
                                                    invite.team.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-widest px-2">
                                                        NEW REQUEST
                                                    </Badge>
                                                    <span className="text-[9px] font-mono text-muted-foreground uppercase">{invite.team.gameType}</span>
                                                </div>
                                                <h3 className="text-2xl font-black uppercase italic tracking-tight">{invite.team.name}</h3>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                                        <Shield className="w-3 h-3 text-primary" /> Squad Leader Recruitment
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <Button
                                                variant="outline"
                                                className="flex-1 md:flex-none border-border bg-muted/20 text-foreground hover:bg-red-500 hover:text-white font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-xl"
                                                onClick={() => handleRespond(invite.id, 'DECLINE')}
                                            >
                                                <X className="w-4 h-4 mr-2" /> Decline
                                            </Button>
                                            <Button
                                                className="flex-1 md:flex-none bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-primary/20"
                                                onClick={() => handleRespond(invite.id, 'ACCEPT')}
                                            >
                                                <Check className="w-4 h-4 mr-2" /> Accept & Deploy
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                <div className="mt-12 p-8 bg-blue-500/5 border border-blue-500/10 rounded-[2.5rem] flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Trophy className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-blue-500">Global Recruitment Tips</h4>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-relaxed mt-1">
                            Joining a squad increases your chances of winning multi-round tournaments. Ensure you communicate effectively with your teammates.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
