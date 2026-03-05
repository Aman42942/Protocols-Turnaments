'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Coins, DollarSign, IndianRupee, ShieldAlert, ShieldCheck,
    Activity, Save, Loader2, Banknote, Globe, ArrowRight,
    CheckCircle2, XCircle, Search, Calendar, User, Mail, Repeat, Percent
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function EconomyDashboard() {
    const [loading, setLoading] = useState(true);
    const [savingUsd, setSavingUsd] = useState(false);
    const [savingGbp, setSavingGbp] = useState(false);
    const [savingFees, setSavingFees] = useState(false);
    const [feesSaved, setFeesSaved] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [exchangeRate, setExchangeRate] = useState<string>('85');
    const [gbpExchangeRate, setGbpExchangeRate] = useState<string>('110');
    const [searchQuery, setSearchQuery] = useState('');
    // Withdrawal service fees
    const [feeInr, setFeeInr] = useState('0');
    const [feeUsd, setFeeUsd] = useState('0');
    const [feeGbp, setFeeGbp] = useState('0');

    const fetchEconomyData = async () => {
        try {
            const token = localStorage.getItem('token');
            const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/economy`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }

            const configRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/content/PAYPAL_EXCHANGE_RATE`);
            if (configRes.ok) {
                const configData = await configRes.json();
                if (configData?.value) setExchangeRate(configData.value);
            }

            const gbpRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/content/GBP_TO_COIN_RATE`);
            if (gbpRes.ok) {
                const gbpData = await gbpRes.json();
                if (gbpData?.value) setGbpExchangeRate(gbpData.value);
            }

            // Load withdrawal fees
            const [feeInrRes, feeUsdRes, feeGbpRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/content/WITHDRAWAL_FEE_INR`),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/content/WITHDRAWAL_FEE_USD`),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/content/WITHDRAWAL_FEE_GBP`),
            ]);
            if (feeInrRes.ok) { const d = await feeInrRes.json(); if (d?.value !== undefined) setFeeInr(d.value); }
            if (feeUsdRes.ok) { const d = await feeUsdRes.json(); if (d?.value !== undefined) setFeeUsd(d.value); }
            if (feeGbpRes.ok) { const d = await feeGbpRes.json(); if (d?.value !== undefined) setFeeGbp(d.value); }
        } catch (error) {
            toast.error('Failed to load economy data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEconomyData();
    }, []);

    const saveExchangeRate = async () => {
        if (!exchangeRate || isNaN(Number(exchangeRate)) || Number(exchangeRate) <= 0) {
            toast.error('Invalid USD Exchange Rate');
            return;
        }
        setSavingUsd(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ key: 'PAYPAL_EXCHANGE_RATE', value: exchangeRate })
            });
            if (res.ok) toast.success('USD Rate Updated Successfully');
        } finally {
            setSavingUsd(false);
        }
    };

    const saveGbpExchangeRate = async () => {
        if (!gbpExchangeRate || isNaN(Number(gbpExchangeRate)) || Number(gbpExchangeRate) <= 0) {
            toast.error('Invalid GBP Exchange Rate');
            return;
        }
        setSavingGbp(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ key: 'GBP_TO_COIN_RATE', value: gbpExchangeRate })
            });
            if (res.ok) toast.success('GBP Rate Updated Successfully');
        } finally {
            setSavingGbp(false);
        }
    };

    const saveWithdrawalFees = async () => {
        setSavingFees(true);
        try {
            const token = localStorage.getItem('token');
            await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/content`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ key: 'WITHDRAWAL_FEE_INR', value: feeInr })
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/content`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ key: 'WITHDRAWAL_FEE_USD', value: feeUsd })
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/content`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ key: 'WITHDRAWAL_FEE_GBP', value: feeGbp })
                }),
            ]);
            toast.success('Withdrawal Fees Saved!');
            setFeesSaved(true);
            setTimeout(() => setFeesSaved(false), 2500);
        } catch {
            toast.error('Failed to save fees');
        } finally {
            setSavingFees(false);
        }
    };

    const handleWithdrawalAction = async (id: string, action: 'approve' | 'reject') => {
        setProcessingId(id);
        try {
            const token = localStorage.getItem('token');
            const endpoint = action === 'approve' ? 'approve-transaction' : 'reject-transaction';
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallet/${endpoint}/${id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success(`Withdrawal ${action === 'approve' ? 'approved' : 'rejected'}`);
                fetchEconomyData();
            } else {
                toast.error(`Action failed`);
            }
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium animate-pulse tracking-widest text-xs uppercase">Synching Global Ledger...</p>
            </div>
        );
    }

    const filteredWithdrawals = stats?.recentWithdrawals?.filter((w: any) =>
        w.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const isSecure = stats?.leakSystem?.status === 'SECURE';

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">

            {/* HEADER AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-card border border-border p-8 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Banknote className="w-24 h-24" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        <Coins className="w-10 h-10 text-yellow-500" />
                        Central Bank
                    </h1>
                    <p className="text-muted-foreground mt-3 font-medium leading-relaxed">
                        The ultimate hub for global economy management and manual currency adjustments.
                    </p>
                </div>

                <div className="lg:col-span-2 flex flex-col sm:flex-row gap-6">
                    {/* Rate Box: USD */}
                    <div className="flex-1 bg-card border border-border p-6 rounded-[40px] shadow-xl flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-emerald-500" />
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold tracking-widest uppercase">Manual Rate</Badge>
                        </div>
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">USD to Coin</p>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 flex items-center h-14 bg-background/50 border border-border rounded-2xl px-4">
                                    <span className="text-lg font-black mr-2">$1 =</span>
                                    <input
                                        type="number"
                                        value={exchangeRate}
                                        onChange={e => setExchangeRate(e.target.value)}
                                        className="bg-transparent text-xl font-black w-full outline-none text-emerald-500"
                                    />
                                </div>
                                <Button
                                    onClick={saveExchangeRate}
                                    disabled={savingUsd}
                                    className="h-14 w-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                                >
                                    {savingUsd ? <Loader2 className="animate-spin" /> : <Save />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Rate Box: GBP */}
                    <div className="flex-1 bg-card border border-border p-6 rounded-[40px] shadow-xl flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                                <span className="text-2xl font-black text-purple-500">£</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold tracking-widest uppercase">Manual Rate</Badge>
                        </div>
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">GBP to Coin</p>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 flex items-center h-14 bg-background/50 border border-border rounded-2xl px-4">
                                    <span className="text-lg font-black mr-2">£1 =</span>
                                    <input
                                        type="number"
                                        value={gbpExchangeRate}
                                        onChange={e => setGbpExchangeRate(e.target.value)}
                                        className="bg-transparent text-xl font-black w-full outline-none text-purple-500"
                                    />
                                </div>
                                <Button
                                    onClick={saveGbpExchangeRate}
                                    disabled={savingGbp}
                                    className="h-14 w-14 rounded-2xl bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/20"
                                >
                                    {savingGbp ? <Loader2 className="animate-spin" /> : <Save />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* WITHDRAWAL SERVICE FEES */}
            <div className="bg-card border border-border rounded-[40px] shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-border bg-muted/20 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-orange-500/10 rounded-3xl flex items-center justify-center">
                            <Percent className="w-7 h-7 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black flex items-center gap-3">Withdrawal Service Fees</h2>
                            <p className="text-sm text-muted-foreground font-medium mt-0.5">Set a % fee deducted per currency on each user withdrawal. 0% = FREE.</p>
                        </div>
                    </div>
                    <button
                        onClick={saveWithdrawalFees}
                        disabled={savingFees}
                        className={`flex items-center gap-2 h-12 px-6 rounded-2xl font-black text-sm shadow-lg transition-all ${feesSaved
                            ? 'bg-green-500 text-white shadow-green-500/20'
                            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
                            }`}
                    >
                        {savingFees ? <Loader2 className="w-4 h-4 animate-spin" /> :
                            feesSaved ? <CheckCircle2 className="w-4 h-4" /> :
                                <Save className="w-4 h-4" />}
                        {feesSaved ? 'Saved!' : 'Save Fees'}
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* INR Fee */}
                    {[
                        { key: 'INR', label: 'INR (UPI)', flag: '🇮🇳', value: feeInr, set: setFeeInr, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', ring: 'focus:ring-blue-500/20', symbol: '₹' },
                        { key: 'USD', label: 'USD (PayPal)', flag: '🇺🇸', value: feeUsd, set: setFeeUsd, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', ring: 'focus:ring-emerald-500/20', symbol: '$' },
                        { key: 'GBP', label: 'GBP (PayPal)', flag: '🇬🇧', value: feeGbp, set: setFeeGbp, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', ring: 'focus:ring-purple-500/20', symbol: '£' },
                    ].map(({ key, label, flag, value, set, color, bg, border, symbol }) => (
                        <div key={key} className={`p-6 rounded-3xl border ${border} ${bg} flex flex-col gap-4`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{flag} {label}</p>
                                    <p className={`text-3xl font-black mt-1 ${color}`}>{value}<span className="text-lg ml-1">%</span></p>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg} border ${border}`}>
                                    <span className={`text-xl font-black ${color}`}>{symbol}</span>
                                </div>
                            </div>
                            <div className="flex items-center h-12 bg-background/60 border border-border rounded-2xl px-4 gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    value={value}
                                    onChange={e => set(e.target.value)}
                                    className={`bg-transparent text-xl font-black w-full outline-none ${color}`}
                                />
                                <span className="text-muted-foreground font-bold">%</span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                                {Number(value) === 0
                                    ? '✅ FREE withdrawal for ' + key
                                    : `100 coins → ${(100 - Number(value)).toFixed(1)} coins net`
                                }
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* LIVE ECONOMY SIMULATOR */}
            <LivePreviewSimulator
                exchangeRate={exchangeRate}
                gbpExchangeRate={gbpExchangeRate}
                feeInr={feeInr}
                feeUsd={feeUsd}
                feeGbp={feeGbp}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className={`p-8 rounded-[40px] border relative overflow-hidden flex flex-col md:flex-row items-center gap-6 ${isSecure ? 'bg-green-500/5 border-green-500/20 shadow-green-500/5' : 'bg-red-500/5 border-red-500/20 shadow-red-500/5'}`}
            >
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 ${isSecure ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500 shadow-lg shadow-red-500/20'}`}>
                    {isSecure ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8 animate-pulse" />}
                </div>
                <div className="text-center md:text-left">
                    <h3 className={`text-2xl font-black ${isSecure ? 'text-green-500' : 'text-red-500'}`}>
                        Economy Integrity: {isSecure ? 'STABLE' : 'CRITICAL ALERT'}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground mt-1 max-w-xl">
                        {isSecure
                            ? "Platform coin supply is perfectly balanced. Current circulation matches minted reserves."
                            : `Supply discrepancy detected: ${stats?.leakSystem?.delta} Coins. Audit of all minting events recommended.`}
                    </p>
                </div>
                <div className="md:ml-auto flex items-center gap-4 bg-background/50 p-4 rounded-3xl border border-border/50">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Wallet Liability</p>
                        <p className="text-lg font-black text-orange-500">{stats?.totalCoinsInWallets?.toLocaleString()} Coins</p>
                    </div>
                    <div className="w-px h-10 bg-border mx-2" />
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pending Liability</p>
                        <p className="text-lg font-black text-red-500">{stats?.pendingWithdrawalCoins?.toLocaleString()} Coins</p>
                    </div>
                </div>
            </motion.div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={IndianRupee}
                    label="INR Deposits"
                    value={`₹${stats?.totalINRDeposited?.toLocaleString() || 0}`}
                    color="text-blue-500"
                    bg="bg-blue-500/10"
                    delay={0.1}
                />
                <StatCard
                    icon={DollarSign}
                    label="USD Deposits"
                    value={`$${stats?.totalUSDPaid?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`}
                    color="text-emerald-500"
                    bg="bg-emerald-500/10"
                    delay={0.2}
                />
                <StatCard
                    icon={({ className }: any) => <span className={`font-serif text-2xl font-black ${className}`}>£</span>}
                    label="GBP Deposits"
                    value={`£${stats?.totalGBPPaid?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`}
                    color="text-purple-500"
                    bg="bg-purple-500/10"
                    delay={0.3}
                />
                <StatCard
                    icon={Coins}
                    label="Total Supply"
                    value={`${stats?.totalCoinsMinted?.toLocaleString() || 0} Coins`}
                    color="text-yellow-500"
                    bg="bg-yellow-500/10"
                    delay={0.4}
                />
            </div>

            {/* WITHDRAWAL MANAGEMENT */}
            <div className="bg-card border border-border rounded-[40px] shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-border bg-muted/20 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-3">
                            <Repeat className="w-6 h-6 text-primary" />
                            Withdrawal Management
                        </h2>
                        <p className="text-sm text-muted-foreground font-medium mt-1">Review and process user prize extractions.</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-11 h-12 rounded-2xl bg-background/50"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/10">
                                <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">User</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Payment Target</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <AnimatePresence mode="popLayout">
                                {filteredWithdrawals.map((w: any) => (
                                    <motion.tr
                                        key={w.id}
                                        layout
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="hover:bg-muted/5 transition-colors group"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0">
                                                    {w.userAvatar ? <img src={w.userAvatar} alt="" /> : <User className="w-5 h-5 text-muted-foreground" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black group-hover:text-primary transition-colors">{w.userName || 'Unknown User'}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /> {w.userEmail}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black flex items-center gap-1">
                                                    <Coins className="w-3.5 h-3.5 text-yellow-500" />
                                                    {w.amount}
                                                </span>
                                                <span className="text-[10px] font-black text-emerald-500 uppercase">
                                                    ≈ {w.currency === 'USD' ? '$' : w.currency === 'GBP' ? '£' : '₹'}{w.realValue}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="secondary" className="w-fit text-[9px] font-black uppercase tracking-tighter">
                                                    {w.currency === 'INR' ? 'UPI' : 'PAYPAL'}
                                                </Badge>
                                                <p className="text-xs font-bold font-mono">
                                                    {w.metadata?.upiId || w.metadata?.paypalEmail || 'Missing Details'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Badge className={`rounded-xl font-black text-[10px] tracking-tight ${w.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                w.status === 'FAILED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    'bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse'
                                                }`}>
                                                {w.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {w.status === 'PENDING' ? (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-10 w-10 p-0 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                                                        onClick={() => handleWithdrawalAction(w.id, 'reject')}
                                                        disabled={processingId === w.id}
                                                    >
                                                        {processingId === w.id ? <Loader2 className="animate-spin w-4 h-4" /> : <XCircle className="w-5 h-5" />}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-10 w-10 p-0 rounded-xl bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
                                                        onClick={() => handleWithdrawalAction(w.id, 'approve')}
                                                        disabled={processingId === w.id}
                                                    >
                                                        {processingId === w.id ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle2 className="w-5 h-5" />}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-end gap-1 px-4 py-2 bg-muted/50 rounded-xl border border-border w-fit ml-auto">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(w.createdAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredWithdrawals.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Banknote className="w-12 h-12 text-muted-foreground/20" />
                                            <p className="text-muted-foreground font-medium">No withdrawal requests found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, bg, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-card border border-border p-8 rounded-[40px] shadow-xl flex flex-col gap-5 hover:-translate-y-2 transition-transform duration-300 group"
        >
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${bg}`}>
                <Icon className={`w-8 h-8 ${color}`} />
            </div>
            <div>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{label}</p>
                <p className={`text-2xl font-black mt-2 tracking-tight ${color}`}>{value}</p>
            </div>
        </motion.div>
    );
}

function LivePreviewSimulator({ exchangeRate, gbpExchangeRate, feeInr, feeUsd, feeGbp }: {
    exchangeRate: string;
    gbpExchangeRate: string;
    feeInr: string;
    feeUsd: string;
    feeGbp: string;
}) {
    const [coins, setCoins] = useState('100');

    const usdRate = Number(exchangeRate) || 85;
    const gbpRate = Number(gbpExchangeRate) || 110;
    const amt = Number(coins) || 0;

    const calc = (rate: number, feePercent: number) => {
        const gross = amt / rate;
        const feeCoins = amt * feePercent / 100;
        const feeValue = feeCoins / rate;
        const net = gross - feeValue;
        return { gross, feeCoins, feeValue, net, feePercent };
    };

    const inr = calc(1, Number(feeInr));
    const usd = calc(usdRate, Number(feeUsd));
    const gbp = calc(gbpRate, Number(feeGbp));

    const currencies = [
        {
            key: 'INR', flag: '🇮🇳', method: 'UPI', symbol: '₹',
            rate: 1, data: inr,
            color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20',
            accent: '#3b82f6',
        },
        {
            key: 'USD', flag: '🇺🇸', method: 'PayPal', symbol: '$',
            rate: usdRate, data: usd,
            color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
            accent: '#10b981',
        },
        {
            key: 'GBP', flag: '🇬🇧', method: 'PayPal', symbol: '£',
            rate: gbpRate, data: gbp,
            color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20',
            accent: '#a855f7',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-[40px] shadow-2xl overflow-hidden"
        >
            {/* Header */}
            <div className="p-8 border-b border-border bg-gradient-to-r from-yellow-500/5 to-orange-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-3xl bg-yellow-500/10 flex items-center justify-center">
                        <Activity className="w-7 h-7 text-yellow-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Live Economy Simulator</h2>
                        <p className="text-sm text-muted-foreground font-medium mt-0.5">
                            Instantly preview what users receive across all currencies based on your current rates &amp; fees.
                        </p>
                    </div>
                </div>

                {/* Coin input */}
                <div className="flex items-center gap-3 bg-background/60 border border-yellow-500/30 rounded-2xl px-5 py-3 shadow-lg">
                    <Coins className="w-6 h-6 text-yellow-500 shrink-0" />
                    <input
                        type="number"
                        min="1"
                        value={coins}
                        onChange={e => setCoins(e.target.value)}
                        className="bg-transparent text-2xl font-black w-32 outline-none text-yellow-500"
                        placeholder="100"
                    />
                    <span className="text-muted-foreground font-bold text-sm">Coins</span>
                </div>
            </div>

            {/* Live Cards */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {currencies.map(({ key, flag, method, symbol, rate, data, color, bg, border }) => (
                    <div key={key} className={`rounded-3xl border ${border} ${bg} p-6 flex flex-col gap-4 relative overflow-hidden`}>
                        {/* Currency label */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{flag} {key} · {method}</p>
                                <p className={`text-xs font-bold mt-1 ${color}`}>
                                    Rate: 1 {key} = {rate === 1 ? '1' : rate} Coins
                                </p>
                            </div>
                            <span className={`text-3xl font-black ${color}`}>{symbol}</span>
                        </div>

                        {/* Breakdown rows */}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-muted-foreground font-medium">Coins Withdrawn</span>
                                <span className="font-black">{amt.toLocaleString()} Coins</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-muted-foreground font-medium">Gross Value</span>
                                <span className="font-black">{symbol}{data.gross.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="font-medium text-red-400">
                                    Service Fee ({data.feePercent}%)
                                </span>
                                <span className="font-black text-red-400">
                                    {data.feePercent === 0
                                        ? 'FREE ✅'
                                        : `- ${data.feeCoins.toFixed(2)} Coins (${symbol}${data.feeValue.toFixed(2)})`
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Net payout — big highlight */}
                        <div className={`rounded-2xl ${bg} border ${border} p-4 flex items-center justify-between`}>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">User Receives</p>
                                <p className={`text-3xl font-black ${color}`}>
                                    {symbol}{data.net.toFixed(2)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Net Coins</p>
                                <p className="text-lg font-black">
                                    {(amt - data.feeCoins).toFixed(1)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom note */}
            <div className="px-8 pb-6 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Activity className="w-3.5 h-3.5 text-yellow-500" />
                This preview updates <strong className="text-foreground">instantly</strong> as you change rates or fees above — no save needed to preview.
            </div>
        </motion.div>
    );
}

