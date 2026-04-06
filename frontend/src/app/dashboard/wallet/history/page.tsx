'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import {
    Wallet, ArrowUpRight, ArrowDownLeft, Loader2,
    CheckCircle, XCircle, Clock, CreditCard,
    Star, RotateCcw, History, ArrowLeft, Coins
} from 'lucide-react';
import toast from 'react-hot-toast';

function HistoryContent() {
    const router = useRouter();
    const [ledger, setLedger] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const res = await api.get('/analytics/user-ledger');
            setLedger(res.data);
        } catch (err) {
            console.error('Failed to load ledger:', err);
            toast.error('Failed to load transaction history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'FAILED': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Clock className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getTxIcon = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
            case 'WITHDRAWAL': return <ArrowUpRight className="h-5 w-5 text-red-500" />;
            case 'ENTRY_FEE': return <CreditCard className="h-5 w-5 text-orange-500" />;
            case 'WINNINGS': return <Star className="h-5 w-5 text-yellow-500" />;
            case 'REFUND': return <RotateCcw className="h-5 w-5 text-green-500" />;
            default: return <Wallet className="h-5 w-5 text-muted-foreground" />;
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">Fetching Complete Ledger...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            <div className="container max-w-4xl py-8 space-y-6">
                
                {/* Back Button & Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-0 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors gap-2 font-bold uppercase tracking-widest text-[10px]"
                            onClick={() => router.push('/dashboard/wallet')}
                        >
                            <ArrowLeft className="w-3 h-3" />
                            Back to Wallet
                        </Button>
                        <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                            <History className="w-8 h-8 text-primary" />
                            TRANSACTION HISTORY
                        </h1>
                        <p className="text-muted-foreground font-medium">A complete record of your tournament earnings and expenditures.</p>
                    </div>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                            setLoading(true);
                            await loadData();
                            toast.success('History Updated');
                        }}
                        className="bg-card border-border font-black text-xs uppercase tracking-widest h-10 px-5 rounded-xl shadow-sm"
                    >
                        <History className="h-3.5 w-3.5 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Main Ledger Card */}
                <Card className="border-border shadow-2xl rounded-[32px] overflow-hidden bg-card/50 backdrop-blur-xl">
                    <CardContent className="p-0">
                        {(!ledger?.history || ledger.history.length === 0) ? (
                            <div className="text-center py-24 text-muted-foreground">
                                <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <History className="h-10 w-10 opacity-20" />
                                </div>
                                <p className="font-black text-xl tracking-tight">No Transactions Yet</p>
                                <p className="text-sm mt-1 max-w-xs mx-auto">Play tournaments and win prizes to build your transaction history.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/30">
                                {ledger.history.map((tx: any) => (
                                    <div key={tx.id} className="flex items-center gap-4 p-5 sm:p-6 hover:bg-primary/5 transition-all group">
                                        <div className="p-3.5 rounded-2xl bg-muted/50 group-hover:bg-primary/10 group-hover:scale-110 transition-all shadow-inner border border-border/50">
                                            {getTxIcon(tx.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-sm sm:text-base tracking-tight truncate group-hover:text-primary transition-colors">{tx.narrative}</p>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground mt-1.5 font-bold uppercase tracking-wider">
                                                <span className="flex items-center gap-1.5 bg-background/80 px-2 py-0.5 rounded-lg border border-border/50">
                                                    {getStatusIcon(tx.status)}
                                                    {tx.status}
                                                </span>
                                                <span className="opacity-30">•</span>
                                                <span className="flex items-center gap-1 border-b border-transparent group-hover:border-primary/20 transition-all">
                                                    <Clock className="w-3 h-3 opacity-50" />
                                                    {formatDate(tx.date)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right whitespace-nowrap pl-4">
                                            <div className={`font-black tracking-tighter text-xl sm:text-2xl flex flex-col items-end justify-center ${tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' || tx.type === 'REFUND' ? 'text-green-500' : 'text-foreground'}`}>
                                                <div className="flex items-center gap-1.5">
                                                    {tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' || tx.type === 'REFUND' ? '+' : '-'}
                                                    {tx.amount.toLocaleString()} 
                                                    <Coins className="w-5 h-5" />
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-black text-muted-foreground/60 mt-1 uppercase tracking-[0.2em]">{tx.type.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer Info */}
                <div className="flex items-center justify-center gap-2 p-6 rounded-3xl bg-muted/20 border border-border/50">
                    <History className="w-4 h-4 text-muted-foreground opacity-50" />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                        End of ledger • Verified & Encrypted by Protocol Systems
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function HistoryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <HistoryContent />
        </Suspense>
    );
}
