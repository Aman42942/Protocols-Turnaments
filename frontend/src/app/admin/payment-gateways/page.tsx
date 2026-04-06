'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, Plus, Trash2, Pencil, Power, Loader2, Shield, Globe, Zap,
    ArrowUpDown, X, Check, ChevronDown, ArrowDownToLine, ArrowUpFromLine, RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface PaymentGateway {
    id: string;
    name: string;
    provider: string;
    type: string;
    isEnabled: boolean;
    mode: string;
    apiKey: string | null;
    apiSecret: string | null;
    webhookSecret: string | null;
    extraConfig: any;
    supportedCurrencies: string[];
    description: string | null;
    iconUrl: string | null;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
}

const PROVIDERS = [
    'CASHFREE', 'RAZORPAY', 'STRIPE', 'PAYPAL', 'PHONEPE', 'UPI', 'WISE', 'PAYONEER', 'PAYTM', 'CUSTOM'
];

const CURRENCIES = ['INR', 'USD', 'GBP', 'EUR', 'AED', 'SGD', 'AUD', 'CAD'];

const PROVIDER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    CASHFREE: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
    RAZORPAY: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
    STRIPE: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' },
    PAYPAL: { bg: 'bg-sky-500/10', text: 'text-sky-500', border: 'border-sky-500/20' },
    PHONEPE: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20' },
    UPI: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
    WISE: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
    PAYONEER: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' },
    PAYTM: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' },
    CUSTOM: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
    DEPOSIT: <ArrowDownToLine className="w-3.5 h-3.5" />,
    WITHDRAWAL: <ArrowUpFromLine className="w-3.5 h-3.5" />,
    BOTH: <ArrowUpDown className="w-3.5 h-3.5" />,
};

const emptyForm = {
    name: '',
    provider: 'CASHFREE',
    type: 'BOTH',
    mode: 'SANDBOX',
    apiKey: '',
    apiSecret: '',
    webhookSecret: '',
    supportedCurrencies: ['INR'] as string[],
    description: '',
    iconUrl: '',
    displayOrder: 0,
};

export default function PaymentGatewaysPage() {
    const [gateways, setGateways] = useState<PaymentGateway[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const fetchGateways = async () => {
        try {
            const res = await api.get('/admin/payment-gateways');
            setGateways(res.data);
        } catch (err) {
            console.error('Failed to fetch gateways:', err);
            toast.error('Failed to load payment gateways');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGateways(); }, []);

    const openAdd = () => {
        setEditId(null);
        setForm({ ...emptyForm });
        setModalOpen(true);
    };

    const openEdit = (g: PaymentGateway) => {
        setEditId(g.id);
        setForm({
            name: g.name,
            provider: g.provider,
            type: g.type,
            mode: g.mode,
            apiKey: g.apiKey || '',
            apiSecret: g.apiSecret || '',
            webhookSecret: g.webhookSecret || '',
            supportedCurrencies: g.supportedCurrencies,
            description: g.description || '',
            iconUrl: g.iconUrl || '',
            displayOrder: g.displayOrder,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error('Name is required');
        setSaving(true);
        try {
            if (editId) {
                await api.put(`/admin/payment-gateways/${editId}`, form);
                toast.success('Gateway updated!');
            } else {
                await api.post('/admin/payment-gateways', form);
                toast.success('Gateway added!');
            }
            setModalOpen(false);
            fetchGateways();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id: string) => {
        setTogglingId(id);
        try {
            await api.patch(`/admin/payment-gateways/${id}/toggle`);
            fetchGateways();
            toast.success('Toggle updated');
        } catch (err) {
            toast.error('Failed to toggle');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}" payment gateway? This cannot be undone.`)) return;
        try {
            await api.delete(`/admin/payment-gateways/${id}`);
            toast.success('Gateway deleted');
            fetchGateways();
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const toggleCurrency = (cur: string) => {
        setForm(prev => ({
            ...prev,
            supportedCurrencies: prev.supportedCurrencies.includes(cur)
                ? prev.supportedCurrencies.filter(c => c !== cur)
                : [...prev.supportedCurrencies, cur]
        }));
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium animate-pulse tracking-widest text-xs uppercase">Loading Gateways...</p>
            </div>
        );
    }

    const depositGateways = gateways.filter(g => g.type === 'DEPOSIT' || g.type === 'BOTH');
    const withdrawalGateways = gateways.filter(g => g.type === 'WITHDRAWAL' || g.type === 'BOTH');

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center">
                        <CreditCard className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Payment Gateways</h1>
                        <p className="text-sm text-muted-foreground font-medium mt-0.5">
                            Add, configure, and manage deposit & withdrawal payment providers.
                        </p>
                    </div>
                </div>
                <Button
                    onClick={openAdd}
                    className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 gap-2"
                >
                    <Plus className="w-5 h-5" /> Add New Gateway
                </Button>
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: gateways.length, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Active', value: gateways.filter(g => g.isEnabled).length, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { label: 'Deposit', value: depositGateways.length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Withdrawal', value: withdrawalGateways.length, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 border border-border/30`}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                        <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Gateway Cards */}
            {gateways.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-[40px] border border-border">
                    <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                    <h3 className="text-xl font-black text-muted-foreground">No Payment Gateways</h3>
                    <p className="text-sm text-muted-foreground mt-2 mb-6">Add your first payment provider to get started.</p>
                    <Button onClick={openAdd} className="gap-2 rounded-2xl"><Plus className="w-4 h-4" /> Add Gateway</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {gateways.map((g) => {
                            const colors = PROVIDER_COLORS[g.provider] || PROVIDER_COLORS.CUSTOM;
                            return (
                                <motion.div
                                    key={g.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`bg-card rounded-3xl border overflow-hidden hover:-translate-y-1 transition-all duration-300 group ${g.isEnabled ? 'border-border shadow-lg' : 'border-border/50 opacity-60'}`}
                                >
                                    {/* Card Header */}
                                    <div className={`p-6 border-b border-border/50 ${colors.bg}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                                                    <CreditCard className={`w-6 h-6 ${colors.text}`} />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-lg">{g.name}</h3>
                                                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest ${colors.text} ${colors.border}`}>
                                                        {g.provider}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(g)} className="p-2 rounded-xl bg-background/60 backdrop-blur border border-border/50 hover:border-primary/30 hover:text-primary transition-all" title="Edit">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleDelete(g.id, g.name)} className="p-2 rounded-xl bg-background/60 backdrop-blur border border-border/50 hover:border-red-500/30 hover:text-red-500 transition-all" title="Delete">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-6 space-y-4">
                                        {g.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">{g.description}</p>
                                        )}

                                        {/* Type & Mode */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/30 border border-border/50 text-[10px] font-black uppercase tracking-widest">
                                                {TYPE_ICONS[g.type]} {g.type}
                                            </span>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${g.mode === 'PRODUCTION'
                                                    ? 'bg-green-500/10 border-green-500/20 text-green-500'
                                                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                                                }`}>
                                                <Shield className="w-3 h-3" /> {g.mode}
                                            </span>
                                        </div>

                                        {/* Currencies */}
                                        <div className="flex gap-1.5 flex-wrap">
                                            {g.supportedCurrencies.map(cur => (
                                                <span key={cur} className="px-2 py-0.5 rounded-md bg-muted/40 border border-border/50 text-[10px] font-black tracking-wider">
                                                    {cur}
                                                </span>
                                            ))}
                                        </div>

                                        {/* API Status */}
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                            {g.apiKey ? (
                                                <span className="flex items-center gap-1 text-green-500"><Check className="w-3 h-3" /> API Configured</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-yellow-500"><Shield className="w-3 h-3" /> No API Keys</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Footer — Enable/Disable */}
                                    <div className="px-6 pb-5">
                                        <button
                                            onClick={() => handleToggle(g.id)}
                                            disabled={togglingId === g.id}
                                            className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl border font-black text-xs uppercase tracking-widest transition-all ${g.isEnabled
                                                    ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500'
                                                    : 'bg-muted/20 border-border/50 text-muted-foreground hover:bg-green-500/10 hover:border-green-500/20 hover:text-green-500'
                                                }`}
                                        >
                                            {togglingId === g.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Power className="w-3.5 h-3.5" />
                                                    {g.isEnabled ? 'Enabled — Click to Disable' : 'Disabled — Click to Enable'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* ── ADD / EDIT MODAL ──────────────────────────────────── */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur z-10 rounded-t-3xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black">{editId ? 'Edit Gateway' : 'Add New Gateway'}</h2>
                                        <p className="text-xs text-muted-foreground">Configure payment provider details</p>
                                    </div>
                                </div>
                                <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-5">
                                {/* Name */}
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Gateway Name *</label>
                                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Razorpay India" className="h-12 rounded-xl" />
                                </div>

                                {/* Provider & Type */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Provider</label>
                                        <select value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} className="w-full h-12 rounded-xl border border-border bg-background px-3 text-sm font-bold">
                                            {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Type</label>
                                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full h-12 rounded-xl border border-border bg-background px-3 text-sm font-bold">
                                            <option value="BOTH">Both (Deposit + Withdrawal)</option>
                                            <option value="DEPOSIT">Deposit Only</option>
                                            <option value="WITHDRAWAL">Withdrawal Only</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Mode */}
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Mode</label>
                                    <div className="flex gap-2">
                                        {['SANDBOX', 'PRODUCTION'].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setForm({ ...form, mode: m })}
                                                className={`flex-1 h-10 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${form.mode === m
                                                        ? m === 'PRODUCTION'
                                                            ? 'bg-green-500/10 border-green-500/30 text-green-500'
                                                            : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                                                        : 'bg-muted/20 border-border/50 text-muted-foreground hover:border-border'
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* API Keys */}
                                <div className="bg-muted/10 rounded-2xl border border-border/50 p-4 space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Shield className="w-3 h-3" /> API Configuration</p>
                                    <Input value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })} placeholder="API Key / Client ID" className="h-10 rounded-xl text-xs font-mono" />
                                    <Input value={form.apiSecret} onChange={e => setForm({ ...form, apiSecret: e.target.value })} placeholder="API Secret / Client Secret" type="password" className="h-10 rounded-xl text-xs font-mono" />
                                    <Input value={form.webhookSecret} onChange={e => setForm({ ...form, webhookSecret: e.target.value })} placeholder="Webhook Secret (optional)" type="password" className="h-10 rounded-xl text-xs font-mono" />
                                </div>

                                {/* Currencies */}
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Supported Currencies</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {CURRENCIES.map(cur => (
                                            <button
                                                key={cur}
                                                onClick={() => toggleCurrency(cur)}
                                                className={`px-3 py-1.5 rounded-lg border text-xs font-black transition-all ${form.supportedCurrencies.includes(cur)
                                                        ? 'bg-primary/10 border-primary/30 text-primary'
                                                        : 'bg-muted/20 border-border/50 text-muted-foreground hover:border-border'
                                                    }`}
                                            >
                                                {cur}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Description (optional)</label>
                                    <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Primary gateway for Indian payments" className="h-10 rounded-xl" />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-border flex gap-3 sticky bottom-0 bg-card/95 backdrop-blur rounded-b-3xl">
                                <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 h-12 rounded-xl font-black">Cancel</Button>
                                <Button onClick={handleSave} disabled={saving} className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 gap-2">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    {editId ? 'Update Gateway' : 'Add Gateway'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
