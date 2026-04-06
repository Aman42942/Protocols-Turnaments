import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Database, Wifi, ShieldAlert } from 'lucide-react';

export default function LeaderboardEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 min-h-[50vh] relative overflow-hidden">
            {/* Background Grid - Adaptive Light/Dark */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:opacity-20 opacity-10" />

            {/* Central Hexagon Animation */}
            <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                {/* Outer Rotating Ring */}
                <motion.div
                    className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />

                {/* Inner Pulsing Circle */}
                <motion.div
                    className="absolute inset-4 border border-primary/50 rounded-full"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Core Icon */}
                <div className="relative z-10 bg-background/80 backdrop-blur-sm p-6 rounded-full border border-primary/20 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]">
                    <Database className="w-12 h-12 text-primary" />
                </div>

                {/* Orbiting Particles */}
                <motion.div
                    className="absolute w-full h-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                >
                    <div className="absolute top-0 left-1/2 -ml-1 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
                    <div className="absolute bottom-0 left-1/2 -ml-1 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]" />
                </motion.div>
            </div>

            {/* Status Text */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center z-10 max-w-md px-4"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-4">
                    <Wifi className="w-3 h-3 animate-pulse" />
                    <span>SYSTEM ONLINE // SCANNING FOR MATCHES</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-3 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">
                    Leaderboard Initializing
                </h2>

                <p className="text-muted-foreground mb-8">
                    Season 1 has officially begun. The global ranking system is active and awaiting the first combat results.
                </p>

                {/* Stats Grid Placeholder */}
                <div className="grid grid-cols-3 gap-4 text-center opacity-50">
                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                        <div className="text-2xl font-mono font-bold">0</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Matches</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                        <div className="text-2xl font-mono font-bold">0</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Players</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                        <div className="text-2xl font-mono font-bold">0</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Points</div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
