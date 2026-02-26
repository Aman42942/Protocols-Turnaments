"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Trophy, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { NotificationsMenu } from './NotificationsMenu';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [hidden, setHidden] = useState(false);
    const { scrollY } = useScroll();
    const pathname = usePathname();
    const router = useRouter();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        if (previous !== undefined && latest > previous && latest > 150) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });

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

            <motion.nav
                variants={{
                    visible: { y: 0, opacity: 1 },
                    hidden: { y: "-100%", opacity: 0 }
                }}
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40"
            >
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
            </motion.nav>

            {/* Optimized Mobile Menu Overlay */}
            <div className={cn(
                "fixed inset-0 z-[100] md:hidden transition-all duration-300",
                isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}>
                {/* Backdrop with blur */}
                <div
                    className="absolute inset-0 bg-background/60 backdrop-blur-md"
                    onClick={() => setIsOpen(false)}
                />

                {/* Menu Content */}
                <div
                    className={cn(
                        "absolute inset-y-0 left-0 w-full sm:w-[400px] bg-background border-r border-border shadow-2xl transition-transform duration-300 ease-out flex flex-col",
                        isOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    <div className="flex h-16 items-center justify-between px-6 border-b border-border">
                        <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                            <div className="bg-primary/10 p-1 rounded-lg">
                                <Trophy className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-lg font-bold tracking-tight">PROTOCOL</span>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-8 px-6 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-4 rounded-2xl text-lg font-bold transition-all group",
                                    pathname === link.href
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                                onClick={() => setIsOpen(false)}
                            >
                                <ChevronRight className={cn(
                                    "w-5 h-5 transition-transform",
                                    pathname === link.href ? "translate-x-0" : "-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                                )} />
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="p-6 border-t border-border bg-muted/30">
                        {user ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                        {user.name && user.name[0]}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bold text-sm truncate">{user.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase truncate">{user.role}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl font-bold border-destructive/20 text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                        handleLogout();
                                        setIsOpen(false);
                                    }}
                                >
                                    Log Out
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Link href="/login" className="block" onClick={() => setIsOpen(false)}>
                                    <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-border">Log In</Button>
                                </Link>
                                <Link href="/register" className="block" onClick={() => setIsOpen(false)}>
                                    <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20">Sign Up</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
