"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Trophy, User, LogOut } from 'lucide-react';
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

                {/* Enhanced Mobile Drawer */}
                <div className={cn(
                    "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-all duration-300 md:hidden",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )} onClick={() => setIsOpen(false)}>
                    <div
                        className={cn(
                            "fixed inset-y-0 left-0 w-[300px] bg-background shadow-[10px_0_40px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-out flex flex-col",
                            isOpen ? "translate-x-0" : "-translate-x-full"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between p-6 border-b">
                            <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                                <div className="bg-primary/10 p-1.5 rounded-lg">
                                    <Trophy className="w-5 h-5 text-primary" />
                                </div>
                                <span className="text-xl font-bold tracking-tight">PROTOCOL</span>
                            </Link>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* User Profile Section in Drawer */}
                        {user ? (
                            <div className="p-6 bg-muted/30 border-b">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            user.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">{user.name}</h3>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <Link href="/profile" onClick={() => setIsOpen(false)}>
                                    <Button variant="outline" size="sm" className="w-full rounded-xl font-bold gap-2">
                                        <User className="w-4 h-4" /> View Profile
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="p-6 border-b bg-primary/5">
                                <p className="text-sm font-medium mb-3">Welcome to Protocol!</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Link href="/login" onClick={() => setIsOpen(false)}>
                                        <Button variant="outline" size="sm" className="w-full rounded-xl">Log In</Button>
                                    </Link>
                                    <Link href="/register" onClick={() => setIsOpen(false)}>
                                        <Button size="sm" className="w-full rounded-xl">Join</Button>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Navigation Links */}
                        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-base font-bold transition-all",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                        )}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Bottom Actions */}
                        {user && (
                            <div className="p-6 border-t bg-muted/20">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        handleLogout();
                                    }}
                                    className="flex items-center gap-3 text-red-500 font-bold w-full px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
}
