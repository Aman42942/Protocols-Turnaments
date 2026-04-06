"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, ShieldCheck, Sparkles, MessageSquare, Loader2, AlertCircle, ArrowRight, BrainCircuit, RefreshCcw, DollarSign, ShieldAlert, Copy, Check, Twitter, Instagram } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

interface Insight {
    title: string;
    description: string;
    impact: 'High' | 'Medium' | 'Low';
}

export default function AiGrowthHub() {
    const [activeTab, setActiveTab] = useState<'strategy' | 'marketing' | 'security' | 'financials'>('strategy');
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Marketing State
    const [marketingContext, setMarketingContext] = useState('');
    const [marketingResult, setMarketingResult] = useState<any>(null);
    const [generatingMarketing, setGeneratingMarketing] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    // Financials State
    const [financials, setFinancials] = useState<any>(null);
    const [loadingFinancials, setLoadingFinancials] = useState(false);

    // Security State
    const [securityAudit, setSecurityAudit] = useState<any>(null);
    const [auditingSecurity, setAuditingSecurity] = useState(false);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const res = await api.get('/ai/insights');
            if (res.data.insights) {
                setInsights(res.data.insights);
            } else {
                setError('AI is still calibrating your data. Please check back shortly.');
            }
        } catch (err) {
            setError('Failed to connect to the Growth Brain.');
        } finally {
            setLoading(false);
        }
    };

    const generateMarketing = async () => {
        if (!marketingContext) return;
        setGeneratingMarketing(true);
        try {
            const res = await api.post('/ai/marketing', { context: marketingContext });
            setMarketingResult(res.data);
            toast.success("Marketing content generated!");
        } catch (err) {
            toast.error("Failed to generate content.");
        } finally {
            setGeneratingMarketing(false);
        }
    };

    const fetchFinancials = async () => {
        setLoadingFinancials(true);
        try {
            const res = await api.get('/ai/financials');
            setFinancials(res.data);
        } catch (err) {
            toast.error("Financial data unavailable.");
        } finally {
            setLoadingFinancials(false);
        }
    };

    const runSecurityAudit = async () => {
        setAuditingSecurity(true);
        try {
            const res = await api.get('/ai/security-audit');
            setSecurityAudit(res.data);
            toast.info("Security scan complete.");
        } catch (err) {
            toast.error("Security scan failed.");
        } finally {
            setAuditingSecurity(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
        toast.info("Copied to clipboard");
    };

    return (
        <div className="space-y-8 pb-12">
            {/* ── HEADER ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <BrainCircuit className="w-5 h-5" />
                        </div>
                        <Badge variant="outline" className="bg-purple-500/5 text-purple-500 border-purple-500/20">OWNER COMMAND CENTER</Badge>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase">AI <span className="text-purple-500">Admin Hub</span></h1>
                    <p className="text-muted-foreground mt-1 max-w-xl font-medium uppercase text-[10px] tracking-[0.2em] opacity-70">
                        Zero-cost elite intelligence for scaling and security.
                    </p>
                </div>
                
                {/* ── TABS ── */}
                <div className="flex bg-muted/30 p-1 rounded-2xl border border-border/40 overflow-x-auto no-scrollbar">
                    {(['strategy', 'marketing', 'security', 'financials'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                if (tab === 'financials' && !financials) fetchFinancials();
                                if (tab === 'security' && !securityAudit) runSecurityAudit();
                            }}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                activeTab === tab ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-muted/50"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* ── STRATEGY TAB ── */}
                {activeTab === 'strategy' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="strategy">
                         <Card className="relative overflow-hidden bg-card/40 backdrop-blur-xl border-purple-500/20 shadow-2xl shadow-purple-500/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl font-black italic">
                                    <TrendingUp className="w-5 h-5 text-purple-400" />
                                    STRATEGIC PULSE
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="h-[300px] flex flex-col items-center justify-center">
                                        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest animate-pulse">Scanning Ecosystem...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {insights.map((insight, i) => (
                                            <div key={i} className="p-6 rounded-3xl bg-muted/20 border border-border/40 hover:border-purple-500/40 transition-all group">
                                                <Badge className="mb-4 text-[9px] uppercase font-black bg-purple-500/20 text-purple-400 border-none">{insight.impact} IMPACT</Badge>
                                                <h4 className="font-black text-sm mb-2 uppercase">{insight.title}</h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed font-medium">{insight.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* ── MARKETING TAB ── */}
                {activeTab === 'marketing' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="marketing" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="border-primary/20 bg-card/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl font-black italic">
                                    <Sparkles className="w-5 h-5 text-blue-400" />
                                    CONTENT CRAFTER
                                </CardTitle>
                                <CardDescription className="text-xs font-bold uppercase opacity-60">Generate viral marketing in seconds</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">What are you promoting?</label>
                                    <textarea 
                                        value={marketingContext}
                                        onChange={(e) => setMarketingContext(e.target.value)}
                                        placeholder="E.g. Weekend Mega Tournament for BGMI with 10k prize pool, free entry for first 50..."
                                        className="w-full h-32 bg-muted/40 border border-border/40 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-primary/40 resize-none"
                                    />
                                </div>
                                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-[11px] font-black tracking-widest" onClick={generateMarketing} disabled={generatingMarketing || !marketingContext}>
                                    {generatingMarketing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'GENERATE VIRAL CONTENT'}
                                </Button>
                            </CardContent>
                        </Card>

                        {marketingResult && (
                            <div className="space-y-4">
                                <MarketingCard title="Instagram Viral Caption" icon={<Instagram className="w-4 h-4" color="#E1306C"/>} content={marketingResult.instagram} id="insta" copy={copyToClipboard} copied={copied} />
                                <MarketingCard title="WhatsApp Announcement" icon={<MessageSquare className="w-4 h-4" color="#25D366" />} content={marketingResult.whatsapp} id="wa" copy={copyToClipboard} copied={copied} />
                                <MarketingCard title="SEO Meta Description" icon={<TrendingUp className="w-4 h-4" color="#3b82f6" />} content={marketingResult.seo} id="seo" copy={copyToClipboard} copied={copied} />
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── SECURITY TAB ── */}
                {activeTab === 'security' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="security">
                         <Card className="border-red-500/20 bg-card/40 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4">
                                 <ShieldAlert className="w-32 h-32 text-red-500/5 -rotate-12" />
                             </div>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl font-black italic">
                                    <ShieldCheck className="w-5 h-5 text-red-500" />
                                    SECURITY SENTINEL
                                </CardTitle>
                                <CardDescription className="text-xs font-bold uppercase opacity-60">AI-powered threat auditing and mitigation</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {auditingSecurity ? (
                                    <div className="h-[200px] flex flex-col items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
                                        <p className="text-[10px] font-black tracking-widest animate-pulse uppercase">Auditing Access Logs...</p>
                                    </div>
                                ) : securityAudit ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 p-6 rounded-3xl bg-red-500/10 border border-red-500/20">
                                            <div className="p-4 rounded-2xl bg-red-500 text-white font-black italic">ALERT</div>
                                            <div>
                                                <h4 className="font-black uppercase text-red-500 tracking-tight">System Threat Level: {securityAudit.threatLevel}</h4>
                                                <p className="text-xs font-medium text-muted-foreground">{securityAudit.summary}</p>
                                            </div>
                                        </div>
                                        <div className="p-6 rounded-3xl bg-muted/40 border border-border/40">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-4 tracking-widest">Recommended Action</p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-bold text-red-400">{securityAudit.urgentAction}</p>
                                                <Button size="sm" variant="destructive" className="h-8 px-4 text-[10px] font-black uppercase">EXECUTE MITIGATION</Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* ── FINANCIALS TAB ── */}
                {activeTab === 'financials' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="financials">
                        <Card className="border-green-500/20 bg-card/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl font-black italic">
                                    <DollarSign className="w-5 h-5 text-green-500" />
                                    FINANCIAL FORECASTER
                                </CardTitle>
                                <CardDescription className="text-xs font-bold uppercase opacity-60">Revenue predictions and cashflow health</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingFinancials ? (
                                    <div className="h-[200px] flex flex-col items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-4" />
                                        <p className="text-[10px] font-black tracking-widest animate-pulse uppercase">Calculating ROI...</p>
                                    </div>
                                ) : financials ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-8 rounded-[40px] bg-green-500/10 border border-green-500/20 flex flex-col items-center justify-center text-center">
                                            <p className="text-[10px] font-black uppercase text-green-500 mb-2 tracking-[0.2em]">30-Day Projection</p>
                                            <p className="text-4xl font-black tracking-tighter text-green-400 mb-4">{financials.projection}</p>
                                            <Badge className="bg-green-500/20 text-green-400 border-none font-black uppercase text-[9px]">{financials.confidence}% AI CONFIDENCE</Badge>
                                        </div>
                                        <div className="space-y-4 justify-center flex flex-col">
                                            <div className="p-6 rounded-3xl bg-muted/40 border border-border/40">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Growth Trend</p>
                                                <p className="text-sm font-bold text-foreground">{financials.growthTrend}</p>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-medium italic opacity-60">* Predictions are based on historical transaction volume and user registration trends.</p>
                                        </div>
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── BACKGROUND HUD DECOR ── */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full -z-10 animate-pulse pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
        </div>
    );
}

function MarketingCard({ title, icon, content, id, copy, copied }: any) {
    return (
        <Card className="border-border/40 bg-card/60 backdrop-blur-md overflow-hidden group">
            <div className="p-4 flex items-center justify-between border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-2">
                    {icon}
                    <h5 className="text-[10px] font-black uppercase tracking-widest">{title}</h5>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 w-7 p-0 rounded-lg hover:bg-primary hover:text-white transition-all"
                    onClick={() => copy(content, id)}
                >
                    {copied === id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </Button>
            </div>
            <div className="p-4">
                <p className="text-xs font-medium text-muted-foreground leading-relaxed italic">"{content}"</p>
            </div>
        </Card>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
