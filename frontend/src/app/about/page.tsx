"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Target, Users, Zap, Shield, Globe, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AboutPage() {
    const features = [
        {
            icon: <Target className="w-8 h-8 text-primary" />,
            title: "Competitive Integrity",
            description: "We prioritize fair play with advanced anti-cheat measures and strict tournament rules."
        },
        {
            icon: <Users className="w-8 h-8 text-primary" />,
            title: "Vibrant Community",
            description: "Join thousands of gamers. Connect, team up, and compete in a toxic-free environment."
        },
        {
            icon: <Zap className="w-8 h-8 text-primary" />,
            title: "Instant Rewards",
            description: "Automated prize distribution ensures you get your winnings immediately after the tournament."
        },
        {
            icon: <Shield className="w-8 h-8 text-primary" />,
            title: "Secure Platform",
            description: "Your data and payments are protected with state-of-the-art encryption and security protocols."
        },
        {
            icon: <Globe className="w-8 h-8 text-primary" />,
            title: "Global Tournaments",
            description: "Compete against players from around the world in our international server regions."
        },
        {
            icon: <Award className="w-8 h-8 text-primary" />,
            title: "Skill-Based Matching",
            description: "Our matchmaking system ensures you play against opponents of similar skill levels."
        }
    ];

    return (
        <div className="min-h-screen bg-background py-16">
            <div className="container mx-auto px-4">
                {/* Hero Section */}
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-extrabold tracking-tight"
                    >
                        We Are <span className="text-primary">PROTOCOL</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground"
                    >
                        The ultimate esports tournament platform designed for gamers, by gamers.
                        Elevate your game, compete for glory, and win real prizes.
                    </motion.p>
                </div>

                {/* Mission Section */}
                <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold">Our Mission</h2>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            At PROTOCOL, we believe that every gamer deserves a stage to showcase their skills.
                            Our mission is to democratize esports by providing a professional, accessible, and
                            rewarding platform for players of all levels.
                        </p>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            Whether you're a casual player looking for some weekend fun or a competitive
                            squad aiming for the top, PROTOCOL provides the infrastructure you need to succeed.
                        </p>
                        <div className="pt-4">
                            <Link href="/register">
                                <Button size="lg" className="rounded-full px-8">
                                    Join the Revolution
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4 translate-y-8">
                            <Card className="bg-muted/50 border-none shadow-none">
                                <CardContent className="p-6 flex flex-col items-center text-center">
                                    <h3 className="text-4xl font-bold text-primary mb-2">50K+</h3>
                                    <p className="text-sm text-muted-foreground">Active Players</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/50 border-none shadow-none">
                                <CardContent className="p-6 flex flex-col items-center text-center">
                                    <h3 className="text-4xl font-bold text-primary mb-2">$1M+</h3>
                                    <p className="text-sm text-muted-foreground">Prizes Won</p>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-4">
                            <Card className="bg-muted/50 border-none shadow-none">
                                <CardContent className="p-6 flex flex-col items-center text-center">
                                    <h3 className="text-4xl font-bold text-primary mb-2">500+</h3>
                                    <p className="text-sm text-muted-foreground">Daily Tournaments</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/50 border-none shadow-none">
                                <CardContent className="p-6 flex flex-col items-center text-center">
                                    <h3 className="text-4xl font-bold text-primary mb-2">4.8/5</h3>
                                    <p className="text-sm text-muted-foreground">User Rating</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Why Choose PROTOCOL?</h2>
                        <p className="text-muted-foreground">Built with the latest technology for a seamless experience</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <Card key={index} className="hover:border-primary/50 transition-colors duration-300">
                                <CardHeader>
                                    <div className="mb-4 bg-primary/10 w-fit p-3 rounded-xl">
                                        {feature.icon}
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="mt-24 text-center bg-primary/5 rounded-3xl p-12 lg:p-20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Start Your Journey?</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                        Create your account today and get free entry into your first rookie tournament.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register">
                            <Button size="lg" className="h-12 px-8 text-lg font-semibold w-full sm:w-auto">
                                Create Account
                            </Button>
                        </Link>
                        <Link href="/tournaments">
                            <Button variant="outline" size="lg" className="h-12 px-8 text-lg font-semibold w-full sm:w-auto bg-background">
                                Browse Tournaments
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
