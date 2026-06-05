'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, RotateCcw, Wallet, ExternalLink, ArrowRight } from 'lucide-react';

interface RefundSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    userName: string;
    destination: 'WALLET' | 'GATEWAY';
    orderId?: string;
}

export function RefundSuccessModal({ isOpen, onClose, amount, userName, destination, orderId }: RefundSuccessModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] bg-card border-primary/20 p-0 overflow-hidden rounded-3xl">
                <div className="relative overflow-hidden bg-primary/5 p-8 text-center border-b border-primary/10">
                    {/* Animated background element */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse delay-700" />
                    
                    <div className="relative flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center shadow-xl shadow-green-500/20 border border-green-500/30">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                    </div>

                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter mb-2">
                        Refund Successful
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-xs font-semibold">
                        The amount has been successfully processed to the target destination.
                    </DialogDescription>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">User Name</span>
                            <span className="font-bold">{userName}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Refund Amount</span>
                            <span className="font-black text-green-500">{amount.toLocaleString()} Coins</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Destination</span>
                            <div className="flex items-center gap-1.5 font-bold">
                                {destination === 'WALLET' ? (
                                    <>
                                        <Wallet className="w-3.5 h-3.5 text-primary" />
                                        User Wallet
                                    </>
                                ) : (
                                    <>
                                        <ExternalLink className="w-3.5 h-3.5 text-orange-500" />
                                        Original Source
                                    </>
                                )}
                            </div>
                        </div>
                        {orderId && (
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Reference</span>
                                <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">{orderId}</span>
                             </div>
                        )}
                    </div>

                    <div className="pt-2">
                        <Button 
                            className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 group"
                            onClick={onClose}
                        >
                            DONE
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
