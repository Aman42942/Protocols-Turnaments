'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, DollarSign, IndianRupee, ShieldAlert, ShieldCheck, Activity, Save, Loader2, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EconomyDashboard() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [exchangeRate, setExchangeRate] = useState<string>('85');

    const fetchEconomyData = async () => {
        try {
            const token = localStorage.getItem('token');
            // 1. Fetch Economy Stats
            const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/economy`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }

            // 2. Fetch Config for Exchange Rate
            const configRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/content/PAYPAL_EXCHANGE_RATE`);
            if (configRes.ok) {
                const configData = await configRes.json();
                if (configData?.value) setExchangeRate(configData.value);
            }
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
            toast.error('Invalid Exchange Rate');
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ key: 'PAYPAL_EXCHANGE_RATE', value: exchangeRate })
            });
            if (res.ok) {
                toast.success('Exchange Rate Updated Successfully');
            } else {
                toast.error('Failed to update rate');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium animate-pulse">Analyzing Dual-Currency Flows...</p>
            </div>
        );
    }

    const isSecure = stats?.leakSystem?.status === 'SECURE';

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-3xl border border-border shadow-2xl relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <Coins className="w-8 h-8 text-yellow-500" />
                        Central Bank
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        Monitor and control the global platform economy.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-background p-2 rounded-2xl border border-border w-full md:w-auto">
                    <div className="w-10 h-10 flex items-center justify-center bg-muted rounded-xl">
                        <ArrowRightLeft className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Rate</p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">$1 USD = </span>
                            <input
                                type="number"
                                value={exchangeRate}
                                onChange={e => setExchangeRate(e.target.value)}
                                className="w-16 bg-transparent outline-none border-b border-dashed border-primary/50 text-primary font-black text-center"
                            />
                            <span className="text-sm font-bold text-yellow-500">Coins</span>
                        </div>
                    </div>
                    <button
                        onClick={saveExchangeRate}
                        disabled={saving}
                        className="w-10 h-10 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* LEAK STATUS */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-3xl border flex items-center gap-4 relative overflow-hidden ${isSecure ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}
            >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSecure ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {isSecure ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6 animate-pulse" />}
                </div>
                <div>
                    <h3 className={`text-lg font-black ${isSecure ? 'text-green-500' : 'text-red-500'}`}>
                        System Integrity: {isSecure ? 'SECURE' : 'LEAK DETECTED'}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">
                        {isSecure
                            ? "All minted coins perfectly match circulating supply and burned tokens."
                            : `Discrepancy of ${stats?.leakSystem?.delta} Coins detected. Immediate audit required.`}
                    </p>
                </div>
            </motion.div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                <StatCard
                    icon={IndianRupee}
                    label="Total INR Deposited"
                    value={`₹${stats?.totalINRDeposited?.toLocaleString() || 0}`}
                    color="text-blue-500"
                    bg="bg-blue-500/10"
                    delay={0.1}
                />

                <StatCard
                    icon={DollarSign}
                    label="Total USD Deposited"
                    value={`$${stats?.totalUSDPaid?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
                    color="text-emerald-500"
                    bg="bg-emerald-500/10"
                    delay={0.2}
                />

                <div className="col-span-1 md:col-span-2 lg:col-span-1 hidden lg:block" />

                <StatCard
                    icon={Coins}
                    label="Total Coins Minted"
                    value={stats?.totalCoinsMinted?.toLocaleString() || 0}
                    color="text-yellow-500"
                    bg="bg-yellow-500/10"
                    delay={0.3}
                />

                <StatCard
                    icon={Activity}
                    label="Total Coins Burned/Spent"
                    value={stats?.totalCoinsBurned?.toLocaleString() || 0}
                    color="text-orange-500"
                    bg="bg-orange-500/10"
                    delay={0.4}
                />

                <StatCard
                    icon={ShieldCheck}
                    label="Economy Size (In Wallets)"
                    value={stats?.totalCoinsInWallets?.toLocaleString() || 0}
                    color="text-purple-500"
                    bg="bg-purple-500/10"
                    delay={0.5}
                />

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
            className="bg-card border border-border p-6 rounded-3xl shadow-xl flex items-center gap-5 hover:-translate-y-1 transition-transform"
        >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg}`}>
                <Icon className={`w-7 h-7 ${color}`} />
            </div>
            <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
            </div>
        </motion.div>
    );
}
