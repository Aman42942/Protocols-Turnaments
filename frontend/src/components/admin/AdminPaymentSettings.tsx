'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Save, QrCode, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

export function AdminPaymentSettings() {
    const [upiId, setUpiId] = useState('');
    const [merchantName, setMerchantName] = useState('');
    const [walletTopupEnabled, setWalletTopupEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/wallet/upi-details');
            setUpiId(res.data.upiId);
            setMerchantName(res.data.merchantName);

            // Fetch topup enabled state
            const topupRes = await api.get('/cms/content/WALLET_TOPUP_ENABLED');
            setWalletTopupEnabled(topupRes.data?.value === 'true');
        } catch (err) {
            console.error('Failed to fetch UPI settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await Promise.all([
                api.post('/wallet/admin/upi-settings', { upiId, merchantName }),
                api.put('/cms/content', {
                    items: [{ key: 'WALLET_TOPUP_ENABLED', value: walletTopupEnabled.toString() }]
                })
            ]);
            setMessage({ type: 'success', text: 'Payment settings updated successfully!' });
            // Clear message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update settings' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    UPI QR Settings (Manual Payment)
                </CardTitle>
                <CardDescription>
                    Configure the UPI ID where emergency manual payments should be sent.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold">UPI ID (VPA)</label>
                            <Input
                                placeholder="e.g. username@paytm"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                className="h-12 border-2"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                This ID will be used to generate the QR code and deep links for users.
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-semibold">Merchant / Display Name</label>
                            <Input
                                placeholder="e.g. Protocol Tournament Support"
                                value={merchantName}
                                onChange={(e) => setMerchantName(e.target.value)}
                                className="h-12 border-2"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                The name that will appear in the user's payment app when they scan the QR.
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border/50">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${walletTopupEnabled ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Enable Wallet Topup</p>
                                    <p className="text-[10px] text-muted-foreground">Allows users to add coins to their balance</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setWalletTopupEnabled(!walletTopupEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${walletTopupEnabled ? 'bg-green-500' : 'bg-muted'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${walletTopupEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-700 dark:text-yellow-500">
                            <p className="font-bold mb-1">Important Note:</p>
                            <p>Users will see these details instantly upon saving. Please verify the UPI ID is correct to avoid payment failures.</p>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                            }`}>
                            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 font-bold text-lg"
                        disabled={saving}
                    >
                        {saving ? (
                            <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Saving...</>
                        ) : (
                            <><Save className="h-5 w-5 mr-2" /> Save Changes</>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
