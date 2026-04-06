'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Ghost, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
            <div className="w-32 h-32 bg-muted/20 rounded-full flex items-center justify-center mb-8 animate-pulse">
                <Ghost className="w-16 h-16 text-muted-foreground" />
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                404 <span className="text-primary">Page Not Found</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-md mb-8">
                The map you are looking for has been removed or doesn&apos;t exist.
                You might have taken a wrong turn in the lobby.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild variant="default" size="lg">
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Return Home
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                    <Link href="javascript:history.back()">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Link>
                </Button>
            </div>
        </div>
    );
}
