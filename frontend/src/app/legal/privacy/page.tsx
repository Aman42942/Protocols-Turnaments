'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicy() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-muted/30 py-12 px-4">
            <div className="container max-w-4xl mx-auto">
                <Button variant="ghost" className="mb-6" onClick={() => router.back()}>← Back</Button>

                <Card className="border-primary/10 shadow-xl">
                    <CardHeader className="bg-primary/5 border-b text-center py-10">
                        <CardTitle className="text-3xl font-black uppercase tracking-tighter">Privacy Policy</CardTitle>
                        <p className="text-muted-foreground mt-2">Last Updated: February 15, 2026</p>
                    </CardHeader>
                    <CardContent className="p-8 prose prose-slate max-w-none px">
                        <p>At Protocol Tournament, we take your privacy seriously. This policy describes how we collect, use, and protect your information.</p>

                        <section className="mb-8">
                            <h3 className="text-xl font-bold mb-3">1. Information We Collect</h3>
                            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                <li><strong>Account Info</strong>: Email, username, and encrypted password.</li>
                                <li><strong>Game Data</strong>: In-game IDs (e.g., Valorant Riot ID) for match verification.</li>
                                <li><strong>Payment Info</strong>: Transaction IDs and history. We do NOT store your full credit card or bank details; these are handled securely by Cashfree.</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-bold mb-3">2. How We Use Data</h3>
                            <p>We use your data to organize tournaments, verify match results, process winnings, and prevent fraud/cheating on the platform.</p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-bold mb-3">3. Data Security</h3>
                            <p>Your data is stored using industry-standard encryption. We never sell your personal information to third parties.</p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-bold mb-3">4. Cookies</h3>
                            <p>We use cookies to keep you logged in and remember your preferences.</p>
                        </section>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
