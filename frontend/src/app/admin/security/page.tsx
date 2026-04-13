'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ShieldAlert, Trash2, Plus, RefreshCw, AlertTriangle, MonitorX, Save } from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';

export default function SecurityControlPanel() {
    const [bannedIps, setBannedIps] = useState<any[]>([]);
    const [ipToBan, setIpToBan] = useState('');
    const [banReason, setBanReason] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Page Config State
    const [pageTitle, setPageTitle] = useState('');
    const [pageMessage, setPageMessage] = useState('');

    // Autopilot State
    const [autopilotEnabled, setAutopilotEnabled] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [ipsRes, configRes, autopilotRes] = await Promise.all([
                api.get('/security/banned-ips'),
                api.get('/security/banned-page-config'),
                api.get('/security/autopilot-config')
            ]);
            setBannedIps(ipsRes.data);
            setPageTitle(configRes.data.title || 'Access Restricted');
            setPageMessage(configRes.data.message || 'Your IP or Account has been permanently blocked.');
            setAutopilotEnabled(autopilotRes.data.enabled);
        } catch (error) {
            console.error("Failed to load security data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBanIp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ipToBan) return;
        setIsSaving(true);
        try {
            await api.post(`/security/banned-ips?ip=${encodeURIComponent(ipToBan)}&reason=${encodeURIComponent(banReason)}`);
            setIpToBan('');
            setBanReason('');
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to ban IP');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUnbanIp = async (ip: string) => {
        if (!confirm(`Are you sure you want to unban ${ip}?`)) return;
        try {
            await api.delete(`/security/banned-ips/${encodeURIComponent(ip)}`);
            fetchData();
        } catch (error: any) {
            alert('Failed to unban IP');
        }
    };

    const handleSaveConfig = async () => {
        setIsSaving(true);
        try {
            await api.patch(`/security/banned-page-config?title=${encodeURIComponent(pageTitle)}&message=${encodeURIComponent(pageMessage)}`);
            alert('Banned Page UI updated successfully.');
        } catch (error) {
            alert('Failed to update page configuration.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleAutopilot = async () => {
        setIsSaving(true);
        const newState = !autopilotEnabled;
        try {
            await api.patch(`/security/autopilot-config?enabled=${newState}`);
            setAutopilotEnabled(newState);
        } catch (error) {
            alert('Failed to update Autopilot status.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                        Security & Firewall
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage active IP bans and customize the restricted access screen.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh Logs
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Autopilot Matrix Card */}
                    <Card className="border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.05)]">
                        <CardHeader className="bg-orange-500/5 border-b border-orange-500/10 flex flex-row items-center justify-between pb-4">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-orange-500" /> Autopilot Ban
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Automatically ban IPs with malicious behavior.
                                </CardDescription>
                            </div>
                            <Button
                                variant={autopilotEnabled ? "default" : "outline"}
                                size="sm"
                                onClick={handleToggleAutopilot}
                                disabled={isSaving}
                                className={autopilotEnabled ? "bg-green-600 hover:bg-green-700 text-white" : "border-red-500/50 text-red-500 hover:bg-red-500/10"}
                            >
                                {autopilotEnabled ? "ON" : "OFF"}
                            </Button>
                        </CardHeader>
                    </Card>

                    {/* Custom Page Editor */}
                    <Card className="h-fit border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]">
                        <CardHeader className="bg-red-500/5 border-b border-red-500/10">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MonitorX className="w-5 h-5 text-red-500" /> Banned Screen UI
                            </CardTitle>
                            <CardDescription>
                                Customize what blocked users see when they are redirected.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Page Title</label>
                                <Input
                                    value={pageTitle}
                                    onChange={e => setPageTitle(e.target.value)}
                                    placeholder="e.g. Access Restricted"
                                    className="font-orbitron font-bold text-red-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Restrict Message</label>
                                <Textarea
                                    value={pageMessage}
                                    onChange={e => setPageMessage(e.target.value)}
                                    placeholder="Explain why they are blocked..."
                                    className="min-h-[120px] resize-none text-muted-foreground"
                                />
                            </div>
                            <Button
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleSaveConfig}
                                disabled={isSaving}
                            >
                                <Save className="w-4 h-4 mr-2" /> Save Active Layout
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Banned IPs List */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Manual Ban Form */}
                    <Card>
                        <CardHeader className="py-4 border-b border-border">
                            <CardTitle className="text-base flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500" /> Manual IP Ban
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <form onSubmit={handleBanIp} className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Enter IP Address (e.g. 192.168.1.1)"
                                        value={ipToBan}
                                        onChange={e => setIpToBan(e.target.value)}
                                        required
                                        className="font-mono"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        placeholder="Reason (optional)"
                                        value={banReason}
                                        onChange={e => setBanReason(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" variant="destructive" disabled={isSaving || !ipToBan}>
                                    <Plus className="w-4 h-4 mr-2" /> Block IP
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Table List */}
                    <Card>
                        <CardHeader className="py-4 border-b border-border flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Active IP Bans</CardTitle>
                            <Badge variant="destructive">{bannedIps.length} Blocked</Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
                            ) : bannedIps.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">No IP addresses are currently banned.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold">IP Address</th>
                                                <th className="px-6 py-3 font-semibold">Reason</th>
                                                <th className="px-6 py-3 font-semibold">Hits</th>
                                                <th className="px-6 py-3 font-semibold">Banned On</th>
                                                <th className="px-6 py-3 font-semibold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {bannedIps.map((ban) => (
                                                <tr key={ban.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="px-6 py-3 font-mono font-bold text-red-500">{ban.ipAddress}</td>
                                                    <td className="px-6 py-3 text-muted-foreground max-w-[200px] truncate" title={ban.reason}>{ban.reason}</td>
                                                    <td className="px-6 py-3">
                                                        <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-500 border-red-500/20">
                                                            {ban.attemptCount} strikes
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-3 text-muted-foreground text-xs">
                                                        {formatDistanceToNow(new Date(ban.createdAt), { addSuffix: true })}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleUnbanIp(ban.ipAddress)}
                                                            className="h-8 text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" /> Unban
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
