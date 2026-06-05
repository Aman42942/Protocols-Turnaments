'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useCms } from '@/context/CmsContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, ArrowUpRight, ArrowDownLeft, Loader2,
    CheckCircle, XCircle, Clock, CreditCard,
    Shield, Target, MessageCircle, History, RotateCcw,
    Star, Banknote, Coins, ArrowRightLeft, DollarSign, IndianRupee, PieChart, Info, Trophy, Globe, ShieldCheck, Phone
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
    const [paypalEnabled, setPaypalEnabled] = useState(false);
    const [walletTopupEnabled, setWalletTopupEnabled] = useState(true);

    // Add Coins state
    const [showAddCoins, setShowAddCoins] = useState(false);
    const [addAmount, setAddAmount] = useState('');
    const [addingCoins, setAddingCoins] = useState(false);
    const [addCurrency, setAddCurrency] = useState('INR');
    const [billingPhone, setBillingPhone] = useState('');


    // Withdraw state
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawCurrency, setWithdrawCurrency] = useState('INR');
    const [withdrawPaypalEmail, setWithdrawPaypalEmail] = useState('');
    const [withdrawUpiId, setWithdrawUpiId] = useState('');
    const [rates, setRates] = useState({ USD: 85, GBP: 110 });
    const [confirmStep, setConfirmStep] = useState(false);
    const { config, loading: cmsLoading, getContent } = useCms();


    const loadData = async () => {
        try {
            const [walletRes, ledgerRes] = await Promise.allSettled([
                api.get('/wallet'),
                api.get('/analytics/user-ledger'),
            ]);

            if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data);
            if (ledgerRes.status === 'fulfilled') setLedger(ledgerRes.value.data);

        } catch (err) {
            console.error('Failed to load wallet data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Keep CMS-dependent states in sync with CmsContext
    useEffect(() => {
        if (config) {
            const newRates = {
                USD: Number(getContent('PAYPAL_EXCHANGE_RATE', '85')),
                GBP: Number(getContent('GBP_TO_COIN_RATE', '110')),
            };
            setRates(newRates);

            setFees({
                INR: Number(getContent('WITHDRAWAL_FEE_INR', '0')),
                USD: Number(getContent('WITHDRAWAL_FEE_USD', '0')),
                GBP: Number(getContent('WITHDRAWAL_FEE_GBP', '0')),
            });

            setPaypalEnabled(getContent('PAYPAL_ENABLED', 'false') === 'true');
            setWalletTopupEnabled(getContent('WALLET_TOPUP_ENABLED', 'true') !== 'false');
        }
    }, [config, getContent]);

    useEffect(() => {
        loadData();
    }, []);


    const handleAddCoinsCashfree = async () => {
        if (!addAmount || Number(addAmount) <= 0) {
            toast.error('Enter valid amount');
            return;
        }
        if (addCurrency === 'INR' && (!billingPhone || billingPhone.length < 10)) {
            toast.error('Please enter a 10-digit phone number for bank verification');
            return;
        }
        setAddingCoins(true);
        try {
            const res = await api.post('/payments/create-order', { 
                amount: Number(addAmount),
                phone: billingPhone
            });
            const mode = res.data.cf_env?.toLowerCase() === 'production' ? 'production' : 'sandbox';
            const cashfree = await load({ mode: mode as "sandbox" | "production" });
            
            await cashfree.checkout({
                paymentSessionId: res.data.payment_session_id,
                returnUrl: `${window.location.origin}/dashboard/wallet?order_id={order_id}`,
            });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Payment initiation failed');
        } finally {
            setAddingCoins(false);
        }
    };

    const handlePayPalCapture = async (orderId: string) => {
        try {
            const expectedCoins = Number(addAmount) * (addCurrency === 'GBP' ? rates.GBP : rates.USD);
            await api.post('/payments/paypal/capture-order', { 
                orderId, 
                expectedCoins,
                currency: addCurrency 
            });
            toast.success('Coins added successfully!');
            setShowAddCoins(false);
            setAddAmount('');
            loadData();
        } catch (error: any) {
            toast.error('Payment verification failed');
        }
    };

    useEffect(() => {
        if (orderIdParam) {
            api.post('/payments/verify', { order_id: orderIdParam }).then(() => {
                toast.success('Payment verified! Coins added.');
                loadData();
                router.replace('/dashboard/wallet');
            }).catch(() => {
                toast.error('Payment verification failed');
            });
        }
    }, [orderIdParam]);

    const handleWithdraw = async () => {
        if (!withdrawAmount || Number(withdrawAmount) <= 0) {
            toast.error('Enter valid amount');
            return;
        }
        if (Number(withdrawAmount) > wallet?.balance) {
            toast.error('Insufficient balance');
            return;
        }

        if (withdrawCurrency === 'INR') {
            if (!withdrawUpiId) {
                toast.error('Enter UPI ID');
                return;
            }
            const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
            if (!upiRegex.test(withdrawUpiId)) {
                toast.error('Invalid UPI format. Use: username@bank');
                return;
            }
        }

        if (withdrawCurrency === 'USD' || withdrawCurrency === 'GBP') {
            if (!withdrawPaypalEmail) {
                toast.error('Enter PayPal Email');
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(withdrawPaypalEmail)) {
                toast.error('Invalid PayPal Email format');
                return;
            }
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
            case 'REFUND': return <RotateCcw className="h-5 w-5 text-green-500" />;
            default: return <Wallet className="h-5 w-5 text-muted-foreground" />;
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    if (loading || cmsLoading) {
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

                {/* ===== WINZO-STYLE WALLET HERO CARD ===== */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#FF9D00] via-[#FF6B00] to-[#E65100] p-8 sm:p-10 text-white shadow-[0_20px_50px_rgba(230,81,0,0.3)] border-4 border-white/10 group transition-all duration-500 hover:shadow-[0_25px_60px_rgba(230,81,0,0.4)]">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl animate-pulse delay-700" />
                    
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                    <Trophy className="h-6 w-6 text-yellow-200" />
                                </div>
                                <span className="text-sm font-black tracking-[0.2em] opacity-90 text-yellow-100 uppercase">Current Winnings</span>
                            </div>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-7xl sm:text-8xl font-black tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
                                    {Math.floor(wallet?.balance || 0).toLocaleString()}
                                </span>
                                <span className="text-3xl font-bold opacity-80">.{(wallet?.balance % 1).toFixed(2).substring(2)}</span>
                                <Coins className="h-10 w-10 text-yellow-300 ml-2 animate-bounce" />
                            </div>
                            <div className="flex items-center gap-2 text-yellow-100/80 font-bold bg-black/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">
                                <ShieldCheck className="h-4 w-4" />
                                <p className="text-sm">Verified & Protected Funds</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch lg:items-end gap-4">
                            {walletTopupEnabled && (
                                <Button
                                    size="lg"
                                    className="bg-white text-[#FF6B00] hover:bg-yellow-50 font-black tracking-tighter text-xl px-10 h-16 rounded-3xl items-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95 group/btn"
                                    onClick={() => {
                                        setAddCurrency('INR');
                                        setAddAmount('');
                                        setShowAddCoins(true);
                                    }}
                                >
                                    <div className="bg-[#FF6B00]/10 p-2 rounded-xl group-hover/btn:bg-[#FF6B00]/20 transition-colors">
                                        <ArrowDownLeft className="h-6 w-6" />
                                    </div>
                                    ADD CASH
                                </Button>
                            )}
                            <Button
                                size="lg"
                                variant="outline"
                                className="bg-black/20 hover:bg-black/30 border-white/30 text-white font-black tracking-tighter text-xl px-10 h-16 rounded-3xl items-center gap-3 backdrop-blur-md transition-all hover:scale-105 active:scale-95 border-2 shadow-xl"
                                onClick={() => {
                                    setWithdrawCurrency('INR');
                                    setWithdrawAmount('');
                                    setShowWithdraw(true);
                                }}
                            >
                                <div className="bg-white/10 p-2 rounded-xl">
                                    <ArrowUpRight className="h-6 w-6" />
                                </div>
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


                {/* ===== ADD COINS MODAL ===== */}
                <AnimatePresence>
                    {showAddCoins && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl relative z-0 mb-8"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl font-black flex items-center gap-2">
                                            <Coins className="h-6 w-6 text-green-500" />
                                            Add Coins to Wallet
                                        </CardTitle>
                                        <CardDescription className="font-medium mt-1">Select your preferred payment method and amount.</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setShowAddCoins(false)}>✕</Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Payment Region</label>
                                            <div className="flex gap-2">
                                                {(['INR', 'USD', 'GBP'] as const)
                                                    .filter(curr => curr === 'INR' || paypalEnabled)
                                                    .map((curr) => (
                                                        <button
                                                            key={curr}
                                                            onClick={() => setAddCurrency(curr)}
                                                            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${addCurrency === curr ? 'border-green-500 bg-green-500/10' : 'border-border bg-muted/30 hover:bg-muted'}`}
                                                        >
                                                            <span className={`font-black text-sm ${addCurrency === curr ? 'text-green-500' : 'text-muted-foreground'}`}>{curr}</span>
                                                            <span className="text-[10px] text-muted-foreground mt-0.5">
                                                                {curr === 'INR' ? 'Domestic' : 'International'}
                                                            </span>
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Amount to Pay ({addCurrency})</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500">
                                                    {addCurrency === 'INR' ? <IndianRupee className="w-5 h-5" /> : addCurrency === 'USD' ? <DollarSign className="w-5 h-5" /> : <span className="font-black text-lg">£</span>}
                                                </span>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={addAmount}
                                                    onChange={(e) => setAddAmount(e.target.value)}
                                                    className="text-2xl font-black pl-12 h-14 bg-muted/50 border-border/50"
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-2 font-black uppercase tracking-widest">
                                                You will receive ≈ {Math.floor(Number(addAmount) * (addCurrency === 'INR' ? 1 : addCurrency === 'USD' ? rates.USD : rates.GBP))} Coins
                                            </p>
                                        </div>

                                        {addCurrency === 'INR' && (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-400">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Billing Phone (Required for Bank)</label>
                                                <div className="relative group/input">
                                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground group-focus-within/input:text-green-500 transition-colors">
                                                        <Phone className="h-4 w-4" />
                                                    </div>
                                                    <Input
                                                        type="tel"
                                                        placeholder="Enter 10-digit number"
                                                        value={billingPhone}
                                                        onChange={(e) => setBillingPhone(e.target.value)}
                                                        className="pl-12 h-12 bg-muted/50 border-border/40 focus:border-green-500/50 rounded-2xl font-bold"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-green-500/5 rounded-3xl p-6 border border-green-500/10 flex flex-col justify-center">
                                        {addCurrency === 'INR' ? (
                                            <Button
                                                className="w-full h-14 rounded-2xl font-black text-lg bg-green-500 hover:bg-green-600 text-white shadow-xl shadow-green-500/20"
                                                onClick={handleAddCoinsCashfree}
                                                disabled={addingCoins || !addAmount || Number(addAmount) <= 0}
                                            >
                                                {addingCoins ? <Loader2 className="h-5 w-5 animate-spin" /> : "Pay via Cashfree (UPI/Cards)"}
                                            </Button>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Pay Securely via PayPal</p>
                                                <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "", currency: addCurrency }}>
                                                    <PayPalButtons
                                                        style={{ layout: 'vertical', shape: 'pill', label: 'pay' }}
                                                        disabled={!addAmount || Number(addAmount) <= 0}
                                                        createOrder={async () => {
                                                            const res = await api.post('/payments/paypal/create-order', { usdAmount: Number(addAmount), currency: addCurrency });
                                                            return res.data.id;
                                                        }}
                                                        onApprove={async (data) => {
                                                            await handlePayPalCapture(data.orderID);
                                                        }}
                                                    />
                                                </PayPalScriptProvider>
                                            </div>
                                        )}
                                        <p className="mt-4 text-[10px] text-center text-muted-foreground font-medium flex items-center justify-center gap-1">
                                            <ShieldCheck className="w-3 h-3 text-green-500" />
                                            SSL Encrypted Secure Transaction
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ===== WITHDRAWAL MODAL (WinZO Style) ===== */}
                <AnimatePresence>
                    {showWithdraw && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        >
                            <motion.div 
                                className="bg-card border-border border-4 rounded-[2.5rem] overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.5)] max-w-2xl w-full relative"
                                layoutId="withdraw-modal"
                            >
                                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600" />
                                
                                <CardHeader className="pt-10 pb-6 px-8 sm:px-10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-4xl font-black tracking-tighter flex items-center gap-3">
                                                <div className="bg-orange-500/10 p-3 rounded-2xl">
                                                    <Banknote className="h-8 w-8 text-orange-500" />
                                                </div>
                                                Redeem Winnings
                                            </CardTitle>
                                            <CardDescription className="text-lg font-bold text-muted-foreground mt-2">WinZO-Style Fast & Secure Redemption</CardDescription>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="rounded-full h-12 w-12 hover:bg-muted font-bold text-xl" 
                                            onClick={() => {
                                                setShowWithdraw(false);
                                                setConfirmStep(false);
                                            }}
                                        >✕</Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-8 sm:p-10 pt-0">
                                    {!confirmStep ? (
                                        <motion.div 
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            className="space-y-8"
                                        >
                                            {/* Step 1: Input Details */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 block">1. Preferred Method</label>
                                                        <div className="flex gap-3">
                                                            {(['INR', 'USD', 'GBP'] as const)
                                                                .filter(curr => curr === 'INR' || paypalEnabled)
                                                                .map((curr) => (
                                                                    <button
                                                                        key={curr}
                                                                        onClick={() => setWithdrawCurrency(curr)}
                                                                        className={`flex-1 flex flex-col items-center justify-center p-4 rounded-[1.5rem] border-4 transition-all duration-300 ${withdrawCurrency === curr ? 'border-orange-500 bg-orange-500/10 shadow-[0_10px_20px_rgba(249,115,22,0.2)] scale-105' : 'border-border bg-muted/30 hover:bg-muted hover:scale-102'}`}
                                                                    >
                                                                        <span className={`font-black text-lg ${withdrawCurrency === curr ? 'text-orange-600' : 'text-muted-foreground'}`}>{curr}</span>
                                                                        <span className="text-xs font-bold opacity-60 uppercase">{curr === 'INR' ? 'UPI' : 'PayPal'}</span>
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 block">2. Amount (Coins)</label>
                                                        <div className="relative group">
                                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500 group-focus-within:scale-125 transition-transform">
                                                                <Coins className="w-8 h-8" />
                                                            </div>
                                                            <Input
                                                                type="number"
                                                                placeholder="0"
                                                                value={withdrawAmount}
                                                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                                                className="text-4xl font-black pl-16 h-20 bg-muted/30 border-4 border-transparent focus:border-orange-500/50 rounded-2xl transition-all"
                                                            />
                                                        </div>
                                                        <div className="flex justify-between mt-3 font-black text-[10px] uppercase tracking-tighter">
                                                            <span className="text-muted-foreground">Available: {wallet?.balance?.toLocaleString()}</span>
                                                            <button 
                                                                className="text-orange-500 hover:text-orange-600"
                                                                onClick={() => setWithdrawAmount(Math.floor(wallet?.balance || 0).toString())}
                                                            >
                                                                Withdraw All
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="h-full flex flex-col justify-between">
                                                        <div>
                                                            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 block">3. Destination Info</label>
                                                            {withdrawCurrency === 'INR' ? (
                                                                <div className="relative group">
                                                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 font-black text-2xl group-focus-within:scale-125 transition-transform">₹</div>
                                                                    <Input
                                                                        placeholder="username@bank"
                                                                        value={withdrawUpiId}
                                                                        onChange={(e) => setWithdrawUpiId(e.target.value)}
                                                                        className="pl-14 h-20 bg-muted/30 border-4 border-transparent focus:border-blue-500/50 text-xl font-bold rounded-2xl transition-all"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="relative group">
                                                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-600 group-focus-within:scale-125 transition-transform"><Globe className="w-8 h-8" /></div>
                                                                    <Input
                                                                        type="email"
                                                                        placeholder="paypal@email.com"
                                                                        value={withdrawPaypalEmail}
                                                                        onChange={(e) => setWithdrawPaypalEmail(e.target.value)}
                                                                        className="pl-16 h-20 bg-muted/30 border-4 border-transparent focus:border-blue-600/50 text-xl font-bold rounded-2xl transition-all"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/10 mt-6 sm:mt-0">
                                                            <div className="flex items-start gap-3">
                                                                <ShieldCheck className="w-6 h-6 text-blue-500 shrink-0" />
                                                                <p className="text-xs font-bold text-blue-800 leading-tight">Your funds are protected by end-to-end encryption. Withdrawals usually process in seconds.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                className="w-full h-20 rounded-[1.5rem] font-black text-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-2xl shadow-orange-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] gap-3"
                                                onClick={() => {
                                                    if (!withdrawAmount || Number(withdrawAmount) <= 0) return toast.error('Enter valid amount');
                                                    if (withdrawCurrency === 'INR' && !withdrawUpiId) return toast.error('Enter UPI ID');
                                                    if (withdrawCurrency !== 'INR' && !withdrawPaypalEmail) return toast.error('Enter PayPal Email');
                                                    setConfirmStep(true);
                                                }}
                                            >
                                                REVIEW REDEMPTION
                                                <ArrowRightLeft className="w-6 h-6" />
                                            </Button>
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            initial={{ x: 20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            className="space-y-8"
                                        >
                                            {/* Step 2: Final Confirmation */}
                                            <div className="bg-orange-500/10 rounded-[2rem] p-8 border-4 border-orange-500/20 text-center relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                                    <Banknote className="w-32 h-32 -rotate-12" />
                                                </div>
                                                
                                                <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-4">You are redeeming</p>
                                                <div className="flex items-center justify-center gap-2 mb-6">
                                                    <span className="text-6xl font-black tracking-tighter text-orange-600">{Number(withdrawAmount).toLocaleString()}</span>
                                                    <Coins className="w-10 h-10 text-orange-500" />
                                                </div>

                                                <div className="space-y-3 bg-white/50 backdrop-blur-md rounded-2xl p-6 border border-white">
                                                    <div className="flex justify-between items-center text-sm font-bold">
                                                        <span className="text-muted-foreground">Destination ({withdrawCurrency === 'INR' ? 'UPI' : 'PayPal'})</span>
                                                        <span className="text-foreground">{withdrawCurrency === 'INR' ? withdrawUpiId : withdrawPaypalEmail}</span>
                                                    </div>
                                                    <div className="w-full h-[1px] bg-border/50" />
                                                    <div className="flex justify-between items-center text-sm font-bold">
                                                        <span className="text-muted-foreground">Admin Review Fee ({fees[withdrawCurrency as keyof typeof fees]}%)</span>
                                                        <span className="text-orange-600">
                                                            -{fees[withdrawCurrency as keyof typeof fees] === 0 
                                                                ? '0' 
                                                                : (Number(withdrawAmount) * (fees[withdrawCurrency as keyof typeof fees] / 100)).toFixed(2)
                                                            } Coins
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-[2px] bg-orange-500/20" />
                                                    <div className="flex justify-between items-center text-xl font-black">
                                                        <span>Final Value</span>
                                                        <span className="text-green-600">
                                                            {withdrawCurrency === 'USD' ? '$' : withdrawCurrency === 'GBP' ? '£' : '₹'}
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

                                            <div className="flex gap-4">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 h-16 rounded-2xl font-black border-4 hover:bg-muted text-muted-foreground"
                                                    onClick={() => setConfirmStep(false)}
                                                >
                                                    GO BACK
                                                </Button>
                                                <Button
                                                    className="flex-[2] h-16 rounded-2xl font-black text-xl bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-600/30 animate-pulse-slow"
                                                    onClick={handleWithdraw}
                                                    disabled={withdrawing}
                                                >
                                                    {withdrawing ? <Loader2 className="h-6 w-6 animate-spin" /> : "CONFIRM REDEEM"}
                                                </Button>
                                            </div>
                                            <p className="text-center text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-center gap-2">
                                                <Info className="w-3 h-3" />
                                                T&C Apply. Processing takes 24-48 Hours.
                                            </p>
                                        </motion.div>
                                    )}
                                </CardContent>
                            </motion.div>
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
                                {ledger.history.slice(0, 5).map((tx: any) => (
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
                                            <div className={`font-black tracking-tight text-lg sm:text-xl flex flex-col items-end justify-center ${tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' || tx.type === 'REFUND' ? 'text-green-500' : 'text-foreground'}`}>
                                                <div className="flex items-center gap-1">
                                                    {tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' || tx.type === 'REFUND' ? '+' : '-'}
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
                    {ledger?.history?.length > 5 && (
                        <div className="p-4 bg-muted/5 border-t border-border flex justify-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="font-black text-xs uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all gap-2"
                                onClick={() => router.push('/dashboard/wallet/history')}
                            >
                                View Full History
                                <ArrowRightLeft className="w-3 h-3" />
                            </Button>
                        </div>
                    )}
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
