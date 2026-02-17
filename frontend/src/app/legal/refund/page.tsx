'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function RefundPolicy() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-muted/30 py-12 px-4">
            <div className="container max-w-4xl mx-auto">
                <Button variant="ghost" className="mb-6" onClick={() => router.back()}>← Back</Button>

                <Card className="border-primary/10 shadow-xl">
                    <CardHeader className="bg-primary/5 border-b text-center py-10">
                        <CardTitle className="text-3xl font-black uppercase tracking-tighter">Refund & Cancellation Policy</CardTitle>
                        <p className="text-muted-foreground mt-2">Effective Date: February 15, 2026</p>
                    </CardHeader>
                    <CardContent className="p-8 prose prose-slate max-w-none">
                        <section className="mb-8">
                            <h3 className="text-xl font-bold mb-3">1. Tournament Entry Fees</h3>
                            <p>Entry fees for tournaments are generally non-refundable once the tournament has started or the brackets have been generated. This ensures stability and fairness for all participants.</p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-bold mb-3">2. Wallet Deposits</h3>
                            <p>Funds deposited into the Protocol Tournament wallet are intended for use within the platform. Refunds of wallet balance back to the original payment method are processed upon request, subject to a 5% processing fee.</p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-bold mb-3">3. Cancellations</h3>
                            <p>If a tournament is cancelled by the organizers for any reason (technical issues, lack of participants, etc.), 100% of the entry fee will be automatically credited back to the participants&apos; wallets.</p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-bold mb-3">4. Disqualification</h3>
                            <p>Participants disqualified for cheating, toxic behavior, or violating game-specific rules will NOT be eligible for a refund of their entry fee.</p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-bold mb-3">5. Processing Time</h3>
                            <p>Approved refunds are processed within 5-7 business days to the original payment source.</p>
                        </section>

                        <div className="mt-12 p-6 bg-muted rounded-xl border-2 border-dashed text-center">
                            <p className="font-bold">Need help with a refund?</p>
                            <p className="text-sm text-muted-foreground">Contact our support team at support@protocol.com or via the Support Hub.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
