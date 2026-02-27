"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trophy, Target, Zap, Calendar, Medal, MapPin, Link as LinkIcon, Github, Twitter, Twitch, Ghost, Loader2, LogOut, LayoutGrid, Award, ArrowRight, User, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BadgeShowcase } from '@/components/profile/BadgeShowcase';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';

export default function ProfilePage() {
    const [user, setUser] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [activityData, setActivityData] = React.useState<{ date: Date, count: number }[]>([]);
    const router = useRouter();

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const response = await api.get('/users/me');
                setUser(response.data);

                // Initialize Activity Data (Mocking consistency for now, will connect to match logs later)
                const data = Array.from({ length: 365 }, (_, i) => ({
                    date: new Date(Date.now() - (364 - i) * 24 * 60 * 60 * 1000),
                    count: 0 // Real-time means 0 if no matches yet
                }));
                setActivityData(data);
            } catch (error) {
                console.error('Profile fetch failed:', error);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                    <Loader2 className="w-12 h-12 text-primary" />
                </motion.div>
                <p className="mt-4 text-muted-foreground font-black tracking-widest uppercase text-[10px]">Loading Profile...</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background pb-32 md:pb-8">
            <div className="container mx-auto px-4 max-w-7xl pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Sidebar - Profile Header */}
                    <div className="lg:col-span-1 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Card className="border-border/40 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                                <div className="h-24 bg-gradient-to-br from-primary/30 via-purple-500/10 to-transparent relative">
                                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                                </div>

                                <CardContent className="pt-0 flex flex-col items-center text-center -mt-12 relative z-10 px-6 pb-8">
                                    <div className="relative group">
                                        <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-background bg-muted shadow-2xl group-hover:scale-105 transition-transform duration-500 relative">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                                    <User className="w-12 h-12 text-primary" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-background rounded-full shadow-lg" title="Online" />
                                    </div>

                                    <h2 className="text-2xl font-black tracking-tighter mt-4 italic">{user.name?.toUpperCase() || 'PLAYER'}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black tracking-widest uppercase text-[9px] px-2 py-0.5 rounded-lg">
                                            {user.role}
                                        </Badge>
                                        <span className="text-[10px] font-bold text-muted-foreground">#{user.id.slice(-4)}</span>
                                    </div>

                                    <div className="w-full grid grid-cols-1 gap-3 mt-8">
                                        <EditProfileDialog user={user} onUpdate={(updated) => setUser(updated)}>
                                            <Button className="rounded-2xl h-11 font-black tracking-widest uppercase text-[10px] shadow-lg shadow-primary/20 w-full">Edit Profile</Button>
                                        </EditProfileDialog>
                                        <Button
                                            variant="ghost"
                                            onClick={handleLogout}
                                            className="rounded-2xl h-11 font-black tracking-widest uppercase text-[10px] text-destructive hover:bg-destructive/10"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" /> Logout
                                        </Button>
                                    </div>

                                    <div className="w-full text-left space-y-4 pt-8 mt-8 border-t border-border/20">
                                        <div className="flex items-center text-xs font-bold text-muted-foreground group">
                                            <div className="p-2 rounded-xl bg-muted/50 mr-3 group-hover:bg-primary/10 transition-colors"><MapPin className="w-3.5 h-3.5" /></div>
                                            {user.country || 'Not Set'}
                                        </div>
                                        <div className="flex items-center text-xs font-bold text-muted-foreground group">
                                            <div className="p-2 rounded-xl bg-muted/50 mr-3 group-hover:bg-primary/10 transition-colors"><Calendar className="w-3.5 h-3.5" /></div>
                                            Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                        </div>
                                    </div>

                                    <div className="w-full pt-8">
                                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Game IDs</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {user.bgmiId && <Badge variant="secondary" className="bg-muted text-[8px] font-black rounded-lg">BGMI: {user.bgmiId}</Badge>}
                                            {user.freeFireId && <Badge variant="secondary" className="bg-muted text-[8px] font-black rounded-lg">FF: {user.freeFireId}</Badge>}
                                            {!user.bgmiId && !user.freeFireId && <p className="text-[9px] text-muted-foreground col-span-2">No IDs linked yet.</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Right Content - Stats & Activity */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Master Stats */}
                        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x">
                            {[
                                { label: 'Tournaments', value: user.teams?.length || 0, icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                                { label: 'Win Rate', value: '0%', icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
                                { label: 'Wallet', value: `₹${user.wallet?.balance || 0}`, icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            ].map((stat, i) => {
                                const Icon = stat.icon === Wallet ? Zap : stat.icon; // Quick fix if Wallet is not imported correctly, using Zap for now or ensuring imports
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * i }}
                                        className="snap-start shrink-0 min-w-[200px] md:min-w-0 md:flex-1"
                                    >
                                        <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden group hover:border-primary/20 transition-all">
                                            <CardContent className="p-6">
                                                <div className={cn("inline-flex p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-500", stat.bg)}>
                                                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                                                </div>
                                                <p className="text-3xl font-black tracking-tighter italic">{stat.value}</p>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Activity Heatmap - Premium LeetCode Style */}
                        <Card className="border-border/40 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-xl">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-xl font-black italic tracking-tight uppercase">Activity Stream</CardTitle>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Consistency is key to greatness</p>
                                </div>
                                <div className="p-3 rounded-2xl bg-primary/10">
                                    <Calendar className="w-5 h-5 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                                    {activityData.slice(-100).map((day, i) => ( // Show last 100 days for mobile focus
                                        <motion.div
                                            key={i}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: i * 0.005 }}
                                            className={cn(
                                                "w-3 h-3 rounded-full transition-all duration-300 hover:scale-150 hover:z-10 cursor-pointer",
                                                day.count === 0 ? 'bg-muted/30' : 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]'
                                            )}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/20">
                                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                        <span>Dormant</span>
                                        <div className="flex gap-1.5">
                                            <div className="w-2 rounded-full bg-muted/30" />
                                            <div className="w-2 rounded-full bg-primary/20" />
                                            <div className="w-2 rounded-full bg-primary" />
                                        </div>
                                        <span>Active</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-primary italic uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                                        Road to Glory • {activityData.filter(d => d.count > 0).length} Days Active
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Matches - Premium Empty State */}
                        <Card className="border-border/40 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-xl">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-black italic tracking-tight uppercase">Recent Matches</CardTitle>
                                    <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent className="min-h-[250px] flex flex-col items-center justify-center text-center px-8">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="space-y-4"
                                >
                                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 relative">
                                        <Ghost className="w-10 h-10 text-primary/40 animate-bounce" />
                                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 opacity-20" />
                                    </div>
                                    <h3 className="text-lg font-black uppercase tracking-tight">Become a Legend</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                                        Your battlefield is empty. Join your first tournament today to start your journey to the leaderboard.
                                    </p>
                                    <Button asChild className="mt-6 rounded-2xl h-11 px-8 font-black tracking-widest uppercase text-[10px] shadow-xl shadow-primary/30">
                                        <Link href="/tournaments">Find a Match <ArrowRight className="w-4 h-4 ml-2" /></Link>
                                    </Button>
                                </motion.div>
                            </CardContent>
                        </Card>

                        {/* Badges & Achievements */}
                        <div className="pt-6">
                            <BadgeShowcase user={user} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
