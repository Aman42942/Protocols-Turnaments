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
import { AlertCircle, Loader2, IndianRupee, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import api from '@/lib/api';

interface WalletAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: { id: string; name: string; email: string } | null;
    onSuccess?: () => void;
}

export function WalletAdjustmentModal({ isOpen, onClose, user, onSuccess }: WalletAdjustmentModalProps) {
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('WITHDRAWAL');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!amount || Number(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }
        if (!reason.trim()) {
            setError('Please provide a reason for the adjustment');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.post(`/wallet/admin/adjust-balance/${user.id}`, {
                amount: Number(amount),
                type,
                reason: reason.trim()
            });

            if (onSuccess) onSuccess();
            onClose();
            // Reset form
            setAmount('');
            setReason('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to adjust balance');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-primary" />
                        Wallet Adjustment
                    </DialogTitle>
                    <DialogDescription>
                        Manually modify the balance for <strong>{user.name}</strong> ({user.email}).
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && (
                        <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-xs flex items-center gap-2 border border-destructive/20">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Adjustment Type</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant={type === 'DEPOSIT' ? 'default' : 'outline'}
                                className="h-12 flex items-center justify-center gap-2 border-green-500/20"
                                onClick={() => setType('DEPOSIT')}
                            >
                                <ArrowDownCircle className={`w-4 h-4 ${type === 'DEPOSIT' ? '' : 'text-green-500'}`} />
                                Add Funds
                            </Button>
                            <Button
                                type="button"
                                variant={type === 'WITHDRAWAL' ? 'default' : 'outline'}
                                className="h-12 flex items-center justify-center gap-2 border-red-500/20"
                                onClick={() => setType('WITHDRAWAL')}
                            >
                                <ArrowUpCircle className={`w-4 h-4 ${type === 'WITHDRAWAL' ? '' : 'text-red-500'}`} />
                                Deduct Funds
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (Coins)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="text-lg font-bold"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Adjustment</Label>
                        <Input
                            id="reason"
                            placeholder="e.g., Excessive refund correction, Special reward..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={loading}
                        />
                        <p className="text-[10px] text-muted-foreground">This reason will be visible in the transaction history.</p>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            variant={type === 'WITHDRAWAL' ? 'destructive' : 'default'}
                            className="font-bold min-w-[120px]"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Adjustment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
