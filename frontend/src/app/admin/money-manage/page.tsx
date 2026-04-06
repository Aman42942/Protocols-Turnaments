'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Banknote, TrendingUp, ShieldCheck, ShieldAlert, 
    Coins, IndianRupee, PieChart, History, 
    ArrowUpRight, AlertCircle, Loader2, ArrowRight,
    RefreshCcw, Download, Filter, Search, Calendar,
    Lock, Landmark, Wallet, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

interface WithdrawModalProps {
    type: 'PROFIT' | 'TAX';
    balance: number;
    onClose: () => void;
    onSuccess: () => void;
}

function WithdrawModal({ type, balance, onClose, onSuccess }: WithdrawModalProps) {
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<'UPI' | 'PAYPAL'>('UPI');
    const [upiId, setUpiId] = useState('');
    const [paypalEmail, setPaypalEmail] = useState('');
    const [twoFactorToken, setTwoFactorToken] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) return toast.error('Enter a valid amount');
        if (!twoFactorToken) return toast.error('2FA Code is required');

        setLoading(true);
        try {
            const endpoint = type === 'PROFIT' ? '/admin/financial/withdraw' : '/admin/financial/settle-tax';
            await api.post(endpoint, {
                amount: Number(amount),
                currency: 'INR', // Default for this implementation
                method,
                payoutDetails: method === 'UPI' ? { upiId } : { paypalEmail },
                twoFactorToken
            });
            toast.success(`${type === 'PROFIT' ? 'Profit withdrawn' : 'Tax settled'} successfully!`);
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-card border border-border rounded-[32px] shadow-2xl overflow-hidden shadow-primary/10"
            >
                <div className="p-8 border-b border-border bg-muted/20 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black">{type === 'PROFIT' ? 'Withdraw Profit' : 'Settle Tax (TDS)'}</h3>
                        <p className="text-xs font-bold text-muted-foreground mt-1">Available: ₹{balance.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Lock className="w-6 h-6" />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Amount (INR)</label>
                            <Input 
                                type="number" 
                                placeholder="0.00" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="h-14 rounded-2xl font-black text-xl border-2 focus:border-primary transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button"
                                onClick={() => setMethod('UPI')}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'UPI' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                            >
                                <Landmark className={`w-6 h-6 ${method === 'UPI' ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="text-[10px] font-black tracking-widest">UPI ID</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setMethod('PAYPAL')}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'PAYPAL' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                            >
                                <Coins className={`w-6 h-6 ${method === 'PAYPAL' ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="text-[10px] font-black tracking-widest">PAYPAL</span>
                            </button>
                        </div>

                        {method === 'UPI' ? (
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">VPA / UPI ID</label>
                                <Input 
                                    placeholder="yourname@upi" 
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    className="h-12 rounded-xl font-bold border-2"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">PayPal Email</label>
                                <Input 
                                    type="email"
                                    placeholder="name@example.com" 
                                    value={paypalEmail}
                                    onChange={(e) => setPaypalEmail(e.target.value)}
                                    className="h-12 rounded-xl font-bold border-2"
                                />
                            </div>
                        )}

                        <div className="pt-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-red-500 ml-1 flex items-center gap-2">
                                <Lock className="w-3 h-3" />
                                2FA AUTHENTICATION CODE
                            </label>
                            <Input 
                                placeholder="000000" 
                                maxLength={6}
                                value={twoFactorToken}
                                onChange={(e) => setTwoFactorToken(e.target.value)}
                                className="h-14 rounded-2xl font-black text-center text-3xl tracking-[0.5em] border-2 border-red-500/20 focus:border-red-500 transition-all bg-red-500/5 placeholder:tracking-normal placeholder:text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-[2] h-14 rounded-2xl font-black bg-primary text-primary-foreground shadow-xl shadow-primary/20">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <span className="flex items-center gap-2">
                                    <Send className="w-4 h-4" />
                                    Confirm {type === 'PROFIT' ? 'Withdrawal' : 'Settlement'}
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default function MoneyManagePage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    const [modal, setModal] = useState<{ open: boolean; type: 'PROFIT' | 'TAX' }>({ open: false, type: 'PROFIT' });

    const fetchData = async (pageNum = 1) => {
        try {
            // Check system connectivity first
            try {
                await api.get('/admin-financial/ping');
            } catch (e: any) {
                if (e.response?.status === 404) {
                    throw new Error('Endpoint not found (404). Backend may not be updated.');
                }
                throw e;
            }

            const [summaryRes, logsRes] = await Promise.all([
                api.get('/admin-financial/summary'),
                api.get(`/admin-financial/logs?page=${pageNum}&limit=10`)
            ]);
            setSummary(summaryRes.data);
            setLogs(logsRes.data.logs);
            setTotalLogs(logsRes.data.total);
            setPage(pageNum);
            setError(null);
        } catch (err: any) {
            console.error('Financial data load error:', err);
            const status = err.response?.status;
            let msg = err.response?.data?.message || err.message || 'Failed to connect to the financial audit system';
            
            if (status === 403) {
                msg = `${msg}. If 2FA is required, please enable it in your Profile settings.`;
            }
            
            setError(msg);
            toast.error(status === 403 ? 'Access Denied: 2FA required' : 'Failed to load financial data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData(page);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
                <p className="text-muted-foreground font-bold animate-pulse tracking-widest text-xs uppercase">Auditing System Treasury...</p>
            </div>
        );
    }

    if (error || !summary) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
                <h2 className="text-2xl font-black mb-2">Audit Failed</h2>
                <p className="text-muted-foreground font-medium max-w-md">{error || 'Unable to retrieve financial summary. Please check your connection or permissions.'}</p>
                <Button onClick={() => { setLoading(true); fetchData(); }} className="mt-8 rounded-2xl h-12 px-8 font-black">
                    Retry Audit
                </Button>
            </div>
        );
    }

    const { earnings, liabilities, safetyStatus } = summary;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 sm:px-6">
            
            <AnimatePresence>
                {modal.open && (
                    <WithdrawModal 
                        type={modal.type}
                        balance={modal.type === 'PROFIT' ? summary.buckets.profit : summary.buckets.tax}
                        onClose={() => setModal({ ...modal, open: false })}
                        onSuccess={() => {
                            setModal({ ...modal, open: false });
                            handleRefresh();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* ═══ TOP HEADER ══════════════════════════════════════════ */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
                        <Banknote className="w-10 h-10 text-primary" />
                        Money Management
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        Ultimate Financial Analysis & Dual-Bucket Payout System
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 bg-card border border-border p-2 rounded-[24px] shadow-lg">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="rounded-xl font-bold h-11"
                    >
                        <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing && 'animate-spin'}`} />
                        Refresh
                    </Button>
                    <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
                    
                    <Button 
                        onClick={() => setModal({ open: true, type: 'PROFIT' })}
                        className="rounded-xl font-black h-11 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                    >
                        <Wallet className="w-4 h-4 mr-2" />
                        Withdraw Profit
                    </Button>

                    <Button 
                        onClick={() => setModal({ open: true, type: 'TAX' })}
                        className="rounded-xl font-black h-11 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                    >
                        <Landmark className="w-4 h-4 mr-2" />
                        Tax Settlement
                    </Button>

                    <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
                    <Button variant="outline" className="rounded-xl font-bold h-11 border-2">
                        <Download className="w-4 h-4 mr-2" />
                        Audit
                    </Button>
                </div>
            </div>

            {/* ═══ SAFETY MONITOR ══════════════════════════════════════ */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-1 border rounded-[40px] shadow-2xl overflow-hidden ${safetyStatus === 'STABLE' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}
            >
                <div className="bg-card/50 backdrop-blur-xl rounded-[38px] p-8 flex flex-col lg:flex-row items-center gap-8 border border-white/5">
                    <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center shrink-0 shadow-inner ${safetyStatus === 'STABLE' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500 animate-pulse'}`}>
                        {safetyStatus === 'STABLE' ? <ShieldCheck className="w-12 h-12" /> : <ShieldAlert className="w-12 h-12" />}
                    </div>
                    
                    <div className="flex-1 text-center lg:text-left">
                        <Badge className={`mb-3 px-3 py-1 font-black ${safetyStatus === 'STABLE' ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-red-500/20 text-red-500 border-red-500/30'}`}>
                            SYSTEM STATUS: {safetyStatus}
                        </Badge>
                        <h2 className="text-3xl font-black mb-2">Escrow Liquidity Audit</h2>
                        <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed">
                            {safetyStatus === 'STABLE' 
                                ? "All user funds, wallet balances, and active tournament prize pools are 100% covered by platform reserves. Treasury is stable."
                                : "A liquidity gap has been detected! Ensure that platform bank reserves match the total liability amount below."
                            }
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
                        <div className="p-4 bg-background/40 border border-border rounded-3xl text-center">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Liability</p>
                            <p className="text-xl font-black text-primary">₹{liabilities.totalRequired.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-background/40 border border-border rounded-3xl text-center">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                            <p className={`text-xl font-black ${safetyStatus === 'STABLE' ? 'text-green-500' : 'text-red-500'}`}>PROTECTED</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ═══ MAIN EARNINGS KPIs ═══════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <EarningCard 
                    icon={Wallet}
                    label="Withdrawable Profit"
                    amount={summary.buckets.profit}
                    subLabel="Fees & Other Earnings"
                    color="emerald"
                    delay={0.1}
                />
                <EarningCard 
                    icon={Landmark}
                    label="Tax Bucket (TDS)"
                    amount={summary.buckets.tax}
                    subLabel="Reserved for Filing"
                    color="orange"
                    delay={0.2}
                />
                <EarningCard 
                    icon={PieChart}
                    label="Gross Platform Fees"
                    amount={earnings.PLATFORM_FEE}
                    subLabel="Lifetime Collected"
                    color="blue"
                    delay={0.3}
                />
                <EarningCard 
                    icon={TrendingUp}
                    label="Net Lifetime Yield"
                    amount={earnings.total}
                    subLabel="After all deductions"
                    color="purple"
                    delay={0.4}
                />
            </div>

            {/* ═══ LIABILITY BREAKDOWN ══════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card border border-border rounded-[40px] p-8 shadow-xl relative overflow-hidden h-full">
                        <h3 className="text-2xl font-black mb-8">Liability Matrix</h3>
                        <div className="space-y-6">
                            <LiabilityItem 
                                label="User Wallets" 
                                amount={liabilities.wallets} 
                                description="Total cash sitting in user wallets"
                                icon={TrendingUp}
                                color="blue"
                            />
                            <LiabilityItem 
                                label="Active Escrow" 
                                amount={liabilities.escrow} 
                                description="Prizes locked in ongoing tournaments"
                                icon={ShieldCheck}
                                color="orange"
                            />
                            <div className="pt-6 border-t border-border mt-8">
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Total Treasury Required</p>
                                <div className="flex items-end justify-between">
                                    <p className="text-4xl font-black text-foreground">₹{liabilities.totalRequired.toLocaleString()}</p>
                                    <ArrowUpRight className="w-8 h-8 text-primary opacity-20" />
                                </div>
                                <div className="mt-4 p-4 bg-muted/30 rounded-2xl flex items-center gap-3 border border-border/50">
                                    <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                                    <p className="text-[10px] font-bold text-muted-foreground leading-tight uppercase">
                                        Admin must ensure bank balance is always greater than this amount.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-card border border-border rounded-[40px] shadow-2xl overflow-hidden h-full">
                        <div className="p-8 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div>
                                <h3 className="text-2xl font-black flex items-center gap-3">
                                    <History className="w-6 h-6 text-primary" />
                                    Revenue Streams
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium mt-1">Real-time audit log of every system earning.</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-muted/10">
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Type</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Amount</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Source</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-muted/5 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <Badge className={`w-fit font-black text-[9px] ${
                                                        log.type === 'PLATFORM_FEE' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                        log.type === 'TDS' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                                        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    }`}>
                                                        {log.type.replace('_', ' ')}
                                                    </Badge>
                                                    <p className="text-xs font-bold text-muted-foreground truncate max-w-[200px]">{log.description}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-lg font-black text-foreground">₹{log.amount.toLocaleString()}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-xl border border-border w-fit group-hover:border-primary/30 transition-colors">
                                                    <p className="text-[10px] font-mono font-bold text-muted-foreground">ID: {log.sourceId?.slice(0, 12)}...</p>
                                                    <ArrowRight className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <p className="text-xs font-bold text-muted-foreground">
                                                        {new Date(log.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <History className="w-12 h-12 text-muted-foreground/20" />
                                                    <p className="text-muted-foreground font-medium">No revenue transactions recorded yet.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

function EarningCard({ icon: Icon, label, amount, subLabel, color, delay }: any) {
    const colorClasses: any = {
        blue: { text: 'text-blue-500', bg: 'bg-blue-500/10', shadow: 'shadow-blue-500/20' },
        purple: { text: 'text-purple-500', bg: 'bg-purple-500/10', shadow: 'shadow-purple-500/20' },
        emerald: { text: 'text-emerald-500', bg: 'bg-emerald-500/10', shadow: 'shadow-emerald-500/20' },
        orange: { text: 'text-orange-500', bg: 'bg-orange-500/10', shadow: 'shadow-orange-500/20' }
    };
    const c = colorClasses[color];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-card border border-border p-8 rounded-[40px] shadow-xl hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${c.bg} ${c.text}`}>
                    <Icon className="w-7 h-7" />
                </div>
                <div className="flex flex-col items-end">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">{subLabel}</p>
                </div>
            </div>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{label}</p>
            <p className={`text-3xl font-black mt-2 ${c.text}`}>₹{amount.toLocaleString()}</p>
            
            {/* Hover decoration */}
            <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-5 transition-transform group-hover:scale-150 ${c.bg}`} />
        </motion.div>
    );
}

function LiabilityItem({ label, amount, description, icon: Icon, color }: any) {
    const colorClasses: any = {
        blue: 'text-blue-500 bg-blue-500/10',
        purple: 'text-purple-500 bg-purple-500/10',
        orange: 'text-orange-500 bg-orange-500/10',
        emerald: 'text-emerald-500 bg-emerald-500/10'
    };
    return (
        <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClasses[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <div className="flex items-center justify-between gap-4">
                    <p className="font-black text-sm uppercase tracking-wider">{label}</p>
                    <p className="font-black text-lg">₹{amount.toLocaleString()}</p>
                </div>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{description}</p>
            </div>
        </div>
    );
}
