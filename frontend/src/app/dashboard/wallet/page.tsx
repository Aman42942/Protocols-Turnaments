'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, ArrowUpRight, ArrowDownLeft, Loader2,
    CheckCircle, XCircle, Clock, CreditCard,
    Shield, Target, MessageCircle, History,
    Star, Banknote, Coins, ArrowRightLeft, DollarSign, IndianRupee, PieChart, Info, Trophy, Globe, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePayPalScriptReducer, PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { load } from '@cashfreepayments/cashfree-js';


// ---- INNER WALLET COMPONENT (needs Suspense because of useSearchParams) ----
function WalletContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderIdParam = searchParams.get('order_id');
    const [wallet, setWallet] = useState<any>(null);
    const [ledger, setLedger] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Per-currency withdrawal fees (%) fetched from CMS
    const [fees, setFees] = useState({ INR: 0, USD: 0, GBP: 0 });
    const [paypalEnabled, setPaypalEnabled] = useState(true);


    // Withdraw state
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawCurrency, setWithdrawCurrency] = useState('INR');
    const [withdrawPaypalEmail, setWithdrawPaypalEmail] = useState('');
    const [withdrawUpiId, setWithdrawUpiId] = useState('');
    const [rates, setRates] = useState({ USD: 85, GBP: 110 });


    const loadData = async () => {
        try {
            const [walletRes, ledgerRes, rateRes, gbpRes, feeInrRes, feeUsdRes, feeGbpRes, paypalEnabledRes] = await Promise.allSettled([
                api.get('/wallet'),
                api.get('/analytics/user-ledger'),
                api.get(`${process.env.NEXT_PUBLIC_API_URL || ''}/cms/content/PAYPAL_EXCHANGE_RATE`),
                api.get(`${process.env.NEXT_PUBLIC_API_URL || ''}/cms/content/GBP_TO_COIN_RATE`),
                api.get(`${process.env.NEXT_PUBLIC_API_URL || ''}/cms/content/WITHDRAWAL_FEE_INR`),
                api.get(`${process.env.NEXT_PUBLIC_API_URL || ''}/cms/content/WITHDRAWAL_FEE_USD`),
                api.get(`${process.env.NEXT_PUBLIC_API_URL || ''}/cms/content/WITHDRAWAL_FEE_GBP`),
                api.get(`${process.env.NEXT_PUBLIC_API_URL || ''}/cms/content/PAYPAL_ENABLED`),
            ]);

            if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data);
            if (ledgerRes.status === 'fulfilled') setLedger(ledgerRes.value.data);

            const newRates = { ...rates };
            if (rateRes.status === 'fulfilled' && rateRes.value.data?.value) {
                newRates.USD = Number(rateRes.value.data.value);
            }
            if (gbpRes.status === 'fulfilled' && gbpRes.value.data?.value) {
                newRates.GBP = Number(gbpRes.value.data.value);
            }
            setRates(newRates);

            // Load fees
            setFees({
                INR: feeInrRes.status === 'fulfilled' ? Number(feeInrRes.value.data?.value || 0) : 0,
                USD: feeUsdRes.status === 'fulfilled' ? Number(feeUsdRes.value.data?.value || 0) : 0,
                GBP: feeGbpRes.status === 'fulfilled' ? Number(feeGbpRes.value.data?.value || 0) : 0,
            });

            // Load PayPal enabled state
            if (paypalEnabledRes.status === 'fulfilled') {
                setPaypalEnabled(paypalEnabledRes.value.data?.value !== 'false');
            }

        } catch (err) {
            console.error('Failed to load wallet data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);


    const handleWithdraw = async () => {
        if (!withdrawAmount || Number(withdrawAmount) <= 0) {
            toast.error('Enter valid amount');
            return;
        }
        if (Number(withdrawAmount) > wallet?.balance) {
            toast.error('Insufficient balance');
            return;
        }

        if (withdrawCurrency === 'INR' && !withdrawUpiId) {
            toast.error('Enter UPI ID');
            return;
        }
        if ((withdrawCurrency === 'USD' || withdrawCurrency === 'GBP') && !withdrawPaypalEmail) {
            toast.error('Enter PayPal Email');
            return;
        }

        setWithdrawing(true);
        try {
            await api.post('/wallet/withdraw', {
                amount: Number(withdrawAmount),
                currency: withdrawCurrency,
                paypalEmail: (withdrawCurrency === 'USD' || withdrawCurrency === 'GBP') ? withdrawPaypalEmail : undefined,
                upiId: withdrawCurrency === 'INR' ? withdrawUpiId : undefined
            });
            toast.success('Withdrawal request submitted!');
            setShowWithdraw(false);
            setWithdrawAmount('');
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Withdrawal failed');
        } finally {
            setWithdrawing(false);
        }
    };



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
            default: return <Wallet className="h-5 w-5 text-muted-foreground" />;
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Syncing Ledger...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-5xl py-8 space-y-8">

                {/* ===== WALLET HERO CARD ===== */}
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-yellow-500 via-yellow-600 to-orange-600 p-6 sm:p-8 text-white shadow-2xl shadow-yellow-500/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Coins className="h-5 w-5 opacity-90 text-yellow-200" />
                                <span className="text-sm font-bold tracking-wider opacity-90 text-yellow-100">WINNINGS & REWARDS BALANCE</span>
                            </div>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-6xl font-black tracking-tighter drop-shadow-sm">
                                    {Math.floor(wallet?.balance || 0).toLocaleString()}
                                </span>
                                <span className="text-xl font-bold opacity-80">.{(wallet?.balance % 1).toFixed(2).substring(2)}</span>
                            </div>
                            <p className="text-sm text-yellow-100 font-medium">Earn coins by winning tournaments. Redeem them for real-world rewards.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 min-w-[280px]">
                            <Button
                                size="lg"
                                variant="outline"
                                className="bg-white/10 hover:bg-white/20 border-white/30 text-white font-black tracking-wide min-w-[200px] h-14 rounded-2xl items-center gap-3 backdrop-blur-sm transition-all"
                                onClick={() => setShowWithdraw(true)}
                            >
                                <ArrowUpRight className="h-6 w-6" />
                                WITHDRAW WINNINGS
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ===== LEDGER / ANALYTICS GRID ===== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                            <ArrowDownLeft className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">Total Top-ups</p>
                            <p className="text-xl font-black">{ledger?.totalDeposited?.toLocaleString()} <span className="text-sm text-muted-foreground">Coins</span></p>
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                            <Target className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">Entry Fees Spent</p>
                            <p className="text-xl font-black">{ledger?.totalSpent?.toLocaleString()} <span className="text-sm text-muted-foreground">Coins</span></p>
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">Tournament Winnings</p>
                            <p className="text-xl font-black">{ledger?.totalWon?.toLocaleString()} <span className="text-sm text-muted-foreground">Coins</span></p>
                        </div>
                    </div>
                </div>


                {/* ===== WITHDRAWAL MODAL ===== */}
                <AnimatePresence>
                    {showWithdraw && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl relative z-0 mb-8"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-yellow-500" />
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl font-black flex items-center gap-2">
                                            <Banknote className="h-6 w-6 text-orange-500" />
                                            Withdraw Winnings
                                        </CardTitle>
                                        <CardDescription className="font-medium mt-1">Transfer your prize coins to your real-world account.</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setShowWithdraw(false)}>✕</Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        {/* Currency Selection */}
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Choose Currency</label>
                                            <div className="flex gap-2">
                                                {(['INR', 'USD', 'GBP'] as const)
                                                    .filter(curr => curr === 'INR' || paypalEnabled)
                                                    .map((curr) => (
                                                        <button
                                                            key={curr}
                                                            onClick={() => setWithdrawCurrency(curr)}
                                                            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${withdrawCurrency === curr ? 'border-orange-500 bg-orange-500/10' : 'border-border bg-muted/30 hover:bg-muted'}`}
                                                        >
                                                            <span className={`font-black text-sm ${withdrawCurrency === curr ? 'text-orange-500' : 'text-muted-foreground'}`}>{curr}</span>
                                                            <span className="text-[10px] text-muted-foreground mt-0.5">
                                                                {curr === 'INR' ? 'UPI' : 'PayPal'}
                                                            </span>
                                                        </button>
                                                    ))}
                                            </div>
                                            {!paypalEnabled && (
                                                <p className="text-xs text-amber-500 mt-2 font-medium">⚠️ International payments (PayPal) are currently disabled by admin.</p>
                                            )}
                                        </div>


                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Amount to Withdraw (Coins)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500"><Coins className="w-5 h-5" /></span>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    value={withdrawAmount}
                                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                                    className="text-2xl font-black pl-12 h-14 bg-muted/50 border-border/50"
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase">Available: {wallet?.balance?.toLocaleString()} Coins</p>
                                        </div>

                                        {withdrawCurrency === 'INR' ? (
                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">UPI ID</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500"><IndianRupee className="w-5 h-5" /></span>
                                                    <Input
                                                        placeholder="username@bank"
                                                        value={withdrawUpiId}
                                                        onChange={(e) => setWithdrawUpiId(e.target.value)}
                                                        className="pl-12 h-14 bg-muted/50 border-border/50 font-medium"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">PayPal Email Address</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500"><Globe className="w-5 h-5" /></span>
                                                    <Input
                                                        type="email"
                                                        placeholder="your-paypal@email.com"
                                                        value={withdrawPaypalEmail}
                                                        onChange={(e) => setWithdrawPaypalEmail(e.target.value)}
                                                        className="pl-12 h-14 bg-muted/50 border-border/50 font-medium"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-orange-500/5 rounded-3xl p-6 border border-orange-500/10 flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                                <div className="text-xs text-muted-foreground leading-relaxed">
                                                    <p>Withdrawals are processed within <span className="text-orange-600 font-bold">24-48 hours</span>.</p>
                                                    <p className="mt-1">Rate: <span className="font-bold text-foreground">1 {withdrawCurrency} = {withdrawCurrency === 'INR' ? '1' : withdrawCurrency === 'USD' ? rates.USD : rates.GBP} Coins</span></p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                                                {/* Fee row */}
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-orange-700">Service Fee ({fees[withdrawCurrency as keyof typeof fees]}%)</span>
                                                    <span className="text-xs font-bold text-orange-700">
                                                        {fees[withdrawCurrency as keyof typeof fees] === 0
                                                            ? '₹0 (FREE)'
                                                            : `${((Number(withdrawAmount) || 0) * fees[withdrawCurrency as keyof typeof fees] / 100).toFixed(2)} Coins`
                                                        }
                                                    </span>
                                                </div>
                                                {/* Estimated value row */}
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-orange-700">Estimated Value (After Fee)</span>
                                                    <span className="text-sm font-black text-orange-800">
                                                        ≈ {withdrawCurrency === 'USD' ? '$' : withdrawCurrency === 'GBP' ? '£' : '₹'}
                                                        {(() => {
                                                            const amt = Number(withdrawAmount) || 0;
                                                            const feePercent = fees[withdrawCurrency as keyof typeof fees];
                                                            const coinsAfterFee = amt - (amt * feePercent / 100);
                                                            const rate = withdrawCurrency === 'INR' ? 1 : withdrawCurrency === 'USD' ? rates.USD : rates.GBP;
                                                            return (coinsAfterFee / rate).toFixed(2);
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full h-14 rounded-2xl font-black text-lg bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-500/20 mt-6"
                                            onClick={handleWithdraw}
                                            disabled={withdrawing || !withdrawAmount || (withdrawCurrency === 'INR' ? !withdrawUpiId : !withdrawPaypalEmail)}
                                        >
                                            {withdrawing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Request Withdrawal"}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ===== TRANSACTION HISTORY ===== */}
                <Card className="border-border shadow-md rounded-3xl overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b border-border">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2 font-black">
                                    <History className="h-5 w-5 text-primary" />
                                    Transaction Ledger
                                </CardTitle>
                                <CardDescription className="font-medium mt-1 leading-none">
                                    A detailed history of your tournament entries and prize winnings.
                                </CardDescription>
                            </div>

                            <Button
                                size="sm"
                                variant="outline"
                                disabled={loading}
                                onClick={async () => {
                                    setLoading(true);
                                    await loadData();
                                    toast.success('Ledger Refreshed');
                                }}
                                className="bg-muted shadow-sm hover:bg-muted/80 border-border font-bold h-9"
                            >
                                <History className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'Refreshing...' : 'Refresh History'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {(!ledger?.history || ledger.history.length === 0) ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="font-bold text-lg">No records found</p>
                                <p className="text-sm mt-1">Your detailed ledger will populate as you play.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {ledger.history.map((tx: any) => (
                                    <div key={tx.id} className="flex items-center gap-4 p-4 sm:p-5 hover:bg-muted/20 transition-colors group">
                                        <div className="p-3 rounded-2xl bg-muted/80 group-hover:bg-primary/10 group-hover:scale-110 transition-all shadow-sm">
                                            {getTxIcon(tx.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm sm:text-base truncate">{tx.narrative}</p>
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1 font-medium">
                                                <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md">
                                                    {getStatusIcon(tx.status)}
                                                    {tx.status}
                                                </span>
                                                <span className="hidden sm:inline opacity-50">·</span>
                                                <span>{formatDate(tx.date)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right whitespace-nowrap">
                                            <div className={`font-black tracking-tight text-lg sm:text-xl flex flex-col items-end justify-center ${tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' ? 'text-green-500' : 'text-foreground'}`}>
                                                <div className="flex items-center gap-1">
                                                    {tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' ? '+' : '-'}
                                                    {tx.amount.toLocaleString()} <Coins className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-mono text-muted-foreground opacity-60 mt-1 uppercase tracking-widest">{tx.type.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ---- DEFAULT EXPORT: wraps in Suspense for Next.js static generation ----
export default function WalletPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                    <p className="text-muted-foreground text-sm font-medium tracking-wider">Loading Wallet...</p>
                </div>
            </div>
        }>
            <WalletContent />
        </Suspense>
    );
}
