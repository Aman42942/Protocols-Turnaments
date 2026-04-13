"use client";
import React from 'react';
import { Check, Zap, Award, Crown, Coins, ShieldCheck, Gamepad2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';

const PricingPage = () => {
    const tiers = [
        {
            name: "ROOKIE",
            price: "FREE",
            description: "Perfect for beginners exploring the arena.",
            features: [
                "Access to Free Tournaments",
                "Basic Profile Customization",
                "Standard Leaderboard Entry",
                "Join Up to 3 Teams"
            ],
            cta: "Get Started",
            highlight: false
        },
        {
            name: "ELITE",
            price: "₹99",
            period: "/month",
            description: "For serious gamers aiming for the top.",
            features: [
                "Lower Platform Fee (5%)",
                "Exclusive Elite Badge",
                "Priority Support",
                "Join Unlimited Teams",
                "Access to Elite-only Rooms"
            ],
            cta: "Upgrade to Elite",
            highlight: true
        },
        {
            name: "PRO",
            price: "₹199",
            period: "/month",
            description: "Ultimate benefits for competitive professionals.",
            features: [
                "Zero Platform Fee (0%)",
                "Verified Pro Badge",
                "Early Entry to Major Tournaments",
                "Custom Team Branding",
                "Dedicated Account Manager"
            ],
            cta: "Go Pro",
            highlight: false
        }
    ];

    const coinPacks = [
        { coins: 100, price: "₹100", bonus: "0% Bonus" },
        { coins: 500, price: "₹450", bonus: "10% Off", hot: true },
        { coins: 1000, price: "₹850", bonus: "15% Off" },
        { coins: 5000, price: "₹4000", bonus: "20% Off", best: true },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-primary selection:text-white pb-12">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 py-20 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-500">
                            Power Up Your <span className="text-primary italic">Gaming Experience</span>
                        </h1>
                        <p className="text-slate-400 text-lg md:text-xl">
                            Choose the plan that fits your ambition. From rookie to professional, we provide the tools you need to dominate.
                        </p>
                    </motion.div>
                </div>

                {/* Membership Tiers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    {tiers.map((tier, idx) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            className={`relative rounded-2xl border ${tier.highlight ? 'border-primary bg-primary/5' : 'border-slate-800 bg-slate-900/50'} backdrop-blur-xl p-8 flex flex-col`}
                        >
                            {tier.highlight && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-primary/20">
                                    <Crown className="w-3 h-3" /> Popular Choice
                                </div>
                            )}
                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-2 tracking-wide">{tier.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-extrabold">{tier.price}</span>
                                    <span className="text-slate-500 text-sm font-medium">{tier.period}</span>
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed">{tier.description}</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-grow">
                                {tier.features.map(feature => (
                                    <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                                        <div className={`mt-0.5 rounded-full p-0.5 ${tier.highlight ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-500'}`}>
                                            <Check className="w-3.5 h-3.5" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Button 
                                variant={tier.highlight ? "default" : "outline"} 
                                className={`w-full h-12 text-sm font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] ${tier.highlight ? 'shadow-lg shadow-primary/25' : ''}`}
                            >
                                {tier.cta}
                            </Button>
                        </motion.div>
                    ))}
                </div>

                {/* Coin Packs / Wallet Section */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 md:p-12 backdrop-blur-md mb-24">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="w-full md:w-1/3 text-center md:text-left">
                            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                                <Coins className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Protocol Credits</h2>
                            <p className="text-slate-400 leading-relaxed mb-6">
                                Standard currency for all paid tournaments. 1 Credit = ₹1. Top up instantly via UPI, NetBanking, or International Cards.
                            </p>
                            <Link href="/dashboard/wallet">
                                <Button className="gap-2 group">
                                    View Wallet <TrendingUp className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                        <div className="w-full md:w-2/3 grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {coinPacks.map((pack) => (
                                <div key={pack.coins} className={`relative p-6 rounded-2xl border ${pack.best ? 'border-primary/50 bg-primary/10' : 'border-slate-800 bg-slate-900'} text-center hover:border-slate-600 transition-colors group cursor-pointer`}>
                                    {pack.hot && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter italic">Hot 🔥</span>}
                                    {pack.best && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter italic">Best Value</span>}
                                    
                                    <div className="text-2xl font-bold mb-1 flex items-center justify-center gap-1">
                                        {pack.coins} <span className="text-xs text-slate-500">CR</span>
                                    </div>
                                    <div className="text-primary font-extrabold text-sm mb-2">{pack.price}</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider bg-slate-800 py-1 rounded-md group-hover:bg-slate-700 transition-colors">{pack.bonus}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 text-center">
                    <div className="p-6">
                        <div className="inline-flex p-3 rounded-xl bg-blue-500/10 text-blue-500 mb-4"><Zap className="w-6 h-6" /></div>
                        <h4 className="font-bold mb-2">Instant Payouts</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">Winnings are credited to your wallet immediately after match validation.</p>
                    </div>
                    <div className="p-6">
                        <div className="inline-flex p-3 rounded-xl bg-green-500/10 text-green-500 mb-4"><ShieldCheck className="w-6 h-6" /></div>
                        <h4 className="font-bold mb-2">Safe & Secure</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">Industry leading security with AES-256 encryption and direct gateway integration.</p>
                    </div>
                    <div className="p-6">
                        <div className="inline-flex p-3 rounded-xl bg-purple-500/10 text-purple-500 mb-4"><Gamepad2 className="w-6 h-6" /></div>
                        <h4 className="font-bold mb-2">Fair Play</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">Internal anti-cheat monitoring and manual verification for high-stakes matches.</p>
                    </div>
                    <div className="p-6">
                        <div className="inline-flex p-3 rounded-xl bg-orange-500/10 text-orange-500 mb-4"><Award className="w-6 h-6" /></div>
                        <h4 className="font-bold mb-2">Skill Badges</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">Earn badges as you climb tiers and show off your achievements on your profile.</p>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="text-center bg-gradient-to-br from-primary/10 to-blue-600/10 p-12 rounded-3xl border border-primary/20 backdrop-blur-xl max-w-4xl mx-auto">
                    <h3 className="text-3xl font-bold mb-4 italic">Ready to make your mark?</h3>
                    <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                        Join thousands of players competing daily for glory and rewards. Your esports legacy starts here.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/register">
                            <Button size="lg" className="px-8 font-bold h-14">Create Free Account</Button>
                        </Link>
                        <Link href="/tournaments">
                            <Button variant="outline" size="lg" className="px-8 font-bold h-14">Browse Tournaments</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
