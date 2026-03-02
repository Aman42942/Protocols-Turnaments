'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';

/**
 * MaintenanceWatcher: Polling component to detect real-time maintenance status transitions.
 */
export function MaintenanceWatcher() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Poll maintenance status every 20 seconds
        const checkMaintenance = async () => {
            try {
                // We use a simple fetch to avoid interceptors that might cause loops
                const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                const res = await fetch(`${backendUrl}/maintenance`, { cache: 'no-store' });

                if (res.ok) {
                    const data = await res.json();
                    const isMaintenance = data.isMaintenanceMode;

                    // REDIRECT LOGIC
                    const isMaintenancePage = pathname === '/maintenance';
                    const isSecureAdminPage = pathname?.startsWith('/secure-admin-login');
                    const isAdminRoute = pathname?.startsWith('/admin');

                    if (isMaintenance) {
                        // Site is down! Force users to maintenance page UNLESS they are on safe paths
                        if (!isMaintenancePage && !isSecureAdminPage && !isAdminRoute) {
                            window.location.href = '/maintenance';
                        }
                    } else {
                        // Site is UP! If user is stuck on maintenance page, send them home
                        if (isMaintenancePage) {
                            window.location.href = '/';
                        }
                    }
                }
            } catch (error) {
                // Silent fail - don't disrupt user if backend has a hiccup
            }
        };

        // Initial check
        checkMaintenance();

        // Set interval for continuous watching
        const interval = setInterval(checkMaintenance, 20000); // 20 seconds

        return () => clearInterval(interval);
    }, [pathname, router]);

    return null; // Side-effect only component
}
