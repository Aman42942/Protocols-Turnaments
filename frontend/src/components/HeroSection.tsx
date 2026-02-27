"use client";
import React from 'react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { Trophy, Gamepad2, Users, Rocket, Target, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function HeroSection() {
    return (
        <section className="relative overflow-hidden pt-24 pb-32 md:pt-40 md:pb-48 bg-background">
            {/* Elite Background Mesh - Protocol Blue Theme */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-background">
                <div className="absolute top-[-10%] left-[-10%] w-[100%] h-[100%] bg-primary/5 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-blue-600/5 rounded-full blur-[140px]" />
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] opacity-40" />
            </div>

            <div className="container relative z-10 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-5xl mx-auto text-center"
                >
                    {/* Elite Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-md px-5 py-2 text-[11px] font-black text-primary mb-12 tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(var(--primary),0.1)]"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Season 1 Registrations Open
                    </motion.div>

                    <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.85] text-foreground">
                        <span className="block opacity-90 italic">COMPETE.</span>
                        <span className="block text-primary drop-shadow-[0_0_40px_rgba(var(--primary),0.25)]">WIN.</span>
                        <span className="block text-4xl md:text-6xl font-black tracking-widest mt-6 text-muted-foreground uppercase opacity-80">Become a Legend.</span>
                    </h1>

                    <p className="mt-8 text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
                        The ultimate esports platform for competitive gamers. Join tournaments, climb the leaderboards, and win real cash prizes across your favorite titles.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center mb-32 items-center">
                        <Link href="/tournaments" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto text-sm font-black px-12 h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_15px_40px_rgba(var(--primary),0.3)] hover:scale-105 transition-all">
                                <Zap className="w-5 h-4 mr-2 fill-current" />
                                START BATTLE
                            </Button>
                        </Link>
                        <Link href="/about" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm font-black px-12 h-16 rounded-[1.5rem] border-border/50 bg-background/50 hover:bg-muted/50 text-foreground backdrop-blur-sm transition-all">
                                ELITE ACCESS
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
                        <FeatureCard
                            icon={Trophy}
                            title="Elite Rewards"
                            desc="Compete for massive cash rewards in daily, weekly, and monthly tournament circuits."
                            color="var(--primary)"
                        />
                        <FeatureCard
                            icon={Gamepad2}
                            title="Premium Titles"
                            desc="Official support for Valorant, BGMI, PUBG, and Free Fire with integrated stat tracking."
                            color="var(--primary)"
                        />
                        <FeatureCard
                            icon={Users}
                            title="Pro Community"
                            desc="Join a community of 50,000+ competitive gamers. Find a team or build your own dynasty."
                            color="var(--primary)"
                        />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function FeatureCard({ icon: Icon, title, desc, color }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-[2.5rem] border border-border/20 bg-card/30 backdrop-blur-xl hover:border-primary/30 transition-all duration-500 group relative overflow-hidden h-full"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
            <div className="relative z-10">
                <div className="p-4 rounded-2xl bg-primary/10 w-fit mb-8 group-hover:scale-110 transition-transform duration-500">
                    <Icon className="w-8 h-8 text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]" />
                </div>
                <h3 className="text-2xl font-black mb-4 text-foreground tracking-tight italic">{title.toUpperCase()}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium opacity-80">{desc}</p>
            </div>
        </motion.div>
    );
}
