'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Save, Loader2, CheckCircle2, RefreshCw, Scale, Shield, CreditCard, Gamepad2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';

// ───── Types ─────────────────────────────────────────────────────────────────
const LEGAL_DOCS = [
    {
        key: 'LEGAL_TERMS',
        label: 'Terms & Conditions',
        icon: Scale,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        placeholder: `Write your Terms & Conditions here...

1. Eligibility
   - Participants must be at least 13 years old.
   - Cash tournaments may require participants to be 18+.

2. Fair Play
   - Cheating, exploits or third-party tools are strictly prohibited.
   - Violations result in permanent ban and forfeiture of winnings.

3. Platform Fees
   - A nominal service fee may be applied on withdrawals.

4. Dispute Resolution
   - Tournament admins have final say in match disputes.`,
    },
    {
        key: 'LEGAL_PRIVACY',
        label: 'Privacy Policy',
        icon: Shield,
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        placeholder: `Write your Privacy Policy here...

1. Data We Collect
   - Email, username, gameplay statistics, and payment information.
   
2. How We Use Data
   - To operate the platform, process payments, and prevent fraud.

3. Data Sharing
   - We never sell your data. Payment processors (Cashfree, PayPal) receive only what is necessary.

4. Your Rights
   - You may request data deletion by contacting support.`,
    },
    {
        key: 'LEGAL_REFUND',
        label: 'Refund Policy',
        icon: CreditCard,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        placeholder: `Write your Refund Policy here...

1. Tournament Cancellation
   - If a tournament is cancelled by the organizer, full coin credit is issued.

2. Entry Fee Refunds
   - Entry fees are non-refundable once a tournament begins.
   - If a match is cancelled before start, entry fee is refunded to wallet.

3. Withdrawal Refunds
   - Failed withdrawals are automatically refunded to your coin wallet.

4. Contact
   - For refund disputes, email support@protocolapp.com within 7 days.`,
    },
    {
        key: 'LEGAL_DISCLAIMER',
        label: 'Skill-Based Game Disclaimer',
        icon: Gamepad2,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        placeholder: `Write your Skill-Based Game Disclaimer here...

Protocol Tournament is a skill-based gaming platform.

1. Skill-Based Games
   - Outcomes on this platform are determined primarily by player skill, strategy, and knowledge — NOT chance.

2. No Gambling
   - This platform does not operate as a gambling service. Entry fees are collected to fund prize pools distributed to top performers based on merit.

3. Jurisdiction
   - Users are responsible for ensuring that participation is legal in their jurisdiction.
   - The platform is not available in states/territories where skill-based gaming competitions are prohibited.

4. Age Restriction
   - Users must be 18+ to participate in paid tournaments.`,
    },
];

// ───── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function AdminLegalPage() {
    const [activeKey, setActiveKey] = useState(LEGAL_DOCS[0].key);
    const [contents, setContents] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedKey, setSavedKey] = useState<string | null>(null);

    // Fetch all legal docs from CMS
    const loadAll = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled(
                LEGAL_DOCS.map(doc =>
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/content/${doc.key}`)
                        .then(r => r.json())
                )
            );
            const newContents: Record<string, string> = {};
            LEGAL_DOCS.forEach((doc, i) => {
                const res = results[i];
                if (res.status === 'fulfilled' && res.value?.value) {
                    newContents[doc.key] = res.value.value;
                } else {
                    newContents[doc.key] = '';
                }
            });
            setContents(newContents);
        } catch {
            toast.error('Failed to load legal content');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    const handleSave = async (docKey: string) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ key: docKey, value: contents[docKey] || '' }),
            });
            if (!res.ok) throw new Error('Save failed');
            toast.success('Legal page saved ✅');
            setSavedKey(docKey);
            setTimeout(() => setSavedKey(null), 2500);
        } catch {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const activeDoc = LEGAL_DOCS.find(d => d.key === activeKey)!;
    const ActiveIcon = activeDoc.icon;

    const wordCount = (contents[activeKey] || '').split(/\s+/).filter(Boolean).length;
    const charCount = (contents[activeKey] || '').length;

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase">Legal Pages</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Manage all legal content visible to users across the platform.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={loadAll}
                    className="flex items-center gap-2 self-start sm:self-auto rounded-2xl"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh All
                </Button>
            </motion.div>

            {loading ? (
                <div className="min-h-[400px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-muted-foreground text-sm">Loading legal content...</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* ── Sidebar Doc List ── */}
                    <div className="lg:col-span-1 space-y-2">
                        {LEGAL_DOCS.map(doc => {
                            const Icon = doc.icon;
                            const isActive = activeKey === doc.key;
                            const hasContent = !!(contents[doc.key]);
                            return (
                                <motion.button
                                    key={doc.key}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setActiveKey(doc.key)}
                                    className={`w-full text-left flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 ${isActive
                                        ? `${doc.bg} ${doc.border} shadow-sm`
                                        : 'border-transparent bg-muted/20 hover:bg-muted/40'}`}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? doc.bg : 'bg-muted/40'}`}>
                                        <Icon className={`w-4 h-4 ${isActive ? doc.color : 'text-muted-foreground'}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-xs font-black truncate ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {doc.label}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            {hasContent ? `${contents[doc.key].length} chars` : 'Empty'}
                                        </p>
                                    </div>
                                    {savedKey === doc.key && (
                                        <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto shrink-0" />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* ── Editor ── */}
                    <motion.div
                        key={activeKey}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="lg:col-span-3 rounded-3xl border border-border bg-card shadow-xl overflow-hidden flex flex-col"
                    >
                        {/* Editor header */}
                        <div className={`flex items-center justify-between p-5 border-b border-border ${activeDoc.bg}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeDoc.bg} border ${activeDoc.border}`}>
                                    <ActiveIcon className={`w-5 h-5 ${activeDoc.color}`} />
                                </div>
                                <div>
                                    <p className="font-black text-sm">{activeDoc.label}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {wordCount} words · {charCount} characters
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.93 }}
                                disabled={saving}
                                onClick={() => handleSave(activeKey)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all border ${savedKey === activeKey
                                    ? 'bg-green-500/10 border-green-500/30 text-green-500'
                                    : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground'}`}
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : savedKey === activeKey ? (
                                    <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                                ) : (
                                    <><Save className="w-4 h-4" /> Save Changes</>
                                )}
                            </motion.button>
                        </div>

                        {/* Textarea */}
                        <div className="flex-1 p-4">
                            <textarea
                                value={contents[activeKey] || ''}
                                onChange={e => setContents(prev => ({ ...prev, [activeKey]: e.target.value }))}
                                placeholder={activeDoc.placeholder}
                                rows={24}
                                className="w-full h-full min-h-[420px] bg-muted/20 border border-border rounded-2xl p-5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 resize-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all leading-relaxed"
                                spellCheck={false}
                            />
                        </div>

                        <div className="p-4 pt-0 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                💡 Plain text supported. Line breaks are preserved on public pages.
                            </p>
                            <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground font-mono">{activeDoc.key}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
