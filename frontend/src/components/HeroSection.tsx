"use client";
import React from 'react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { Gamepad2, Trophy, Users } from 'lucide-react';
import Link from 'next/link';

export function HeroSection() {
    return (
        <section className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-48">
            {/* Background Gradient Mesh */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-background">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] opacity-20 dark:opacity-40" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/20 rounded-full blur-[120px] opacity-20 dark:opacity-40" />
            </div>

            <div className="container relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
                        <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                        Season 1 Registrations Open
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 dark:from-white dark:to-white/70">
                        Compete. Win. <br />
                        <span className="text-primary">Become a Legend.</span>
                    </h1>

                    <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                        The ultimate esports platform for competitive gamers. Join tournaments, climb the leaderboards, and win real cash prizes across your favorite titles.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                        <Link href="/tournaments">
                            <Button size="lg" className="w-full sm:w-auto text-base px-8 h-12 shadow-lg shadow-primary/20">
                                Join Tournament
                            </Button>
                        </Link>
                        <Link href="/tournaments">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 h-12">
                                View Matches
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
                        <div className="p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group shadow-sm hover:shadow-md">
                            <div className="bg-primary/10 p-3 rounded-xl w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                                <Trophy className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Huge Prize Pools</h3>
                            <p className="text-muted-foreground leading-relaxed">Compete for massive cash rewards in daily, weekly, and monthly tournament circuits.</p>
                        </div>
                        <div className="p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group shadow-sm hover:shadow-md">
                            <div className="bg-primary/10 p-3 rounded-xl w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                                <Gamepad2 className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Premium Titles</h3>
                            <p className="text-muted-foreground leading-relaxed">Official support for Valorant, BGMI, PUBG, and Free Fire with integrated stat tracking.</p>
                        </div>
                        <div className="p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group shadow-sm hover:shadow-md">
                            <div className="bg-primary/10 p-3 rounded-xl w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                                <Users className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Pro Community</h3>
                            <p className="text-muted-foreground leading-relaxed">Join a community of 50,000+ competitive gamers. Find a team or build your own dynasty.</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
