'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { AlertCircle, Loader2, ShieldCheck, IndianRupee, Globe } from 'lucide-react';
import api from '@/lib/api';

interface WithdrawalApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any | null;
    onSuccess?: () => void;
}

export function WithdrawalApprovalModal({ isOpen, onClose, transaction, onSuccess }: WithdrawalApprovalModalProps) {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transaction) return;
        if (!token || token.length !== 6) {
            setError('Please enter a valid 6-digit 2FA token');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.post(`/admin/ops/withdrawal/${transaction.id}/approve`, {
                twoFactorToken: token
            });

            if (onSuccess) onSuccess();
            onClose();
            setToken('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to approve withdrawal. Please verify your 2FA code.');
        } finally {
            setLoading(false);
        }
    };

    if (!transaction) return null;

    let metadata: any = {};
    try {
        if (transaction.metadata) metadata = JSON.parse(transaction.metadata);
    } catch (e) {
        console.error('Failed to parse metadata', e);
    }
    
    const currency = metadata.currency || transaction.currency || 'INR';
    const amount = metadata.realValue || (transaction.amount / (transaction.conversionRate || 1));

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                        Secure Withdrawal Approval
                    </DialogTitle>
                    <DialogDescription>
                        Confirm payment for <strong>{transaction.wallet?.user?.name || 'User'}</strong>.
                        This will trigger a real-time payout.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted/50 rounded-xl p-4 my-2 border border-border">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Payout Amount</span>
                        <div className="flex items-center gap-1 font-bold text-lg">
                            {currency === 'INR' ? <IndianRupee className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                            {Number(amount).toLocaleString()} {currency}
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Gateway</span>
                        <span className="font-semibold">{currency === 'INR' ? 'Cashfree' : 'PayPal'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-muted-foreground">Method</span>
                        <span className="font-mono text-xs">{transaction.method || 'N/A'}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {error && (
                        <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-xs flex items-center gap-2 border border-destructive/20">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="token" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Google Authenticator Code (2FA)
                        </Label>
                        <Input
                            id="token"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="000000"
                            maxLength={6}
                            value={token}
                            onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                            className="text-2xl tracking-[0.5em] font-black text-center h-14"
                            disabled={loading}
                            autoFocus
                        />
                        <p className="text-[10px] text-center text-muted-foreground italic">
                            Enter the 6-digit code from your authenticator app to authorize this payout.
                        </p>
                    </div>

                    <DialogFooter className="pt-4 grid grid-cols-2 gap-3 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="w-full">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || token.length !== 6}
                            className="w-full font-bold bg-primary hover:bg-primary/90"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authorize Payout'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
