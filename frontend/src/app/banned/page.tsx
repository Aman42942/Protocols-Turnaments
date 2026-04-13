'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function BannedPage() {
    const [bannedTitle, setBannedTitle] = useState('Access Restricted');
    const [bannedMessage, setBannedMessage] = useState('Your IP or Account has been permanently blocked due to suspicious activity. Our automated security protocols have restricted your access to the platform.');
    const [referenceId, setReferenceId] = useState('');

    useEffect(() => {
        // Read custom ban message from the global interceptor
        const title = localStorage.getItem('banned_title');
        const message = localStorage.getItem('banned_message');
        if (title) setBannedTitle(title);
        if (message) setBannedMessage(message);

        // Generate a random reference ID for support tracking
        setReferenceId(`ERR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    }, []);

    const handleContactSupport = () => {
        window.location.href = 'mailto:protocol.tournament.www@gmail.com?subject=Ban%20Appeal%20Request&body=Reference%20ID:%20' + referenceId;
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 overflow-hidden relative selection:bg-red-500/30">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/10 blur-[120px] rounded-full" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-600/5 blur-[100px] rounded-full" />
            </div>

            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] z-0 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] z-0 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-lg mt-8 mb-16"
            >
                {/* Decorative top border */}
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>

                <div className="bg-zinc-950/80 backdrop-blur-xl border border-red-900/30 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center">

                    {/* Animated Danger Stripes */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#dc2626_10px,#dc2626_20px)] opacity-50"></div>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        className="mx-auto w-24 h-24 bg-red-950/50 rounded-full flex items-center justify-center border border-red-800/50 shadow-[0_0_30px_rgba(220,38,38,0.2)] mb-8 relative"
                    >
                        <motion.div
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-full border border-red-500/30"
                        />
                        <ShieldAlert className="w-12 h-12 text-red-500" />
                    </motion.div>

                    <h1 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight text-white uppercase font-orbitron">
                        {bannedTitle.split('').map((char, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + (i * 0.02) }}
                            >
                                {char}
                            </motion.span>
                        ))}
                    </h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="space-y-6"
                    >
                        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                            {bannedMessage}
                        </p>

                        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4 flex items-start gap-3 text-left">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-red-400 font-semibold text-sm mb-1">What does this mean?</h3>
                                <p className="text-red-300/70 text-xs leading-normal">
                                    Your network IP or User Account has triggered our automated firewall protocols. Connectivity to Protocol Tournament servers from your location is now denied.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col items-center gap-2">
                            <p className="text-xs text-zinc-500 font-mono">Reference ID: {referenceId}</p>
                            <p className="text-xs text-zinc-600">Please provide this ID if you contact support.</p>
                        </div>

                        <div className="pt-6 flex justify-center">
                            <Button
                                onClick={handleContactSupport}
                                className="w-full sm:w-2/3 bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
                            >
                                Appeal Ban <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </motion.div>
                </div>

                {/* Decorative bottom border */}
                <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-red-900 to-transparent"></div>
            </motion.div>

            {/* Footer text */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-8 text-xs text-zinc-600 font-mono tracking-widest text-center"
            >
                PROTOCOL TOURNAMENT WAF SECURITY <br />
                &copy; {new Date().getFullYear()} ALL RIGHTS RESERVED
            </motion.p>
        </div>
    );
}
