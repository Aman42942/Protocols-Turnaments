'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import {
    Save, Loader2, Settings, Shield, QrCode, Globe,
    Bell, Palette, IndianRupee, CheckCircle
} from 'lucide-react';
import { ADMIN_ROLES } from '@/lib/roles';
import Link from 'next/link';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [upiDetails, setUpiDetails] = useState({ upiId: '', merchantName: '' });

    // Platform settings
    const [siteName, setSiteName] = useState('Protocol Tournament');
    const [maxTeamSize, setMaxTeamSize] = useState('5');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [minDeposit, setMinDeposit] = useState('10');
    const [minWithdraw, setMinWithdraw] = useState('100');
    const [autoApproveDeposits, setAutoApproveDeposits] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            window.location.href = '/login';
            return;
        }

        try {
            const user = JSON.parse(userStr);
            if (!ADMIN_ROLES.includes(user.role)) {
                console.error('Unauthorized access attempt in Settings:', user.role);
                window.location.href = '/';
                return;
            }
        } catch {
            window.location.href = '/login';
            return;
        }

        const loadSettings = () => {
            fetchUpiDetails();
            fetchMaintenanceStatus();

            // Load other settings from localStorage
            const settings = localStorage.getItem('admin_settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                setSiteName(parsed.siteName || 'Protocol Tournament');
                setMaxTeamSize(parsed.maxTeamSize || '5');
                setMinDeposit(parsed.minDeposit || '10');
                setMinWithdraw(parsed.minWithdraw || '100');
                setAutoApproveDeposits(parsed.autoApproveDeposits || false);
            }
        };

        loadSettings();
    }, []); // Removed upiDetails.upiId to avoid Infinite loop, and categorized correctly

    const fetchMaintenanceStatus = async () => {
        try {
            const res = await api.get('/maintenance');
            setMaintenanceMode(res.data.isMaintenanceMode);
        } catch (error) {
            console.error('Failed to fetch maintenance status:', error);
        }
    };


    const fetchUpiDetails = async () => {
        try {
            const res = await api.get('/wallet/upi-details');
            setUpiDetails(res.data);
        } catch { }
    };

    const handleSave = async () => {
        setLoading(true);

        try {
            // 1. Save Maintenance Mode to Backend
            await api.post('/maintenance', { status: maintenanceMode });

            // 2. Save other settings to localStorage
            const settings = {
                siteName,
                maxTeamSize,
                minDeposit,
                minWithdraw,
                autoApproveDeposits,
            };
            localStorage.setItem('admin_settings', JSON.stringify(settings));

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const Toggle = ({ checked, onChange, label, desc }: { checked: boolean; onChange: () => void; label: string; desc: string }) => (
        <div className="flex items-center justify-between">
            <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
            <button
                onClick={onChange}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Settings className="h-8 w-8 text-primary" />
                        Platform Settings
                    </h1>
                    <p className="text-muted-foreground">Manage platform configuration and payment settings.</p>
                </div>
                <Button onClick={handleSave} disabled={loading} size="lg">
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : saved ? (
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    {saved ? 'Saved!' : 'Save All Settings'}
                </Button>
            </div>

            <div className="grid gap-6 max-w-3xl">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> General</CardTitle>
                        <CardDescription>Basic platform settings and branding.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Site Name</label>
                            <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Default Max Team Size</label>
                            <Input type="number" value={maxTeamSize} onChange={(e) => setMaxTeamSize(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><IndianRupee className="h-5 w-5" /> Payment & UPI</CardTitle>
                        <CardDescription>Configure payment and wallet settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <QrCode className="h-4 w-4 text-primary" />
                                Current UPI ID
                            </h4>
                            <p className="font-mono font-bold text-lg">{upiDetails.upiId || 'Not configured'}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Merchant: {upiDetails.merchantName || 'N/A'} · Set in backend .env file (UPI_ID)
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Minimum Deposit (₹)</label>
                                <Input type="number" value={minDeposit} onChange={(e) => setMinDeposit(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Minimum Withdrawal (₹)</label>
                                <Input type="number" value={minWithdraw} onChange={(e) => setMinWithdraw(e.target.value)} />
                            </div>
                        </div>
                        <Toggle
                            checked={autoApproveDeposits}
                            onChange={() => setAutoApproveDeposits(!autoApproveDeposits)}
                            label="Auto-Approve Deposits"
                            desc="Skip manual verification and auto-credit QR deposits. Not recommended."
                        />
                    </CardContent>
                </Card>

                {/* Security */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security & Access</CardTitle>
                        <CardDescription>Control platform availability and security.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Toggle
                            checked={maintenanceMode}
                            onChange={() => setMaintenanceMode(!maintenanceMode)}
                            label="Maintenance Mode"
                            desc="When enabled, users will see a maintenance page. Only admins can access."
                        />
                    </CardContent>
                </Card>

                {/* Quick Links */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Admin Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Link href="/admin/payments">
                                <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                                    <IndianRupee className="h-6 w-6" />
                                    <span className="text-xs">Payments</span>
                                </Button>
                            </Link>
                            <Link href="/admin/users">
                                <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                                    <Shield className="h-6 w-6" />
                                    <span className="text-xs">Users</span>
                                </Button>
                            </Link>
                            <Link href="/admin/tournaments/create">
                                <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                                    <Bell className="h-6 w-6" />
                                    <span className="text-xs">New Event</span>
                                </Button>
                            </Link>
                            <Link href="/admin/tournaments">
                                <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4">
                                    <Palette className="h-6 w-6" />
                                    <span className="text-xs">Events</span>
                                </Button>
                            </Link>
                            <Link href="/admin/settings/theme">
                                <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4 border-primary/50 bg-primary/5 hover:bg-primary/10">
                                    <Palette className="h-6 w-6 text-primary" />
                                    <span className="text-xs font-medium text-primary">Theme & UI</span>
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
