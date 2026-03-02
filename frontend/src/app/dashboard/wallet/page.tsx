'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

// ---- SUBCOMPONENTS FOR PAYPAL ----
const PayPalCheckout = ({ usdAmount, expectedCoins, onSuccess, onCancel, onError, currency = 'USD' }: any) => {
    const [{ isPending }] = usePayPalScriptReducer();

    if (isPending) return <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 mb-2 overflow-hidden transition-all hover:shadow-2xl">
            <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400">Secure Payment Gateway</span>
                <ShieldCheck className="w-4 h-4 text-blue-500" />
            </div>

            <PayPalButtons
                style={{
                    layout: "vertical",
                    shape: "rect",
                    color: "blue",
                    height: 45,
                    label: "pay"
                }}
                createOrder={async () => {
                    const res = await api.post('/payments/paypal/create-order', { usdAmount, currency });
                    return res.data.id;
                }}
                onApprove={async (data: any) => {
                    try {
                        toast.loading('Verifying Payment...');
                        const res = await api.post('/payments/paypal/capture-order', {
                            orderId: data.orderID,
                            expectedCoins
                        });
                        toast.dismiss();
                        toast.success(`Successfully added ${res.data.coinsAdded} Coins!`);
                        onSuccess();
                    } catch (error: any) {
                        toast.dismiss();
                        toast.error(error.response?.data?.message || 'Verification Failed');
                        onError();
                    }
                }}
                onCancel={() => {
                    toast.error('Payment Cancelled');
                    onCancel();
                }}
                onError={(err: any) => {
                    toast.error('Payment Error Occurred');
                    onError();
                }}
            />

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2">
                <div className="flex -space-x-1 opacity-60">
                    <img src="https://www.paypalobjects.com/webstatic/mktg/logo/AM_mc_vs_dc_ae.jpg" alt="Cards" className="h-4 grayscale" />
                </div>
            </div>
        </div>
    );
};

// ---- MAIN WALLET COMPONENT ----
export default function WalletPage() {
    const router = useRouter();
    const [wallet, setWallet] = useState<any>(null);
    const [ledger, setLedger] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Topup State
    const [showTopup, setShowTopup] = useState(false);
    const [topupMethod, setTopupMethod] = useState<'UPI' | 'PAYPAL' | 'PAYPAL_GBP'>('UPI');
    const [topupCoins, setTopupCoins] = useState('');
    const [exchangeRate, setExchangeRate] = useState(85); // fallback usd
    const [gbpExchangeRate, setGbpExchangeRate] = useState(110); // fallback gbp
    const [paypalClientId, setPaypalClientId] = useState('');

    // Withdraw state
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawPaypalEmail, setWithdrawPaypalEmail] = useState('');

    const loadData = async () => {
        try {
            const [walletRes, ledgerRes, rateRes, gbpRes] = await Promise.allSettled([
                api.get('/wallet'),
                api.get('/analytics/user-ledger'),
                api.get(`${process.env.NEXT_PUBLIC_API_URL}/cms/content/PAYPAL_EXCHANGE_RATE`),
                api.get(`${process.env.NEXT_PUBLIC_API_URL}/cms/content/GBP_TO_COIN_RATE`),
            ]);

            if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data);
            if (ledgerRes.status === 'fulfilled') setLedger(ledgerRes.value.data);
            if (rateRes.status === 'fulfilled') {
                const rate = Number(rateRes.value.data?.value);
                if (!isNaN(rate) && rate > 0) setExchangeRate(rate);
            }
            if (gbpRes.status === 'fulfilled') {
                const rate = Number(gbpRes.value.data?.value);
                if (!isNaN(rate) && rate > 0) setGbpExchangeRate(rate);
            }

            setPaypalClientId(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '');

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

        setWithdrawing(true);
        try {
            await api.post('/wallet/withdraw', {
                amount: Number(withdrawAmount),
                paypalEmail: withdrawPaypalEmail
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

    // Cashfree Production Integration - Verified 2026-03-02
    const handleCashfreePayment = async () => {
        if (!topupCoins || Number(topupCoins) <= 0) {
            toast.error('Enter valid amount');
            return;
        }

        try {
            toast.loading('Initializing Cashfree...');
            const res = await api.post('/payments/create-order', {
                amount: Number(topupCoins)
            });
            toast.dismiss();

            const mode = (process.env.NEXT_PUBLIC_CASHFREE_MODE || "production") as any;
            console.log(`[CASHFREE] Initializing in ${mode} mode`);

            const cashfree = await load({
                mode: mode
            });

            console.log(`[CASHFREE] Opening checkout for session: ${res.data.payment_session_id}`);
            await cashfree.checkout({
                paymentSessionId: res.data.payment_session_id,
                redirectTarget: "_modal"
            });

            // Note: Verification usually happens via webhook or manual check
            // We can show a prompt or just let the user close it
            toast.success('Checkout opened! Coins will be added after verification.');
            setShowTopup(false);
            setTopupCoins('');
        } catch (error: any) {
            toast.dismiss();
            toast.error(error.response?.data?.message || 'Cashfree initialization failed');
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

    const requestedCoins = parseFloat(topupCoins) || 0;
    const usdEquivalent = (requestedCoins / exchangeRate).toFixed(2);
    const gbpEquivalent = (requestedCoins / gbpExchangeRate).toFixed(2);
    const inrEquivalent = requestedCoins; // 1 Coin = 1 INR basically

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
                                <span className="text-sm font-bold tracking-wider opacity-90 text-yellow-100">VIRTUAL COINS BALANCE</span>
                            </div>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-6xl font-black tracking-tighter drop-shadow-sm">
                                    {Math.floor(wallet?.balance || 0).toLocaleString()}
                                </span>
                                <span className="text-xl font-bold opacity-80">.{(wallet?.balance % 1).toFixed(2).substring(2)}</span>
                            </div>
                            <p className="text-sm text-yellow-100 font-medium">1 Coin ≈ ₹1 INR ≈ ${(1 / exchangeRate).toFixed(3)} USD</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 min-w-[280px]">
                            <Button
                                size="lg"
                                className="bg-white text-yellow-600 hover:bg-white/90 font-black tracking-wide shadow-xl flex-1 items-center gap-2"
                                onClick={() => { setShowTopup(true); setShowWithdraw(false); }}
                            >
                                <ArrowDownLeft className="h-5 w-5" />
                                TOP UP COINS
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="bg-black/20 border-white/20 text-white hover:bg-black/40 font-bold tracking-wide flex-1 items-center gap-2"
                                onClick={() => { setShowWithdraw(true); setShowTopup(false); }}
                            >
                                <ArrowUpRight className="h-5 w-5" />
                                WITHDRAW
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

                {/* ===== TOPUP MODAL/PANEL ===== */}
                <AnimatePresence>
                    {showTopup && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <Card className="border-primary/20 shadow-2xl overflow-hidden bg-card relative z-0">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-primary to-green-500" />
                                <CardHeader className="bg-muted/30 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-2xl font-black flex items-center gap-2">
                                                <Coins className="h-6 w-6 text-yellow-500" />
                                                Purchase Coins
                                            </CardTitle>
                                            <CardDescription className="font-medium mt-1">Select your preferred payment method.</CardDescription>
                                        </div>
                                        <Button variant="ghost" size="sm" className="rounded-full bg-muted shadow-sm hover:bg-muted/80" onClick={() => setShowTopup(false)}>✕</Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                        {/* LEFT COMPONENT */}
                                        <div className="space-y-6">
                                            {/* Topup Amount Input */}
                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Amount of Coins to Buy</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500"><Coins className="w-6 h-6" /></span>
                                                    <Input
                                                        type="number"
                                                        placeholder="e.g. 500"
                                                        value={topupCoins}
                                                        onChange={(e) => setTopupCoins(e.target.value)}
                                                        className="text-3xl font-black pl-14 h-16 bg-muted/50 border-border/50 focus:border-primary/50"
                                                        min={1}
                                                    />
                                                </div>
                                            </div>

                                            {/* Gateway Selection */}
                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Payment Gateway (Global)</label>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setTopupMethod('UPI')}
                                                        className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${topupMethod === 'UPI' ? 'border-green-500 bg-green-500/10' : 'border-border bg-muted/30 hover:bg-muted'}`}
                                                    >
                                                        <IndianRupee className={`w-8 h-8 mb-2 ${topupMethod === 'UPI' ? 'text-green-500' : 'text-muted-foreground'}`} />
                                                        <span className={`font-bold text-sm ${topupMethod === 'UPI' ? 'text-green-500' : 'text-muted-foreground'}`}>India (INR)</span>
                                                        <span className="text-[10px] text-muted-foreground mt-1 text-center">UPI / Cards / NetBanking</span>
                                                    </button>

                                                    <button
                                                        onClick={() => setTopupMethod('PAYPAL')}
                                                        className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${topupMethod === 'PAYPAL' ? 'border-blue-500 bg-blue-500/10' : 'border-border bg-muted/30 hover:bg-muted'}`}
                                                    >
                                                        <Globe className={`w-8 h-8 mb-2 ${topupMethod === 'PAYPAL' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                                                        <span className={`font-bold text-sm ${topupMethod === 'PAYPAL' ? 'text-blue-500' : 'text-muted-foreground'}`}>International (USD)</span>
                                                        <span className="text-[10px] text-muted-foreground mt-1 text-center">PayPal / Credit Card</span>
                                                    </button>

                                                    <button
                                                        onClick={() => setTopupMethod('PAYPAL_GBP')}
                                                        className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${topupMethod === 'PAYPAL_GBP' ? 'border-purple-500 bg-purple-500/10' : 'border-border bg-muted/30 hover:bg-muted'}`}
                                                    >
                                                        <span className={`text-4xl font-serif mb-2 leading-none ${topupMethod === 'PAYPAL_GBP' ? 'text-purple-500' : 'text-muted-foreground'}`}>£</span>
                                                        <span className={`font-bold text-sm ${topupMethod === 'PAYPAL_GBP' ? 'text-purple-500' : 'text-muted-foreground'}`}>UK (GBP)</span>
                                                        <span className="text-[10px] text-muted-foreground mt-1 text-center">PayPal / Credit Card</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* RIGHT COMPONENT: SUMMARY & CHECKOUT */}
                                        <div className="bg-muted/30 rounded-3xl p-6 border border-border/50 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-3 mb-4">Order Summary</h3>

                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-muted-foreground font-medium">Coins</span>
                                                    <span className="font-black text-lg">{requestedCoins.toLocaleString()}</span>
                                                </div>

                                                <div className="flex justify-between items-center mb-6">
                                                    <span className="text-muted-foreground font-medium">Exchange Rate</span>
                                                    <span className="font-bold text-sm border border-border px-2 py-1 rounded-lg">
                                                        {topupMethod === 'PAYPAL' ? `$1 = ${exchangeRate} Coins` : topupMethod === 'PAYPAL_GBP' ? `£1 = ${gbpExchangeRate} Coins` : `₹1 = 1 Coin`}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="bg-card border border-border rounded-xl p-4 flex justify-between items-center shadow-inner">
                                                    <span className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Total to Pay</span>
                                                    <span className={`text-2xl font-black ${topupMethod === 'PAYPAL' ? 'text-blue-500' : topupMethod === 'PAYPAL_GBP' ? 'text-purple-500' : 'text-green-500'}`}>
                                                        {topupMethod === 'PAYPAL' ? `$${usdEquivalent}` : topupMethod === 'PAYPAL_GBP' ? `£${gbpEquivalent}` : `₹${inrEquivalent.toLocaleString()}`}
                                                    </span>
                                                </div>

                                                {/* CHECKOUT BUTTONS */}
                                                {!requestedCoins || requestedCoins <= 0 ? (
                                                    <Button disabled className="w-full h-14 rounded-full font-bold opacity-50 bg-muted text-muted-foreground">Enter Amount to Buy</Button>
                                                ) : (topupMethod === 'PAYPAL' || topupMethod === 'PAYPAL_GBP') ? (
                                                    <div className="min-h-[55px]">
                                                        {paypalClientId ? (
                                                            <PayPalScriptProvider options={{ "clientId": paypalClientId, currency: topupMethod === 'PAYPAL_GBP' ? "GBP" : "USD", intent: "capture" }}>
                                                                <PayPalCheckout
                                                                    usdAmount={topupMethod === 'PAYPAL_GBP' ? gbpEquivalent : usdEquivalent}
                                                                    currency={topupMethod === 'PAYPAL_GBP' ? "GBP" : "USD"}
                                                                    expectedCoins={requestedCoins}
                                                                    onSuccess={() => { setShowTopup(false); setTopupCoins(''); loadData(); }}
                                                                    onError={() => { }}
                                                                    onCancel={() => { }}
                                                                />
                                                            </PayPalScriptProvider>
                                                        ) : (
                                                            <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-center text-sm font-medium">PayPal configuration missing on server.</div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Button
                                                        className="w-full h-14 rounded-full font-black text-lg bg-green-500 hover:bg-green-600 text-white shadow-xl shadow-green-500/20 group overflow-hidden relative"
                                                        onClick={handleCashfreePayment}
                                                    >
                                                        <span className="relative z-10">Pay via Cashfree (₹{inrEquivalent})</span>
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                                    </Button>
                                                )}

                                                {(topupMethod === 'PAYPAL' || topupMethod === 'PAYPAL_GBP') && (
                                                    <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                                                        <ShieldCheck className="w-3 h-3" /> Payments are securely processed by PayPal.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
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
                                    Coin Ledger
                                </CardTitle>
                                <CardDescription className="font-medium mt-1">Detailed history of your virtual currency.</CardDescription>
                            </div>
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

