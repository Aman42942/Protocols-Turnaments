'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert, Shield, ShieldCheck, AlertOctagon,
    RefreshCw, Terminal, Search, Flame, ServerCrash, Skull, CheckCircle2, Lock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

interface SecurityStat {
    totalLogs: number;
    activeBans: number;
    criticalThreats: number;
    recentLogs: any[];
}

export default function SecurityDashboardPage() {
    const [stats, setStats] = useState<SecurityStat | null>(null);
    const [bannedIps, setBannedIps] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'LOGS' | 'BANS'>('LOGS');
    const [loading, setLoading] = useState(true);
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsRes, bansRes] = await Promise.all([
                api.get('/security/dashboard'),
                api.get('/security/banned-ips')
            ]);
            setStats(statsRes.data);
            setBannedIps(bansRes.data);
        } catch (err) {
            console.error('Failed to load security data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // Live update every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const unbanIp = async (ip: string) => {
        if (!confirm(`Are you sure you want to unban ${ip}?`)) return;
        try {
            // Encode IP to handle potential special chars when passing in URL params
            await api.delete(`/security/banned-ips/${encodeURIComponent(ip)}`);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to unban IP');
        }
    };

    const resolveLog = async (id: string) => {
        setResolvingId(id);
        try {
            await api.post(`/security/resolve-log/${id}`);
            loadData();
        } catch (err) {
            console.error(err);
        } finally {
            setResolvingId(null);
        }
    };

    const getSeverityDetails = (sev: string) => {
        switch (sev) {
            case 'CRITICAL': return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: Skull };
            case 'HIGH': return { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: Flame };
            case 'MEDIUM': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: AlertOctagon };
            default: return { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: ShieldAlert };
        }
    };

    if (loading && !stats) {
        return <div className="flex justify-center items-center h-[50vh]"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-red-500 drop-shadow-sm flex items-center gap-2">
                            Hyper-Advanced Firewall
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        </h1>
                        <p className="text-muted-foreground text-sm font-semibold tracking-wide">Live threat monitoring and autopilot ban system</p>
                    </div>
                </div>
                <Button onClick={loadData} variant="outline" className="gap-2 rounded-xl border-red-500/30 hover:bg-red-500/10 hover:text-red-500 transition-all">
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Force Scan
                </Button>
            </motion.div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card border-border overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent z-0 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                        <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Threats Blocked</CardTitle>
                        <ShieldCheck className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent className="z-10 relative">
                        <div className="text-4xl font-black text-foreground drop-shadow-sm">{stats?.totalLogs || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Requests intercepted by WAF</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent z-0 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                        <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Autopilot Bans</CardTitle>
                        <Lock className="h-5 w-5 text-red-500" />
                    </CardHeader>
                    <CardContent className="z-10 relative">
                        <div className="text-4xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)] flex items-center gap-2">
                            {stats?.activeBans || 0}
                            {(stats?.activeBans || 0) > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30">ACTIVE</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Malicious IPs permanently blocked</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border overflow-hidden relative group bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                        <CardTitle className="text-sm font-bold text-orange-400 uppercase tracking-widest">Unresolved Critical</CardTitle>
                        <Skull className="h-5 w-5 text-orange-500 animate-pulse" />
                    </CardHeader>
                    <CardContent className="z-10 relative">
                        <div className="text-4xl font-black text-orange-500 drop-shadow-sm">{stats?.criticalThreats || 0}</div>
                        <p className="text-xs text-orange-500/70 mt-1">High-severity incidents requiring attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Interface */}
            <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="flex border-b border-border">
                    <button
                        onClick={() => setActiveTab('LOGS')}
                        className={cn("px-6 py-4 font-bold tracking-wider text-sm transition-all focus:outline-none flex items-center gap-2", activeTab === 'LOGS' ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-muted/50")}
                    >
                        <Terminal className="w-4 h-4" /> Live Threat Radar
                        {stats?.recentLogs && stats.recentLogs.length > 0 && <Badge variant="secondary" className="ml-2 font-black">{stats.recentLogs.length}</Badge>}
                    </button>
                    <button
                        onClick={() => setActiveTab('BANS')}
                        className={cn("px-6 py-4 font-bold tracking-wider text-sm transition-all focus:outline-none flex items-center gap-2", activeTab === 'BANS' ? "bg-red-500/10 text-red-500 border-b-2 border-red-500" : "text-muted-foreground hover:bg-muted/50")}
                    >
                        <Shield className="w-4 h-4" /> Banned IPs
                        {bannedIps.length > 0 && <Badge className="ml-2 bg-red-500/20 text-red-500 border-none font-black">{bannedIps.length}</Badge>}
                    </button>
                </div>

                <div className="p-0">
                    {/* BANNED IPS TAB */}
                    {activeTab === 'BANS' && (
                        <div className="p-4 space-y-4">
                            {bannedIps.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground">
                                    <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-bold">No Banned IPs</p>
                                    <p className="text-sm">The autopilot firewall currently has no active blocks.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {bannedIps.map(ban => (
                                        <div key={ban.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors gap-4">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-black text-red-500 tracking-wider font-mono text-lg">{ban.ipAddress}</span>
                                                    <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/30">Auto-Banned</Badge>
                                                </div>
                                                <p className="text-sm text-foreground/80 mt-1 font-medium">{ban.reason}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                    <span>Attempted bypass: <strong className="text-foreground">{ban.attemptCount} times</strong></span>
                                                    <span>Banned on: {new Date(ban.createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <Button onClick={() => unbanIp(ban.ipAddress)} variant="outline" className="border-border hover:bg-background hover:text-foreground shrink-0 rounded-lg whitespace-nowrap">
                                                Unban IP
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* LIVE LOGS TAB */}
                    {activeTab === 'LOGS' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                                    <tr>
                                        <th className="px-5 py-4 font-black tracking-widest">Time</th>
                                        <th className="px-5 py-4 font-black tracking-widest">IP Address</th>
                                        <th className="px-5 py-4 font-black tracking-widest">Type / Route</th>
                                        <th className="px-5 py-4 font-black tracking-widest">Severity</th>
                                        <th className="px-5 py-4 font-black tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.recentLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-muted-foreground">
                                                <div className="inline-flex items-center justify-center p-4 rounded-full bg-muted/50 mb-4">
                                                    <Terminal className="w-8 h-8 opacity-50" />
                                                </div>
                                                <p className="font-bold">No Threats Detected</p>
                                                <p className="text-xs mt-1">The radar is clear.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        stats?.recentLogs.map((log) => {
                                            const details = getSeverityDetails(log.severity);
                                            const Icon = details.icon;
                                            return (
                                                <tr key={log.id} className={cn("border-b border-border/50 hover:bg-muted/20 transition-colors", log.resolved ? 'opacity-50' : '')}>
                                                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                        {new Date(log.createdAt).toLocaleTimeString()}
                                                    </td>
                                                    <td className="px-5 py-4 font-mono font-bold">{log.ipAddress}</td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider", details.bg, details.color)}>{log.type}</span>
                                                                <span className="font-mono text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{log.method}</span>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-md">{log.path}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-widest", details.border, details.color, details.bg)}>
                                                            <Icon className="w-3 h-3" /> {log.severity}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        {!log.resolved ? (
                                                            <Button
                                                                disabled={resolvingId === log.id}
                                                                onClick={() => resolveLog(log.id)}
                                                                variant="outline" size="sm"
                                                                className="h-8 rounded-lg border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-600 gap-1"
                                                            >
                                                                {resolvingId === log.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                                                {" Resolve"}
                                                            </Button>
                                                        ) : (
                                                            <span className="text-xs font-bold text-muted-foreground/50 tracking-wider mr-2 uppercase">RESOLVED</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
