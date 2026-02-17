'use client';

import React, { useState, useEffect } from 'react';
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
    Gift, Star, AlertCircle, Globe, Banknote
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

    useEffect(() => {
        loadData();
        // Initialize Cashfree SDK
        import('@cashfreepayments/cashfree-js').then((module) => {
            const cf = module.load({
                mode: "sandbox" // or "production" based on env, ideally fetched from backend config
            });
            setCashfree(cf);
        });
    }, []);

    const loadData = async () => {
        try {
            const [walletRes, upiRes, userRes] = await Promise.allSettled([
                api.get('/wallet'),
                api.get('/wallet/upi-details'),
                api.get('/users/me'),
            ]);
            if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data);
            if (upiRes.status === 'fulfilled') setUpiDetails(upiRes.value.data);
            if (userRes.status === 'fulfilled') setCurrentUser(userRes.value.data);
        } catch (err) {
            console.error('Failed to load wallet:', err);
        } finally {
            setLoading(false);
        }
    };

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
                                onClick={() => { setShowDeposit(true); setShowWithdraw(false); }}
                            >
                                <ArrowDownLeft className="h-5 w-5 mr-2" />
                                Add Money
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
                        { icon: Shield, label: '100% Secure', color: 'text-green-500' },
                        { icon: Zap, label: 'Instant Deposits', color: 'text-yellow-500' },
                        { icon: Globe, label: 'UPI + Bank Transfer', color: 'text-blue-500' },
                    ].map((b, i) => (
                        <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-sm">
                            <b.icon className={`h-4 w-4 ${b.color}`} />
                            <span className="font-medium">{b.label}</span>
                        </div>
                    ))}
                </div>

                {/* ===== DEPOSIT PANEL ===== */}
                {showDeposit && (
                    <Card className="border-primary/20 shadow-xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <ArrowDownLeft className="h-5 w-5 text-green-500" />
                                        Add Money to Wallet
                                    </CardTitle>
                                    <CardDescription>Choose your preferred payment method</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => { setShowDeposit(false); setDepositStep('amount'); }}>✕</Button>
                            </div>

                            {/* Stepper */}
                            <div className="flex items-center gap-2 mt-4">
                                {['Select Amount', 'Make Payment', 'Verify'].map((step, i) => {
                                    const stepIndex = ['amount', 'pay', 'verify'].indexOf(depositStep);
                                    return (
                                        <React.Fragment key={i}>
                                            <div className={`flex items-center gap-2 ${i <= stepIndex ? 'text-primary' : 'text-muted-foreground'}`}>
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= stepIndex ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                                    {i < stepIndex ? '✓' : i + 1}
                                                </div>
                                                <span className="text-sm font-medium hidden sm:inline">{step}</span>
                                            </div>
                                            {i < 2 && <div className={`flex-1 h-0.5 ${i < stepIndex ? 'bg-primary' : 'bg-muted'}`} />}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            {/* Step 1: Amount */}
                            {depositStep === 'amount' && (
                                <>
                                    {/* Payment Method Selection */}
                                    <div>
                                        <label className="text-sm font-semibold text-muted-foreground mb-3 block">PAYMENT METHOD</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                            {[
                                                { id: 'razorpay' as const, name: 'Online (Cashfree)', icon: CreditCard, desc: 'Cards, UPI, NetBanking', badge: 'Auto-Verify' },
                                                { id: 'upi_qr' as const, name: 'Manual UPI QR', icon: QrCode, desc: 'Scan & Pay manually' },
                                                { id: 'bank' as const, name: 'Bank Transfer', icon: Building2, desc: 'NEFT/IMPS/RTGS' },
                                            ].map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setSelectedMethod(m.id)}
                                                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${selectedMethod === m.id
                                                        ? 'border-primary bg-primary/5 shadow-md'
                                                        : 'border-border hover:border-primary/30'}`}
                                                >
                                                    {m.badge && (
                                                        <span className="absolute top-2 right-2 px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full">
                                                            {m.badge}
                                                        </span>
                                                    )}
                                                    <m.icon className={`h-7 w-7 mb-2 ${selectedMethod === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
                                                    <p className="font-bold text-sm">{m.name}</p>
                                                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Amount Input */}
                                    <div>
                                        <label className="text-sm font-semibold text-muted-foreground mb-3 block">ENTER AMOUNT</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">₹</span>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={depositAmount}
                                                onChange={(e) => setDepositAmount(e.target.value)}
                                                className="text-3xl font-bold pl-10 h-16 border-2 text-center"
                                                min="10"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">Minimum deposit: ₹10</p>
                                    </div>

                                    {/* Quick Amount Buttons */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {QUICK_AMOUNTS.map(amt => (
                                            <button
                                                key={amt}
                                                onClick={() => setDepositAmount(amt.toString())}
                                                className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${depositAmount === amt.toString()
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border hover:border-primary/30'}`}
                                            >
                                                ₹{amt}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Bonus Badge */}
                                    {parseFloat(depositAmount) >= 500 && (
                                        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                            <Gift className="h-6 w-6 text-green-500" />
                                            <div>
                                                <p className="text-sm font-bold text-green-600">Bonus Eligible!</p>
                                                <p className="text-xs text-muted-foreground">Deposits of ₹500+ may qualify for promotional bonuses.</p>
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        size="lg"
                                        className="w-full h-14 text-lg font-bold"
                                        disabled={!depositAmount || parseFloat(depositAmount) < 10 || submitting}
                                        onClick={() => {
                                            if (selectedMethod === 'razorpay') {
                                                handleCashfreeDeposit();
                                            } else {
                                                setDepositStep('pay');
                                            }
                                        }}
                                    >
                                        {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                                        {selectedMethod === 'razorpay' ? 'Secure Checkout' : `Continue — ₹${depositAmount || '0'}`}
                                        {selectedMethod !== 'razorpay' && <ChevronRight className="h-5 w-5 ml-2" />}
                                    </Button>
                                </>
                            )}

                            {/* Step 2: Pay */}
                            {depositStep === 'pay' && (
                                <>
                                    <div className="text-center">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
                                            <IndianRupee className="h-5 w-5 text-primary" />
                                            <span className="text-2xl font-extrabold text-primary">₹{depositAmount}</span>
                                        </div>
                                    </div>

                                    {selectedMethod === 'upi_qr' && (
                                        <div className="space-y-4">
                                            {/* QR Code Placeholder */}
                                            <div className="bg-white p-6 rounded-2xl mx-auto max-w-xs border shadow-sm">
                                                <div className="aspect-square bg-white rounded-xl flex items-center justify-center border-2 border-dashed border-primary/20">
                                                    <div className="text-center">
                                                        {upiDetails ? (
                                                            <QRCodeSVG
                                                                value={generateUpiLink(depositAmount)}
                                                                size={200}
                                                                level="H"
                                                                includeMargin={true}
                                                                className="mx-auto"
                                                            />
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center h-full">
                                                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                                                <p className="text-xs text-muted-foreground">Loading QR...</p>
                                                            </div>
                                                        )}
                                                        <p className="text-sm font-medium text-foreground mt-3">Scan with any UPI app</p>
                                                        <a
                                                            href={generateUpiLink(depositAmount)}
                                                            className="inline-flex items-center gap-1 mt-2 text-xs text-primary font-medium hover:underline"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <ExternalLink className="h-3 w-3" /> Open in UPI App
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center space-y-2">
                                                <p className="text-xs text-muted-foreground">Pay to UPI ID:</p>
                                                <button
                                                    onClick={() => copyToClipboard(upiDetails?.upiId || '')}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg font-mono font-bold text-sm hover:bg-muted/80 transition"
                                                >
                                                    {upiDetails?.upiId || 'Loading...'}
                                                    <Copy className="h-4 w-4 text-primary" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {selectedMethod === 'upi_id' && (
                                        <div className="space-y-4 max-w-md mx-auto">
                                            <div className="p-5 bg-muted/50 rounded-xl border">
                                                <p className="text-sm font-medium mb-3">Send ₹{depositAmount} to this UPI ID:</p>
                                                <button
                                                    onClick={() => copyToClipboard(upiDetails?.upiId || '')}
                                                    className="w-full flex items-center justify-between p-4 bg-background rounded-lg border-2 border-primary/20 hover:border-primary/50 transition"
                                                >
                                                    <span className="font-mono font-bold text-lg">{upiDetails?.upiId}</span>
                                                    <Copy className="h-5 w-5 text-primary" />
                                                </button>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Merchant: {upiDetails?.merchantName}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedMethod === 'bank' && (
                                        <div className="space-y-3 max-w-md mx-auto">
                                            <div className="p-5 bg-muted/50 rounded-xl border space-y-3">
                                                <p className="text-sm font-bold">Bank Transfer Details:</p>
                                                {[
                                                    { label: 'Account Name', value: upiDetails?.merchantName || 'Protocol Tournament' },
                                                    { label: 'UPI ID', value: upiDetails?.upiId || 'Loading...' },
                                                    { label: 'Method', value: 'NEFT / IMPS / RTGS' },
                                                ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                                        <span className="text-xs text-muted-foreground">{item.label}</span>
                                                        <button
                                                            onClick={() => copyToClipboard(item.value)}
                                                            className="flex items-center gap-2 font-mono text-sm font-medium hover:text-primary transition"
                                                        >
                                                            {item.value} <Copy className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm">
                                        <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                                        <p className="text-muted-foreground">
                                            After payment, note the <span className="font-bold text-foreground">UTR/Transaction Reference Number</span> from your payment app.
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={() => setDepositStep('amount')} className="flex-1">
                                            Back
                                        </Button>
                                        <Button className="flex-1" onClick={() => setDepositStep('verify')}>
                                            I&apos;ve Paid — Enter UTR
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* Step 3: Verify */}
                            {depositStep === 'verify' && (
                                <>
                                    <div className="text-center mb-4">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Shield className="h-8 w-8 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-bold">Verify Your Payment</h3>
                                        <p className="text-sm text-muted-foreground">Enter the UTR number from your payment confirmation.</p>
                                    </div>

                                    <div className="max-w-md mx-auto space-y-4">
                                        <div className="p-4 bg-muted/50 rounded-xl flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Amount Paid</span>
                                            <span className="font-bold text-lg">₹{depositAmount}</span>
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold mb-2 block">UTR / Transaction Reference Number</label>
                                            <Input
                                                placeholder="Enter 12-digit UTR number"
                                                value={utrNumber}
                                                onChange={(e) => setUtrNumber(e.target.value)}
                                                className="h-14 text-lg font-mono text-center tracking-widest border-2"
                                            />
                                            <p className="text-xs text-muted-foreground mt-2">
                                                📍 Find this in your UPI app → Transaction History → Details
                                            </p>
                                        </div>

                                        <div className="flex gap-3">
                                            <Button variant="outline" onClick={() => setDepositStep('pay')} className="flex-1">
                                                Back
                                            </Button>
                                            <Button
                                                className="flex-1 h-14 font-bold text-base"
                                                onClick={handleDeposit}
                                                disabled={submitting || !utrNumber.trim()}
                                            >
                                                {submitting ? (
                                                    <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Submitting...</>
                                                ) : (
                                                    <><CheckCircle className="h-5 w-5 mr-2" /> Submit for Verification</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

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
