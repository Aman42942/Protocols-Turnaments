"use client";
import React from 'react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { Gamepad2, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function HeroSection() {
    return (
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-48">
            {/* Immersive Background Mesh & Floating Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-background">
                {/* Simplified background mesh - much better for performance */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-purple-500/10 pointer-events-none" />
                <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] bg-primary/5 rounded-full blur-[80px] pointer-events-none gpu-accel" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[100%] h-[100%] bg-purple-500/5 rounded-full blur-[80px] pointer-events-none gpu-accel" />

                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05]" />
            </div>

            <div className="container relative z-10 text-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-md px-4 py-2 text-[10px] sm:text-sm font-black text-primary mb-8 tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-primary mr-3 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                        Season 1 Registrations Open
                    </motion.div>

                    <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-8 text-foreground leading-[0.9] flex flex-col items-center">
                        <span className="block italic opacity-90">COMPETE.</span>
                        <span className="block text-primary drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">WIN.</span>
                        <span className="block text-3xl sm:text-4xl md:text-5xl font-bold tracking-widest mt-4 text-muted-foreground uppercase">Become a Legend.</span>
                    </h1>

                    <p className="mt-4 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed px-2">
                        The ultimate esports platform for competitive gamers. Join tournaments, climb the leaderboards, and win real cash prizes across your favorite titles.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-24 max-w-xs sm:max-w-none mx-auto">
                        <Link href="/tournaments" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-base font-black tracking-wider rounded-2xl shadow-[0_8px_25px_rgba(59,130,246,0.4)] hover:scale-105 transition-transform active:scale-95">
                                START BATTLE
                            </Button>
                        </Link>
                        <Link href="/about" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-10 text-base font-black tracking-wider rounded-2xl bg-background/50 backdrop-blur-sm border-border hover:bg-muted/50 transition-all">
                                ELITE ACCESS
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
                        {[
                            { icon: Trophy, title: "Huge Prize Pools", desc: "Compete for massive cash rewards in daily, weekly, and monthly tournament circuits.", color: "text-yellow-500", bg: "bg-yellow-500/10" },
                            { icon: Gamepad2, title: "Premium Titles", desc: "Official support for Valorant, BGMI, PUBG, and Free Fire with integrated stat tracking.", color: "text-blue-500", bg: "bg-blue-500/10" },
                            { icon: Users, title: "Pro Community", desc: "Join a community of 50,000+ competitive gamers. Find a team or build your own dynasty.", color: "text-purple-500", bg: "bg-purple-500/10" },
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + idx * 0.1 }}
                                className="p-8 rounded-[2.5rem] border border-border/50 bg-card/30 backdrop-blur-md hover:border-primary/30 transition-all duration-500 group relative overflow-hidden"
                            >
                                <div className={cn("p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-500", item.bg)}>
                                    <item.icon className={cn("w-8 h-8", item.color)} />
                                </div>
                                <h3 className="text-2xl font-black mb-3 italic tracking-tight">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed text-sm font-medium">{item.desc}</p>
                                {/* Decorative gradient hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
