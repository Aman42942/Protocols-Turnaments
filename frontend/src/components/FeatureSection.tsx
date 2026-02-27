"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Zap, Shield, Globe, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
    {
        title: "Instant Payouts",
        description: "Winnings are transferred to your wallet immediately after the tournament concludes.",
        icon: Zap,
    },
    {
        title: "Anti-Cheat Systems",
        description: "Proprietary anti-cheat integration ensures fair play and a competitive environment.",
        icon: Shield,
    },
    {
        title: "Global Rankings",
        description: "Compete against the best players worldwide and climb the seasonal leaderboards.",
        icon: Globe,
    },
    {
        title: "Elite Badges",
        description: "Earn exclusive profile badges and rewards for your tournament achievements.",
        icon: Award,
    },
];

export function FeatureSection() {
    return (
        <section className="py-24 bg-muted/30">
            <div className="container">
                <div className="text-center mb-12">
                    <motion.h2
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-50px" }}
                        className="text-4xl md:text-5xl font-black tracking-tighter mb-4 italic"
                    >
                        PROTOCOL <span className="text-primary">EDGE</span>
                    </motion.h2>
                    <p className="text-muted-foreground text-sm font-medium max-w-xl mx-auto uppercase tracking-widest opacity-80">
                        The elite standard in competitive gaming infrastructure.
                    </p>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x md:grid md:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            viewport={{ once: true, amount: 0.2 }}
                            className="snap-center shrink-0 w-[280px] md:w-auto"
                        >
                            <Card className="h-full border-border/40 bg-card/60 backdrop-blur-sm hover:bg-card/80 hover:border-primary/40 transition-all duration-500 rounded-[2.5rem] overflow-hidden group will-change-transform translate-z-0">
                                <CardHeader className="pt-8 px-8">
                                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                                        <feature.icon className="w-8 h-8 text-primary" />
                                    </div>
                                    <CardTitle className="text-2xl font-black italic tracking-tight">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="px-8 pb-8">
                                    <CardDescription className="text-sm font-medium leading-relaxed text-muted-foreground">
                                        {feature.description}
                                    </CardDescription>
                                </CardContent>
                                {/* Decorative Gradient */}
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
