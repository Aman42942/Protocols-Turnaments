'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { QRCodeSVG } from 'qrcode.react';
import {
    Wallet, IndianRupee, ArrowUpRight, ArrowDownLeft, QrCode, Loader2,
    CheckCircle, XCircle, Clock, CreditCard, Building2, Smartphone,
    Shield, Zap, Copy, ExternalLink, TrendingUp, History, ChevronRight,
    Gift, Star, AlertCircle, Globe, Banknote, Trophy, Target, MessageCircle
} from 'lucide-react';

interface WalletData {
    id: string;
    balance: number;
    currency: string;
    transactions: Transaction[];
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
}

interface UpiDetails {
    upiId: string;
    merchantName: string;
}

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000, 2000];

export default function WalletPage() {
    const router = useRouter();
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);
    const [upiDetails, setUpiDetails] = useState<UpiDetails | null>(null);

    // Deposit state
    const [showDeposit, setShowDeposit] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<'razorpay' | 'upi_qr' | 'upi_id' | 'bank'>('razorpay');
    const [utrNumber, setUtrNumber] = useState('');
    const [depositStep, setDepositStep] = useState<'amount' | 'pay' | 'verify'>('amount');
    const [submitting, setSubmitting] = useState(false);
    const [depositSuccess, setDepositSuccess] = useState(false);

    // Withdraw state
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawUpiId, setWithdrawUpiId] = useState('');

    // Transaction filter
    const [txFilter, setTxFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'entry_fee' | 'winnings'>('all');
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [cashfree, setCashfree] = useState<any>(null);

    const loadData = async () => {
        try {
            const [walletRes, upiRes, userRes] = await Promise.allSettled([
                api.get('/wallet'),
                api.get('/wallet/upi-details'),
                api.get('/users/me'),
            ]);
            if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data as any);
            if (upiRes.status === 'fulfilled') setUpiDetails(upiRes.value.data as any);
            if (userRes.status === 'fulfilled') setCurrentUser(userRes.value.data as any);
        } catch (err) {
            console.error('Failed to load wallet:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // Initialize Cashfree SDK from window (loaded via layout Script)
        const initCashfree = () => {
            if (typeof window !== 'undefined' && (window as any).Cashfree) {
                const cf = (window as any).Cashfree({
                    mode: "production" // Match your backend .env CASHFREE_ENV="PRODUCTION"
                });
                setCashfree(cf);
            } else {
                // Retry in 1 second if not loaded yet
                setTimeout(initCashfree, 1000);
            }
        };
        initCashfree();
    }, []);

    const handleCashfreeDeposit = async () => {
        const amount = parseFloat(depositAmount);
        if (!amount || amount < 10) return alert('Minimum deposit is ₹10');
        if (!cashfree) return alert('Cashfree SDK failed to load. Please refresh.');

        setSubmitting(true);
        try {
            // 1. Create Order in Backend
            const { data } = await api.post('/payments/create-order', { amount });

            // 2. Open Cashfree Checkout
            const checkoutOptions = {
                paymentSessionId: data.payment_session_id,
                redirectTarget: "_modal", // Open in modal
            };

            cashfree.checkout(checkoutOptions).then((result: any) => {
                if (result.error) {
                    console.log("User has closed the popup or there is some payment error");
                    console.log(result.error);
                    alert('Payment cancelled or failed.');
                    setSubmitting(false);
                }
                if (result.redirect) {
                    console.log("Payment will be redirected");
                    setSubmitting(false);
                }
                if (result.paymentDetails) {
                    console.log("Payment has been completed");
                    verifyCashfreePayment(data.order_id);
                }
            });

        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to initiate payment');
            setSubmitting(false);
        }
    };

    const verifyCashfreePayment = async (orderId: string) => {
        try {
            const verifyRes = await api.post('/payments/verify', {
                order_id: orderId
            });

            if (verifyRes.data.success) {
                setDepositSuccess(true);
                setTimeout(() => {
                    setShowDeposit(false);
                    setDepositSuccess(false);
                    setDepositAmount('');
                    loadData();
                    setSubmitting(false);
                }, 3000);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Verification failed. Please contact support.');
            setSubmitting(false);
        }
    };

    const handleDeposit = async () => {
        if (!utrNumber.trim()) return alert('Please enter UTR/Transaction Reference Number');
        setSubmitting(true);
        try {
            await api.post('/wallet/qr-deposit', {
                amount: parseFloat(depositAmount),
                utrNumber: utrNumber.trim(),
            });
            setDepositSuccess(true);
            setTimeout(() => {
                setShowDeposit(false);
                setDepositStep('amount');
                setDepositAmount('');
                setUtrNumber('');
                setDepositSuccess(false);
                loadData();
            }, 3000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Deposit failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdraw = async () => {
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return alert('Enter valid amount');
        if (!withdrawUpiId.trim()) return alert('Please enter your UPI ID to receive funds');
        setWithdrawing(true);
        try {
            await api.post('/wallet/withdraw', {
                amount: parseFloat(withdrawAmount),
                method: 'UPI',
            });
            alert('Withdrawal request submitted! You will receive funds within 24 hours.');
            setShowWithdraw(false);
            setWithdrawAmount('');
            setWithdrawUpiId('');
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Withdrawal failed');
        } finally {
            setWithdrawing(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const generateUpiLink = (amount: string) => {
        if (!upiDetails) return '';
        return `upi://pay?pa=${upiDetails.upiId}&pn=${encodeURIComponent(upiDetails.merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Protocol Tournament Deposit')}`;
    };

    const filteredTx = (wallet?.transactions || []).filter(tx => {
        if (txFilter === 'all') return true;
        return tx.type.toLowerCase() === txFilter;
    });

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

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading your wallet...</p>
                </div>
            </div>
        );
    }

    // ===== DEPOSIT SUCCESS =====
    if (depositSuccess) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Deposit Request Submitted!</h2>
                    <p className="text-muted-foreground mb-4">
                        Your deposit of <span className="font-bold text-primary">₹{depositAmount}</span> is being verified.
                        Amount will be credited within 5-10 minutes.
                    </p>
                    <div className="p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 inline mr-2" />
                        UTR: <span className="font-mono font-bold text-foreground">{utrNumber}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="container max-w-5xl py-8 space-y-8">

                {/* ===== WALLET HERO CARD ===== */}
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/90 via-primary to-blue-600 p-6 sm:p-8 text-white shadow-2xl shadow-primary/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <Wallet className="h-5 w-5 opacity-80" />
                            <span className="text-sm font-medium opacity-80">Available Balance</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-5xl font-extrabold tracking-tight">
                                ₹{(wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-lg opacity-60">{wallet?.currency || 'INR'}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                size="lg"
                                className="bg-white text-primary hover:bg-white/90 font-bold shadow-lg flex-1 sm:flex-none"
                                onClick={() => router.push('/tournaments')}
                            >
                                <Trophy className="h-5 w-5 mr-2" />
                                Join Tournaments
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="bg-transparent border-white/30 text-white hover:bg-white/10 font-bold flex-1 sm:flex-none"
                                onClick={() => { setShowWithdraw(true); setShowDeposit(false); }}
                            >
                                <ArrowUpRight className="h-5 w-5 mr-2" />
                                Withdraw
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ===== SECURITY BADGES ===== */}
                <div className="flex flex-wrap gap-3 justify-center">
                    {[
                        { icon: Shield, label: 'Secure Payments', color: 'text-green-500' },
                        { icon: Target, label: 'Direct Entry', color: 'text-yellow-500' },
                        { icon: MessageCircle, label: 'Instant Help', color: 'text-blue-500' },
                    ].map((b, i) => (
                        <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-sm">
                            <b.icon className={`h-4 w-4 ${b.color}`} />
                            <span className="font-medium">{b.label}</span>
                        </div>
                    ))}
                    <p className="w-full text-center text-xs text-muted-foreground mt-2 italic">
                        Note: Funds are now added directly when you join a tournament. No need to deposit in advance!
                    </p>
                </div>

                {/* Deposit functionality removed in favor of direct tournament registration payments */}


                {/* ===== WITHDRAW PANEL ===== */}
                {showWithdraw && (
                    <Card className="border-orange-500/20 shadow-xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-orange-500/5 to-transparent border-b">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <ArrowUpRight className="h-5 w-5 text-orange-500" />
                                        Withdraw Funds
                                    </CardTitle>
                                    <CardDescription>
                                        Available: <span className="font-bold text-foreground">₹{(wallet?.balance || 0).toLocaleString('en-IN')}</span>
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setShowWithdraw(false)}>✕</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 max-w-md mx-auto space-y-5">
                            <div>
                                <label className="text-sm font-semibold mb-2 block">Your UPI ID (to receive money)</label>
                                <Input
                                    placeholder="yourname@paytm"
                                    value={withdrawUpiId}
                                    onChange={(e) => setWithdrawUpiId(e.target.value)}
                                    className="h-12"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-2 block">Amount to Withdraw</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">₹</span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        className="text-2xl font-bold pl-10 h-14 text-center"
                                        max={wallet?.balance}
                                        min={100}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">Minimum withdrawal: ₹100 · Processing: 24 hours</p>
                            </div>
                            <Button
                                size="lg"
                                className="w-full h-14 font-bold text-base bg-orange-600 hover:bg-orange-700 text-white"
                                onClick={handleWithdraw}
                                disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) < 100}
                            >
                                {withdrawing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Banknote className="h-5 w-5 mr-2" />}
                                Withdraw ₹{withdrawAmount || '0'}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* ===== TRANSACTION HISTORY ===== */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Transaction History
                            </CardTitle>
                            <div className="flex flex-wrap gap-2">
                                {(['all', 'deposit', 'withdrawal', 'entry_fee', 'winnings'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setTxFilter(f)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${txFilter === f
                                            ? 'bg-primary text-white'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                    >
                                        {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredTx.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p className="font-medium">No transactions yet</p>
                                <p className="text-sm">Your transaction history will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredTx.map(tx => (
                                    <div key={tx.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border sm:border-0 hover:bg-muted/30 transition group">
                                        <div className="p-2 sm:p-2.5 rounded-full bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            {getTxIcon(tx.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm sm:text-base truncate">{tx.description || tx.type.replace('_', ' ')}</p>
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    {getStatusIcon(tx.status)}
                                                    <span className="font-medium">{tx.status}</span>
                                                </div>
                                                <span className="hidden sm:inline">·</span>
                                                <span>{formatDate(tx.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right whitespace-nowrap">
                                            <p className={`font-bold text-sm sm:text-lg ${tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' ? 'text-green-500' : 'text-foreground'}`}>
                                                {tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                                            </p>
                                            {tx.reference && (
                                                <p className="text-[9px] sm:text-[10px] font-mono text-muted-foreground opacity-60">ID: {tx.reference.slice(-8).toUpperCase()}</p>
                                            )}
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
