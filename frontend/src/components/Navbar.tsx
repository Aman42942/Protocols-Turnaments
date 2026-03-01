"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Trophy, User, LogOut, ChevronRight, LayoutDashboard, CreditCard, Users, Settings, Activity, ShieldCheck, Search, Home } from 'lucide-react';
import { Button } from './ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { NotificationsMenu } from './NotificationsMenu';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '@/lib/auth';
import { useCms } from '@/context/CmsContext';

// Final Verified Mobile Sidebar Navbar
interface SidebarLinkProps {
    href: string;
    icon: any;
    label: string;
    active: boolean;
    onClick: () => void;
}

function SidebarLink({ href, icon: Icon, label, active, onClick }: SidebarLinkProps) {
    return (
        <Link href={href} onClick={onClick}>
            <motion.div
                whileTap={{ scale: 0.98 }}
                className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
            >
                <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground/70")} />
                <span className="text-sm font-semibold">{label}</span>
                {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </motion.div>
        </Link>
    );
}

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const pathname = usePathname();
    const router = useRouter();
    const { getContent } = useCms();

    // Fallbacks to default values if CMS not loaded
    const logoUrl = getContent('LOGO_URL', '');
    const siteTitle = getContent('SITE_TITLE', 'PROTOCOL');

    const [announcements, setAnnouncements] = useState<any[]>([]);

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        const token = localStorage.getItem('token');
        if (token) {
            import('@/lib/api').then(({ default: api }) => {
                api.get('/users/me').then((res) => {
                    const userData = res.data;
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                }).catch(() => { });
            });
        }

        import('@/lib/api').then(({ default: api }) => {
            api.get('/content/announcements').then((res) => {
                setAnnouncements(res.data);
            }).catch(console.error);
        });

        const handleStorageChange = () => {
            const updatedUser = localStorage.getItem('user');
            setUser(updatedUser ? JSON.parse(updatedUser) : null);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('auth-change', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('auth-change', handleStorageChange);
        };
    }, []);

    const handleLogout = () => {
        logout();
        setUser(null);
        router.push('/login');
    };

    const navLinks = [
        { name: 'Home', href: '/', icon: Home },
        ...(user ? [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] : []),
        { name: 'Tournaments', href: '/tournaments', icon: Trophy },
        ...(user ? [{ name: 'Wallet', href: '/dashboard/wallet', icon: CreditCard }] : []),
        { name: 'Leaderboard', href: '/leaderboard', icon: Users },
        { name: 'About', href: '/about', icon: Settings },
    ];

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
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                            ) : (
                                <div className="bg-primary/10 p-1 rounded-lg">
                                    <Trophy className="w-6 h-6 text-primary" />
                                </div>
                            )}
                            <span className="text-xl font-bold tracking-tight uppercase">{siteTitle}</span>
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
            </nav>

            {/* ═══ PREMIUM MOBILE SIDEBAR (SPOTIFY STYLE) ══════════════ */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[10000] md:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-md dark:bg-black/80"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.35 }}
                            className="absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-background border-r border-border/50 shadow-2xl flex flex-col h-full overflow-hidden will-change-transform"
                        >
                            <div className="p-6 pb-2 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                            <Trophy className="w-5 h-5 text-black" />
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-lg font-black tracking-tighter text-foreground leading-none lowercase group-hover:first-letter:uppercase">p<span className="text-primary">{siteTitle.slice(1).toLowerCase()}</span></span>
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Esports Pro</span>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-muted text-muted-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>


                            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8 custom-scrollbar scroll-smooth">
                                <div className="space-y-1">
                                    <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">Dashboard</p>
                                    <SidebarLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === '/dashboard'} onClick={() => setIsOpen(false)} />
                                    <SidebarLink href="/" icon={Home} label="Hero Page" active={pathname === '/'} onClick={() => setIsOpen(false)} />
                                    <SidebarLink href="/tournaments" icon={Trophy} label="Tournament Arena" active={pathname === '/tournaments'} onClick={() => setIsOpen(false)} />
                                    <SidebarLink href="/leaderboard" icon={Activity} label="Leaderboards" active={pathname === '/leaderboard'} onClick={() => setIsOpen(false)} />
                                </div>

                                <div className="space-y-1">
                                    <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">Competition</p>
                                    <SidebarLink href="/tournaments?type=solo" icon={User} label="Solo Matchups" active={false} onClick={() => setIsOpen(false)} />
                                    <SidebarLink href="/dashboard/teams" icon={Users} label="My Teams" active={pathname === '/dashboard/teams'} onClick={() => setIsOpen(false)} />
                                </div>

                                <div className="space-y-1">
                                    <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">System</p>
                                    <SidebarLink href="/dashboard/wallet" icon={CreditCard} label="Wallet & Bank" active={pathname === '/dashboard/wallet'} onClick={() => setIsOpen(false)} />
                                    <SidebarLink href="/settings" icon={Settings} label="Member Settings" active={false} onClick={() => setIsOpen(false)} />
                                    <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-muted transition-all text-muted-foreground">
                                        <span className="text-sm font-semibold">Night Mode</span>
                                        <ThemeToggle />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 mt-auto border-t border-border/50 bg-muted/20 backdrop-blur-md shrink-0">
                                {user ? (
                                    <div className="flex items-center gap-3 px-2 py-2">
                                        <div className="relative shrink-0">
                                            <div className="rgb-avatar-border w-12 h-12">
                                                <div className="w-full h-full rounded-full bg-muted border-0 overflow-hidden flex items-center justify-center">
                                                    {user?.avatar ? (
                                                        <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="text-primary font-black text-xl">
                                                            {(user.name || 'P')[0].toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-foreground truncate uppercase tracking-tight">{user.name || 'Account'}</p>
                                            <p className="text-[10px] text-muted-foreground truncate font-bold uppercase tracking-widest">{user.email || 'Member'}</p>
                                        </div>
                                        <button onClick={handleLogout} className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all shadow-sm">
                                            <LogOut className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Link href="/login" className="w-full" onClick={() => setIsOpen(false)}>
                                            <Button variant="outline" className="w-full h-12 rounded-xl text-[10px] font-black tracking-widest bg-muted/50 border-border/50 text-foreground uppercase">LOG IN</Button>
                                        </Link>
                                        <Link href="/register" className="w-full" onClick={() => setIsOpen(false)}>
                                            <Button className="w-full h-12 rounded-xl text-[10px] font-black tracking-widest bg-primary text-black uppercase">JOIN NOW</Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
