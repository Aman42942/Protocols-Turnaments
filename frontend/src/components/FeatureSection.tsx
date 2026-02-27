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
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    },
    {
        title: "Anti-Cheat Systems",
        description: "Proprietary anti-cheat integration ensures fair play and a competitive environment.",
        icon: Shield,
        color: "text-primary",
        bg: "bg-primary/10"
    },
    {
        title: "Global Rankings",
        description: "Compete against the best players worldwide and climb the seasonal leaderboards.",
        icon: Globe,
        color: "text-blue-400",
        bg: "bg-blue-400/10"
    },
    {
        title: "Elite Badges",
        description: "Earn exclusive profile badges and rewards for your tournament achievements.",
        icon: Award,
        color: "text-yellow-500",
        bg: "bg-yellow-500/10"
    },
];

export function FeatureSection() {
    return (
        <section className="py-32 relative overflow-hidden bg-muted/20">
            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/2 rounded-full blur-[140px] -z-10" />

            <div className="container px-6">
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground italic">
                            WHY CHOOSE <span className="text-primary italic">PROTOCOL?</span>
                        </h2>
                        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-medium opacity-80">
                            Built by gamers, for gamers. We provide the most reliable and premium tournament experience in the industry.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <Card className="h-full border-border/40 bg-card/40 backdrop-blur-xl hover:border-primary/40 transition-all duration-500 rounded-[2.5rem] overflow-hidden group shadow-xl">
                                <CardHeader className="pt-10 px-8">
                                    <div className={cn(
                                        "w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner",
                                        feature.bg
                                    )}>
                                        <feature.icon className={cn("w-8 h-8", feature.color)} />
                                    </div>
                                    <CardTitle className="text-2xl font-black tracking-tight italic uppercase">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="px-8 pb-10">
                                    <CardDescription className="text-base font-medium leading-relaxed text-muted-foreground opacity-80">
                                        {feature.description}
                                    </CardDescription>
                                </CardContent>
                                {/* Bottom Accent Glow */}
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Helper for dynamic classes if missing in components
function cn(...inputs: any) {
    return inputs.filter(Boolean).join(' ');
}
