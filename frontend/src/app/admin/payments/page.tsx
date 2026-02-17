'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    IndianRupee, CreditCard, ArrowUpRight, Loader2,
    CheckCircle, XCircle, Clock, QrCode, AlertCircle
} from 'lucide-react';
import api from '@/lib/api';

interface PendingDeposit {
    id: string;
    amount: number;
    status: string;
    method: string;
    reference: string;
    description: string;
    createdAt: string;
    wallet: {
        user: {
            id: string;
            name: string;
            email: string;
        };
    };
}

interface Transaction {
    id: string;
    type: string;
    amount: number;
    status: string;
    method?: string;
    reference?: string;
    description?: string;
    createdAt: string;
    wallet: {
        user: {
            id: string;
            name: string;
            email: string;
        };
    };
}

export default function AdminPaymentsPage() {
    const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [tab, setTab] = useState<'pending' | 'all'>('pending');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [pendingRes, allRes] = await Promise.allSettled([
                api.get('/wallet/admin/pending'),
                api.get('/wallet/admin/all-transactions'),
            ]);

            if (pendingRes.status === 'fulfilled') setPendingDeposits(pendingRes.value.data);
            if (allRes.status === 'fulfilled') setAllTransactions(allRes.value.data.transactions || []);
        } catch (err) {
            console.error('Failed to fetch admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (!confirm('Approve this deposit? The amount will be credited to the user\'s wallet.')) return;
        setProcessingId(id);
        try {
            await api.post(`/wallet/admin/approve/${id}`);
            await fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to approve');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Rejection reason (optional):');
        setProcessingId(id);
        try {
            await api.post(`/wallet/admin/reject/${id}`, { reason });
            await fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to reject');
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    // Calculate stats from real data
    const totalRevenue = allTransactions
        .filter(t => t.type === 'DEPOSIT' && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalTransactions = allTransactions.length;

    const stats = [
        { title: 'Total Deposits', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: <IndianRupee className="w-5 h-5 text-green-500" />, sub: 'Completed deposits' },
        { title: 'Total Transactions', value: totalTransactions.toString(), icon: <CreditCard className="w-5 h-5 text-blue-500" />, sub: 'All time' },
        { title: 'Pending Approvals', value: pendingDeposits.length.toString(), icon: <Clock className="w-5 h-5 text-yellow-500" />, sub: 'Awaiting verification' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Payments & Deposits</h1>
                <p className="text-muted-foreground">Manage QR deposits, approve payments, and track revenue.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <div className="p-2 rounded-full bg-secondary">{stat.icon}</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border pb-2">
                <button
                    onClick={() => setTab('pending')}
                    className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === 'pending'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                >
                    <Clock className="inline h-4 w-4 mr-1" />
                    Pending Approvals ({pendingDeposits.length})
                </button>
                <button
                    onClick={() => setTab('all')}
                    className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === 'all'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                >
                    <CreditCard className="inline h-4 w-4 mr-1" />
                    All Transactions
                </button>
            </div>

            {/* Pending Deposits Tab */}
            {tab === 'pending' && (
                <div className="space-y-4">
                    {pendingDeposits.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                                <h3 className="text-lg font-bold">All Clear!</h3>
                                <p className="text-muted-foreground">No pending deposits to review.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        pendingDeposits.map((deposit) => (
                            <Card key={deposit.id} className="border-yellow-500/20">
                                <CardContent className="p-5">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-full bg-yellow-500/10">
                                                <QrCode className="h-6 w-6 text-yellow-500" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-lg">₹{deposit.amount}</h3>
                                                    <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Pending</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    <span className="font-medium text-foreground">{deposit.wallet?.user?.name || 'Unknown'}</span>
                                                    {' · '}{deposit.wallet?.user?.email}
                                                </p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                                                    <span>UTR: <span className="font-mono font-medium text-foreground">{deposit.reference}</span></span>
                                                    <span>{formatDate(deposit.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 md:flex-col">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                                onClick={() => handleApprove(deposit.id)}
                                                disabled={processingId === deposit.id}
                                            >
                                                {processingId === deposit.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <><CheckCircle className="h-4 w-4 mr-1" /> Approve</>
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-500 border-red-500/30 hover:bg-red-500/10 flex-1"
                                                onClick={() => handleReject(deposit.id)}
                                                disabled={processingId === deposit.id}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" /> Reject
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* All Transactions Tab */}
            {tab === 'all' && (
                <Card>
                    <CardContent className="p-0">
                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground font-medium">
                                    <tr>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">Method</th>
                                        <th className="p-4">Reference</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {allTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                No transactions yet
                                            </td>
                                        </tr>
                                    ) : (
                                        allTransactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-medium">{tx.wallet?.user?.name || '—'}</p>
                                                        <p className="text-xs text-muted-foreground">{tx.wallet?.user?.email || '—'}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="capitalize">{tx.type.replace('_', ' ').toLowerCase()}</span>
                                                </td>
                                                <td className="p-4 text-xs">{tx.method || '—'}</td>
                                                <td className="p-4 font-mono text-xs">{tx.reference || '—'}</td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                            tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                                <td className={`p-4 text-right font-medium ${tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' ? 'text-green-500' : ''
                                                    }`}>
                                                    {tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' ? '+' : '-'}₹{tx.amount}
                                                </td>
                                                <td className="p-4 text-right text-muted-foreground text-xs">{formatDate(tx.createdAt)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
