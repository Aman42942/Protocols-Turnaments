'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html>
            <body className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center font-sans">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                </div>

                <h2 className="text-3xl font-bold tracking-tight mb-2">Critical System Error</h2>
                <p className="text-muted-foreground max-w-md mb-8">
                    A critical error occurred in the root layout. Please try refreshing.
                </p>

                <Button onClick={() => reset()} size="lg">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Reset Application
                </Button>
            </body>
        </html>
    );
}
