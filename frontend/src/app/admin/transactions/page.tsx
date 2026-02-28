'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
    Loader2, Search, Filter, ArrowDownLeft, ArrowUpRight,
    CheckCircle, XCircle, Clock, Banknote, IndianRupee,
    User, History, ExternalLink, ShieldCheck, RotateCcw
} from 'lucide-react';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    status: string;
    method?: string;
    reference?: string;
    description?: string;
    createdAt: string;
    user?: { id: string; name: string; email: string };
}

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED'>('ALL');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/admin/transactions');
            setTransactions(res.data);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        setProcessingId(id);
        try {
            await api.post(`/admin/transactions/${id}/${action}`);
            await fetchTransactions();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Action failed');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRefund = async (tx: Transaction) => {
        if (!confirm(`Are you sure you want to refund ₹${tx.amount} to ${tx.user?.name}?`)) return;

        setProcessingId(tx.id);
        try {
            await api.post('/payments/admin/refund', {
                order_id: tx.reference,
                amount: tx.amount,
                userId: tx.user?.id
            });
            alert('Refund initiated successfully');
            await fetchTransactions();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Refund failed');
        } finally {
            setProcessingId(null);
        }
    };

    const filtered = transactions.filter(tx => {
        const matchesSearch =
            tx.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            tx.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            tx.reference?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <Badge className="bg-green-500 hover:bg-green-600">SUCCESS</Badge>;
            case 'PENDING': return <Badge className="bg-yellow-500 hover:bg-yellow-600">PENDING</Badge>;
            case 'FAILED': return <Badge className="bg-red-500 hover:bg-red-600">FAILED</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Transaction Control</h1>
                    <p className="text-muted-foreground text-sm">Monitor and manage site-wide financial movements.</p>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-primary/10 bg-primary/5">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by User, Email or Reference..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {(['ALL', 'PENDING', 'COMPLETED', 'FAILED'] as const).map(f => (
                                <Button
                                    key={f}
                                    variant={statusFilter === f ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatusFilter(f)}
                                    className="text-[10px] font-bold"
                                >
                                    {f}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <div className="grid grid-cols-1 gap-4">
                {filtered.length === 0 ? (
                    <Card className="p-12 text-center text-muted-foreground border-dashed">
                        <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No transactions found matching your criteria.</p>
                    </Card>
                ) : (
                    filtered.map(tx => (
                        <Card key={tx.id} className="group hover:border-primary/30 transition-all">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="flex gap-4">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${tx.type === 'DEPOSIT' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {tx.type === 'DEPOSIT' ? <ArrowDownLeft className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg">₹{tx.amount.toLocaleString('en-IN')}</span>
                                                <Badge variant="outline" className="text-[10px] uppercase">{tx.method || 'WALLET'}</Badge>
                                                {getStatusBadge(tx.status)}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <User className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm font-semibold">{tx.user?.name || 'Unknown User'}</span>
                                                <span className="text-xs text-muted-foreground">({tx.user?.email})</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:items-end gap-2">
                                        <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                                            REF: {tx.reference || 'N/A'}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {new Date(tx.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {tx.status === 'PENDING' && (
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-dashed">
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold"
                                            disabled={!!processingId}
                                            onClick={() => handleAction(tx.id, 'approve')}
                                        >
                                            {processingId === tx.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                                            APPROVE
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="font-bold"
                                            disabled={!!processingId}
                                            onClick={() => handleAction(tx.id, 'reject')}
                                        >
                                            <XCircle className="h-4 w-4 mr-1.5" />
                                            REJECT
                                        </Button>
                                    </div>
                                )}

                                {tx.status === 'COMPLETED' && tx.type === 'DEPOSIT' && (
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-dashed">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10 font-bold"
                                            disabled={!!processingId}
                                            onClick={() => handleRefund(tx)}
                                        >
                                            {processingId === tx.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-1.5" />}
                                            INITIATE REFUND
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
