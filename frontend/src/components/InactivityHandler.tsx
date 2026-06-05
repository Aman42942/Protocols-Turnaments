"use client";

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export function InactivityHandler({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const logout = () => {
        // Clear session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Only redirect and toast if not already on public pages
        const publicPages = ['/login', '/register', '/'];
        if (!publicPages.includes(pathname)) {
            toast.error('Session expired due to inactivity');
            router.push('/login');
        }
    };

    const resetTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        
        // Only start timer if user is logged in
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            timerRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
        }
    };

    useEffect(() => {
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart'
        ];

        const handleActivity = () => resetTimer();

        // Initial setup
        resetTimer();

        // Add listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Cleanup
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [pathname]); // Reset timer on route change as well

    return <>{children}</>;
}
