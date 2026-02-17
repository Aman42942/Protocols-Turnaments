'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>

            <h2 className="text-3xl font-bold tracking-tight mb-2">Something went wrong!</h2>
            <p className="text-muted-foreground max-w-md mb-8">
                We encountered an unexpected error. Our team has been notified.
                Please try respawning (refreshing) the page.
            </p>

            <div className="flex gap-4">
                <Button onClick={() => reset()} size="lg">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Try Again
                </Button>
                <Button variant="outline" size="lg" onClick={() => window.location.href = '/'}>
                    Return Home
                </Button>
            </div>
        </div>
    );
}
