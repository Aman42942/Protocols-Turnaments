'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function TermsAndConditions() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-muted/30 py-12 px-4">
            <div className="container max-w-4xl mx-auto">
                <Button variant="ghost" className="mb-6" onClick={() => router.back()}>← Back</Button>

                <Card className="border-primary/10 shadow-xl">
                    <CardHeader className="bg-primary/5 border-b text-center py-10">
                        <CardTitle className="text-3xl font-black uppercase tracking-tighter">Terms & Conditions</CardTitle>
                        <p className="text-muted-foreground mt-2">Acceptance of Terms</p>
                    </CardHeader>
                    <CardContent className="p-8 prose prose-slate max-w-none">
                        <section className="mb-8">
                            <h3 className="text-xl font-bold mb-3">1. Eligibility</h3>
                            <p>Participants must be at least 13 years of age. Some cash tournaments may require participants to be 18+ depending on local jurisdiction.</p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-bold mb-3">2. Fair Play</h3>
                            <p>Cheating, using third-party software for competitive advantage, or &quot;stream-sniping&quot; is strictly prohibited and will result in a permanent ban and forfeiture of all winnings.</p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-bold mb-3">3. Platform Fees</h3>
                            <p>Protocol Tournament may charge a nominal service fee on entry fees and withdrawals to maintain the platform.</p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-bold mb-3">4. Dispute Resolution</h3>
                            <p>Tournament admins have the final say in all match-related disputes. Evidence (screenshots/recordings) must be provided for any claims.</p>
                        </section>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
