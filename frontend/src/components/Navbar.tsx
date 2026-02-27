"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Trophy } from 'lucide-react';
import { Button } from './ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { NotificationsMenu } from './NotificationsMenu';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const pathname = usePathname();
    const router = useRouter();

    const [announcements, setAnnouncements] = useState<any[]>([]);

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // Fetch real user data from API if token exists
        const token = localStorage.getItem('token');
        if (token) {
            import('@/lib/api').then(({ default: api }) => {
                api.get('/users/me').then((res) => {
                    const userData = res.data;
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                }).catch(() => {
                    // Token expired or invalid
                });
            });
        }

        // Fetch Announcements
        import('@/lib/api').then(({ default: api }) => {
            api.get('/content/announcements').then((res) => {
                setAnnouncements(res.data);
            }).catch(console.error);
        });

        // Listen for storage events (login/logout tabs)
        const handleStorageChange = () => {
            const updatedUser = localStorage.getItem('user');
            setUser(updatedUser ? JSON.parse(updatedUser) : null);
        };

        window.addEventListener('storage', handleStorageChange);
        // Custom event for same-tab updates
        window.addEventListener('auth-change', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('auth-change', handleStorageChange);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; max-age=0';
        setUser(null);
        window.dispatchEvent(new Event('auth-change'));
        router.push('/login');
    };

    const navLinks = [
        { name: 'Tournaments', href: '/tournaments' },
        ...(user ? [{ name: 'Wallet', href: '/dashboard/wallet' }] : []),
        { name: 'Leaderboard', href: '/leaderboard' },
        { name: 'About', href: '/about' },
    ];

    // Hide Navbar on Admin pages and Stealth Login
    if (pathname && (pathname.startsWith('/secure-admin-login') || pathname.startsWith('/admin'))) {
        return null;
    }

    return (
        <>
            {/* Announcements */}
            {announcements.length > 0 && (
                <div className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium text-center relative overflow-hidden">
                    <div className="animate-marquee whitespace-nowrap">
                        {announcements.map((a, i) => (
                            <span key={a.id} className="mx-4 inline-flex items-center gap-2">
                                <span className="uppercase text-[10px] bg-background/20 px-1 rounded">{a.type}</span>
                                {a.title}: {a.message}
                                {i < announcements.length - 1 && <span className="mx-4 text-primary-foreground/50">|</span>}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-6">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="bg-primary/10 p-1 rounded-lg">
                                <Trophy className="w-6 h-6 text-primary" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">
                                PROTOCOL
                            </span>
                        </Link>
                        <div className="hidden md:flex gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-primary",
                                        pathname === link.href ? "text-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4">
                            {user ? (
                                <>
                                    <NotificationsMenu />
                                    <UserMenu user={user} onLogout={handleLogout} />
                                </>
                            ) : (
                                <>
                                    <ThemeToggle />
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm">Log In</Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button size="sm">Sign Up</Button>
                                    </Link>
                                </>
                            )}
                        </div>

                        <div className="md:hidden flex items-center gap-2">
                            {user ? (
                                <>
                                    <NotificationsMenu />
                                    <UserMenu user={user} onLogout={handleLogout} />
                                </>
                            ) : (
                                <ThemeToggle />
                            )}
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground focus:outline-none"
                            >
                                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Optimized Mobile Drawer */}
                <div className={cn(
                    "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-300 md:hidden",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )} onClick={() => setIsOpen(false)}>
                    <div
                        className={cn(
                            "fixed inset-y-0 left-0 w-[280px] bg-background border-r shadow-2xl transition-transform duration-300 ease-out p-6",
                            isOpen ? "translate-x-0" : "-translate-x-full"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                                <div className="bg-primary/10 p-1 rounded-lg">
                                    <Trophy className="w-5 h-5 text-primary" />
                                </div>
                                <span className="text-lg font-bold tracking-tight">PROTOCOL</span>
                            </Link>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all",
                                        pathname === link.href
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {!user && (
                            <div className="absolute bottom-8 left-6 right-6 space-y-3">
                                <Link href="/login" onClick={() => setIsOpen(false)}>
                                    <Button variant="outline" className="w-full h-12 rounded-xl font-bold">Log In</Button>
                                </Link>
                                <Link href="/register" onClick={() => setIsOpen(false)}>
                                    <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20">Sign Up</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
}
