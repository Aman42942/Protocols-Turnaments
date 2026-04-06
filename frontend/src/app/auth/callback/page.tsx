
'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ADMIN_ROLES } from '@/lib/roles';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Safety timeout to prevent infinite hang
        const timeout = setTimeout(() => {
            console.warn("Auth callback timed out, redirecting to dashboard");
            router.push('/dashboard');
        }, 10000);

        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('token', token);
            // Set cookie for Next.js Middleware (critical for admin protection)
            document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;

            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const user = {
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role || 'USER',
                    name: payload.name || 'User'
                };

                localStorage.setItem('user', JSON.stringify(user));
                window.dispatchEvent(new Event('auth-change'));

                // Admin Redirection Logic
                if (ADMIN_ROLES.includes(payload.role)) {
                    router.push('/admin');
                } else {
                    router.push('/dashboard');
                }
                clearTimeout(timeout);
            } catch (e) {
                console.error("Token decoding error", e);
                router.push('/dashboard');
                clearTimeout(timeout);
            }
        } else {
            router.push('/login');
            clearTimeout(timeout);
        }

        return () => clearTimeout(timeout);
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-neon-blue font-orbitron">Authenticating...</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackContent />
        </Suspense>
    );
}
