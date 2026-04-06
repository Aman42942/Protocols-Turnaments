'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Search, UserPlus, Check, X } from 'lucide-react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string;
    onInviteSent?: () => void;
}

export default function InviteModal({ isOpen, onClose, teamId, onInviteSent }: InviteModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [invitingId, setInvitingId] = useState<string | null>(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.length >= 2) {
                searchUsers();
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const searchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/users/search?q=${query}`);
            setResults(res.data);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (userId: string) => {
        setInvitingId(userId);
        try {
            await api.post(`/teams/${teamId}/invitations`, { userId });
            if (onInviteSent) onInviteSent();
            // Success feedback? Maybe just close or show check
            setTimeout(() => {
                setResults(prev => prev.filter(u => u.id !== userId));
                setInvitingId(null);
            }, 1000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to send invitation');
            setInvitingId(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border rounded-3xl overflow-hidden p-0">
                <div className="p-6 border-b border-border bg-muted/20">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">Recruit Personnel</DialogTitle>
                        <DialogDescription className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            Search global database for talent
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative mt-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Enter Username or Email..."
                            className="pl-10 h-12 bg-background border-border rounded-xl font-bold uppercase text-[11px] tracking-widest focus:ring-primary/20"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 minimal-scrollbar">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="text-[8px] font-mono uppercase tracking-[0.3em] animate-pulse text-primary">Searching Mainframe...</span>
                        </div>
                    ) : results.length > 0 ? (
                        <AnimatePresence>
                            {results.map((user) => (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex items-center justify-between p-3 rounded-2xl bg-muted/5 border border-border/50 hover:border-primary/30 hover:bg-muted/10 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden">
                                            {user.avatar ? (
                                                <img src={user.avatar} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-black text-primary uppercase">{user.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase text-foreground group-hover:text-primary transition-colors">{user.name}</p>
                                            <p className="text-[8px] font-mono text-muted-foreground uppercase">{user.email.split('@')[0]}@***</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="rounded-lg h-8 px-4 font-black uppercase text-[9px] tracking-widest"
                                        onClick={() => handleInvite(user.id)}
                                        disabled={invitingId === user.id}
                                    >
                                        {invitingId === user.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <>
                                                <UserPlus className="w-3 h-3 mr-1.5" /> Invite
                                            </>
                                        )}
                                    </Button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : query.length >= 2 ? (
                        <div className="py-12 text-center space-y-2 opacity-40">
                            <X className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="text-[9px] font-mono uppercase tracking-widest">No Matches Found in Sector</p>
                        </div>
                    ) : (
                        <div className="py-12 text-center space-y-2 opacity-40">
                            <Search className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="text-[9px] font-mono uppercase tracking-widest">Awaiting Input Query...</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border bg-muted/5 flex justify-end">
                    <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest" onClick={onClose}>
                        Close Terminal
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
