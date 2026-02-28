"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import Link from 'next/link';
import {
    Users, ArrowLeft, Loader2, UserX, CheckCircle2,
    AlertTriangle, IndianRupee, Search, ShieldAlert,
    ShieldCheck, Clock, XCircle, ChevronDown, RotateCcw
} from 'lucide-react';
import { ADMIN_ROLES } from '@/lib/roles';
import { Input } from '@/components/ui/Input';

interface Participant {
    id: string;
    status: string;
    paymentStatus: string;
    paymentId: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

interface Tournament {
    id: string;
    title: string;
    entryFeePerPerson: number;
}

export default function ParticipantsPage({ params }: { params: { id: string } }) {
    const [loading, setLoading] = useState(true);
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'CANCELLED'>('ALL');
    const [kickingId, setKickingId] = useState<string | null>(null);
    const [kickReason, setKickReason] = useState('');
    const [confirmingKick, setConfirmingKick] = useState<Participant | null>(null);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (!token || !userStr) { window.location.href = '/login'; return; }
        try {
            const user = JSON.parse(userStr);
            if (!ADMIN_ROLES.includes(user.role)) { window.location.href = '/'; return; }
        } catch { window.location.href = '/login'; return; }
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/tournaments/${params.id}/participants`);
            setTournament(res.data.tournament);
            setParticipants(res.data.participants);
        } catch (err) {
            console.error('Failed to fetch participants:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleKick = async () => {
        if (!confirmingKick) return;
        setKickingId(confirmingKick.id);
        try {
            const res = await api.delete(`/tournaments/${params.id}/participants/${confirmingKick.id}/kick`, {
                data: { reason: kickReason || 'Fraudulent registration — removed by admin' }
            });
            setSuccessMsg(res.data.message);
            setConfirmingKick(null);
            setKickReason('');
            await fetchData();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to kick participant');
        } finally {
            setKickingId(null);
        }
    };

    const handleKickAndRefund = async () => {
        if (!confirmingKick) return;
        if (!confirm(`Are you sure you want to KICK and REFUND ₹${tournament?.entryFeePerPerson} to ${confirmingKick.user.name}? This will process the refund via Cashfree.`)) return;

        setKickingId(confirmingKick.id);
        try {
            // 1. Kick the participant
            await api.delete(`/tournaments/${params.id}/participants/${confirmingKick.id}/kick`, {
                data: { reason: kickReason || 'Removed and Refunded by Admin' }
            });

            // 2. Process Refund
            await api.post('/payments/admin/refund', {
                order_id: confirmingKick.paymentId, // Assuming paymentId is the Cashfree Order ID
                amount: tournament?.entryFeePerPerson,
                userId: confirmingKick.user.id,
                tournamentId: params.id,
                tournamentTitle: tournament?.title
            });

            setSuccessMsg(`Refunded and Removed ${confirmingKick.user.name} successfully!`);
            setConfirmingKick(null);
            setKickReason('');
            await fetchData();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Refund/Kick failed');
        } finally {
            setKickingId(null);
        }
    };

    const filtered = participants.filter(p => {
        const matchSearch = !search ||
            p.user.name.toLowerCase().includes(search.toLowerCase()) ||
            p.user.email.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'ALL' || p.paymentStatus === filter;
        return matchSearch && matchFilter;
    });

    const paidCount = participants.filter(p => p.paymentStatus === 'PAID').length;
    const pendingCount = participants.filter(p => p.paymentStatus === 'PENDING').length;
    const cancelledCount = participants.filter(p => ['CANCELLED', 'REFUNDED'].includes(p.paymentStatus)).length;
    const fraudRisk = participants.filter(p => p.paymentStatus !== 'PAID' && p.status === 'APPROVED').length;

    const getPaymentBadge = (status: string) => {
        switch (status) {
            case 'PAID': return <Badge className="bg-green-500/10 text-green-400 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</Badge>;
            case 'PENDING': return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case 'CANCELLED': return <Badge className="bg-red-500/10 text-red-400 border-red-500/20"><XCircle className="w-3 h-3 mr-1" /> Removed</Badge>;
            case 'REFUNDED': return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20"><IndianRupee className="w-3 h-3 mr-1" /> Refunded</Badge>;
            default: return <Badge className="bg-gray-500/10 text-gray-400">{status}</Badge>;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/tournaments">
                    <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Participant Manager
                    </h1>
                    <p className="text-muted-foreground text-sm">{tournament?.title} — Entry: ₹{tournament?.entryFeePerPerson || 'Free'}</p>
                </div>
            </div>

            {/* Success Toast */}
            {successMsg && (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 font-medium">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    {successMsg}
                </div>
            )}

            {/* Fraud Alert */}
            {fraudRisk > 0 && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                    <div>
                        <p className="text-red-400 font-bold text-sm">⚠️ {fraudRisk} Suspicious Registration{fraudRisk > 1 ? 's' : ''} Detected</p>
                        <p className="text-red-400/70 text-xs">Users with APPROVED status but no verified payment. Review and remove if fraudulent.</p>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-green-500/20">
                    <CardContent className="pt-5 text-center">
                        <p className="text-2xl font-bold text-green-400">{paidCount}</p>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1"><ShieldCheck className="w-3 h-3" /> Verified Paid</p>
                    </CardContent>
                </Card>
                <Card className="border-yellow-500/20">
                    <CardContent className="pt-5 text-center">
                        <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1"><Clock className="w-3 h-3" /> Pending Review</p>
                    </CardContent>
                </Card>
                <Card className="border-red-500/20">
                    <CardContent className="pt-5 text-center">
                        <p className="text-2xl font-bold text-red-400">{fraudRisk}</p>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1"><ShieldAlert className="w-3 h-3" /> Fraud Risk</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 text-center">
                        <p className="text-2xl font-bold text-gray-400">{cancelledCount}</p>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1"><XCircle className="w-3 h-3" /> Removed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-3 justify-between">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-9"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {(['ALL', 'PAID', 'PENDING', 'CANCELLED'] as const).map(f => (
                                <Button
                                    key={f}
                                    size="sm"
                                    variant={filter === f ? 'default' : 'outline'}
                                    onClick={() => setFilter(f)}
                                >
                                    {f}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-xl border overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="p-4 text-left">Player</th>
                                    <th className="p-4 text-left">Payment Status</th>
                                    <th className="p-4 text-left">Reg. Status</th>
                                    <th className="p-4 text-left">Payment Ref</th>
                                    <th className="p-4 text-left">Joined</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-10 text-center text-muted-foreground">
                                            No participants found
                                        </td>
                                    </tr>
                                ) : filtered.map(p => {
                                    const isFraud = p.paymentStatus !== 'PAID' && p.status === 'APPROVED';
                                    const isRemoved = ['CANCELLED', 'REFUNDED'].includes(p.paymentStatus);
                                    return (
                                        <tr key={p.id} className={`hover:bg-muted/20 transition-colors ${isFraud ? 'bg-red-500/5 border-red-500/10' : ''}`}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                                                        {p.user.name?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium flex items-center gap-1">
                                                            {p.user.name}
                                                            {isFraud && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">{p.user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">{getPaymentBadge(p.paymentStatus)}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'APPROVED' ? 'bg-green-500/10 text-green-400' :
                                                    p.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                                                        'bg-gray-500/10 text-gray-400'
                                                    }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {p.paymentId ? (
                                                    <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                                        {p.paymentId.slice(0, 16)}...
                                                    </span>
                                                ) : (
                                                    <span className="text-red-400 text-xs font-medium">No Reference</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-xs text-muted-foreground">
                                                {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="p-4 text-right">
                                                {isRemoved ? (
                                                    <span className="text-xs text-muted-foreground italic">Removed</span>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all gap-1.5"
                                                        onClick={() => setConfirmingKick(p)}
                                                        disabled={kickingId === p.id}
                                                    >
                                                        {kickingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                                                        Kick
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Confirm Kick Modal */}
            {confirmingKick && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-card border border-red-500/30 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                <UserX className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Remove Participant?</h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    You are about to remove <strong>{confirmingKick.user.name}</strong> ({confirmingKick.user.email}) from this tournament. This cannot be undone easily.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reason (optional)</label>
                            <Input
                                placeholder="e.g. Fraudulent registration, no payment proof..."
                                value={kickReason}
                                onChange={e => setKickReason(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => { setConfirmingKick(null); setKickReason(''); }}
                            >
                                Cancel
                            </Button>

                            {confirmingKick.paymentStatus === 'PAID' && (
                                <Button
                                    variant="outline"
                                    className="flex-1 border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
                                    onClick={handleKickAndRefund}
                                    disabled={kickingId === confirmingKick.id}
                                >
                                    {kickingId === confirmingKick.id ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                    )}
                                    Kick & Refund
                                </Button>
                            )}

                            <Button
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white border-none"
                                onClick={handleKick}
                                disabled={kickingId === confirmingKick.id}
                            >
                                {kickingId === confirmingKick.id ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Removing...</>
                                ) : (
                                    <><UserX className="w-4 h-4 mr-2" /> Confirm Remove</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
