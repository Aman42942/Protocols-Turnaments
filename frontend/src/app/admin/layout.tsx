'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Loader2, ShieldAlert, Menu, Trophy, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getRoleColor, ROLE_LABELS, UserRole, ADMIN_ROLES } from '@/lib/roles';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            setStatus('unauthorized');
            router.replace('/login');
            return;
        }

        try {
            const userData = JSON.parse(userStr);
            // Check if user has ANY admin role
            if (!ADMIN_ROLES.includes(userData.role)) {
                setStatus('unauthorized');
                router.replace('/');
                return;
            }
            setUser(userData);
            setStatus('authorized');
        } catch {
            setStatus('unauthorized');
            router.replace('/login');
        }
    }, [router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (status === 'unauthorized') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3 text-center p-8">
                    <ShieldAlert className="h-12 w-12 text-destructive" />
                    <h2 className="text-xl font-bold">Access Denied</h2>
                    <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* Mobile Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                    <div className="flex flex-1 items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        <span className="font-bold text-sm">ADMIN PANEL</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 md:p-8 bg-muted/10">
                    {children}
                </main>
            </div>
        </div>
    );
}
