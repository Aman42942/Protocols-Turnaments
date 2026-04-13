'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Scale } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LegalPageProps {
    cmsKey: string;
    title: string;
    subtitle: string;
    icon?: React.ReactNode;
    fallbackContent: string;
}

function LegalContent({ cmsKey, title, subtitle, icon, fallbackContent }: LegalPageProps) {
    const router = useRouter();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/cms/content/${cmsKey}`)
            .then(r => r.json())
            .then(data => {
                if (data?.value) {
                    setContent(data.value);
                    if (data.updatedAt) setLastUpdated(new Date(data.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
                } else {
                    setContent(fallbackContent);
                }
            })
            .catch(() => setContent(fallbackContent))
            .finally(() => setLoading(false));
    }, [cmsKey, fallbackContent]);

    return (
        <div className="min-h-screen bg-muted/30 py-10 px-4">
            <div className="container max-w-4xl mx-auto">
                <Button variant="ghost" className="mb-6 rounded-2xl" onClick={() => router.back()}>← Back</Button>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-border bg-card shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border px-8 py-12 text-center relative overflow-hidden">
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"
                            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                            transition={{ duration: 8, repeat: Infinity }}
                        />
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                                {icon || <Scale className="w-7 h-7 text-primary" />}
                            </div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter">{title}</h1>
                            <p className="text-muted-foreground mt-2 font-medium">{subtitle}</p>
                            {lastUpdated && (
                                <p className="text-xs text-muted-foreground/60 mt-3">Last updated: {lastUpdated}</p>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90 font-normal">
                                {content}
                            </pre>
                        )}
                    </div>
                </motion.div>

                <p className="text-center text-xs text-muted-foreground mt-8">
                    Protocol Tournament · All rights reserved
                </p>
            </div>
        </div>
    );
}

export default function LegalPage(props: LegalPageProps) {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <LegalContent {...props} />
        </Suspense>
    );
}
