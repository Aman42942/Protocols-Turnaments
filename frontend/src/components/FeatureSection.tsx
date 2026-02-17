"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Zap, Shield, Globe, Award } from 'lucide-react';

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
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Why Choose Protocol?</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Built by gamers, for gamers. We provide the most reliable and premium tournament experience in the industry.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <Card key={index} className="border-border/50 bg-background/50 hover:bg-background transition-colors duration-300">
                            <CardHeader>
                                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                    <feature.icon className="w-6 h-6 text-primary" />
                                </div>
                                <CardTitle className="text-lg">{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base">
                                    {feature.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
