"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function ShareRedirectPage() {
    const params = useParams();
    const router = useRouter();
    const [error, setError] = useState('');

    useEffect(() => {
        if (params.shareCode) {
            api.get(`/tournaments/share/${params.shareCode}`)
                .then(res => {
                    if (res.data?.id) {
                        router.replace(`/tournaments/${res.data.id}`);
                    } else {
                        setError('Tournament not found');
                    }
                })
                .catch(() => setError('Invalid or expired tournament link'));
        }
    }, [params.shareCode, router]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-xl font-bold">😕 {error}</p>
                    <button onClick={() => router.push('/tournaments')} className="text-primary underline text-sm">
                        Browse all tournaments
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-muted-foreground">Loading tournament...</p>
            </div>
        </div>
    );
}
