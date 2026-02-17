import React from 'react';
import Link from 'next/link';
import { Trophy, Twitter, Instagram, Facebook, Youtube } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-background border-t border-border pt-16 pb-8 mt-auto">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="bg-primary/10 p-1 rounded-lg">
                                <Trophy className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">PROTOCOL</span>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            The world&apos;s leading esports tournament platform. Compete, win, and get paid instantly.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4">Platform</h4>
                        <ul className="space-y-2 text-muted-foreground text-sm">
                            <li><Link href="/tournaments" className="hover:text-primary transition-colors">Browse Tournaments</Link></li>
                            <li><Link href="/leaderboard" className="hover:text-primary transition-colors">Leaderboards</Link></li>
                            <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4">Support</h4>
                        <ul className="space-y-2 text-muted-foreground text-sm">
                            <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                            <li><Link href="/legal/refund" className="hover:text-primary transition-colors">Refund Policy</Link></li>
                            <li><Link href="/legal/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4">Legal</h4>
                        <ul className="space-y-2 text-muted-foreground text-sm">
                            <li><Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/legal/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-muted-foreground text-xs">
                        © 2026 Protocol Tournaments. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <Twitter className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                        <Instagram className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                        <Facebook className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                        <Youtube className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                    </div>
                </div>
            </div>
        </footer>
    );
}
