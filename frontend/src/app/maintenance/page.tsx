'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Loader2, ShieldAlert, Clock, Fingerprint, Activity, Zap, Cpu, Gamepad2, Wrench, Shield, Database, Network, Terminal, Moon, Sun } from 'lucide-react';
import api from '@/lib/api';
import { useTheme } from 'next-themes';

// PARALLAX SHARD COMPONENT TO AVOID HOOKS IN LOOPS
const ParallaxShard = ({ dx, dy, i, theme }: { dx: any, dy: any, i: number, theme: string | undefined }) => {
    const xShift = useRef(Math.random() * 200 - 100);
    const yShift = useRef(Math.random() * 200 - 100);
    const left = useRef(Math.random() * 100);
    const top = useRef(Math.random() * 100);
    const size = useRef(Math.random() * 80 + 30);
    const duration = useRef(Math.random() * 10 + 10);
    const rotateDuration = useRef(Math.random() * 20 + 20);

    const x = useTransform(dx, [-500, 500], [-xShift.current, xShift.current]);
    const y = useTransform(dy, [-500, 500], [-yShift.current, yShift.current]);

    return (
        <motion.div
            style={{
                x, y,
                left: `${left.current}%`,
                top: `${top.current}%`,
                width: `${size.current}px`,
                height: `${size.current}px`,
                borderRadius: i % 4 === 0 ? '50%' : '8px',
            }}
            animate={{
                rotateZ: [0, 360],
                scale: [1, 1.2, 1],
                opacity: theme === 'light' ? [0.1, 0.4, 0.1] : [0.05, 0.2, 0.05]
            }}
            transition={{
                y: { duration: duration.current, repeat: Infinity, ease: "easeInOut" },
                rotateZ: { duration: rotateDuration.current, repeat: Infinity, ease: "linear" },
                scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
            className={`absolute pointer-events-none border backdrop-blur-[12px] transition-all duration-700 ${theme === 'light'
                ? 'border-black/[0.05] bg-white/[0.2] shadow-[0_8px_32px_rgba(0,0,0,0.03)]'
                : 'border-white/5 bg-white/[0.02]'
                }`}
        />
    );
};

export default function MaintenancePage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Ensure component is mounted for theme detection
    useEffect(() => { setMounted(true); }, []);

    // Config state
    const [config, setConfig] = useState({
        title: 'SYSTEM UPGRADE',
        message: 'We are currently deploying a massive update to enhance your gaming experience. Servers will be back online shortly.',
        endTime: '',
        showTimer: true,
        animations: true,
        colorPrimary: '#00E676', // We'll keep this as a base, but mix in full RGB
    });
    const [loading, setLoading] = useState(true);
    // Parallax values
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const dx = useSpring(mouseX, springConfig);
    const dy = useSpring(mouseY, springConfig);

    // Parallax layers (different depths)
    const bgParallaxX = useTransform(dx, [-500, 500], [-30, 30]);
    const bgParallaxY = useTransform(dy, [-500, 500], [-30, 30]);

    const coreParallaxX = useTransform(dx, [-500, 500], [-15, 15]);
    const coreParallaxY = useTransform(dy, [-500, 500], [-15, 15]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const x = clientX - window.innerWidth / 2;
        const y = clientY - window.innerHeight / 2;
        mouseX.set(x);
        mouseY.set(y);
    };

    // Timer state
    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
    const [timerExpired, setTimerExpired] = useState(false);
    const [scannedLines, setScannedLines] = useState<string[]>([]);

    useEffect(() => {
        // Fetch config
        const loadConfig = async () => {
            try {
                const res = await api.get('/maintenance');
                if (res.data) {
                    setConfig({
                        title: res.data.title || 'SYSTEM UPGRADE',
                        message: res.data.message || 'We are currently deploying a massive update to enhance your gaming experience. Servers will be back online shortly.',
                        endTime: res.data.endTime || '',
                        showTimer: res.data.showTimer ?? true,
                        animations: res.data.animations ?? true,
                        colorPrimary: res.data.colorPrimary || '#00E676',
                    });
                }
            } catch (err) { }
            finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, []);

    useEffect(() => {
        if (!config.endTime || !config.showTimer) return;

        const target = new Date(config.endTime).getTime();

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = target - now;

            if (distance < 0) {
                clearInterval(timer);
                setTimerExpired(true);
                setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
            } else {
                setTimeLeft({
                    d: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    s: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [config.endTime, config.showTimer]);

    useEffect(() => {
        const lines = [
            'CONNECTING TO PROTOCOL GATEWAY...',
            'VERIFYING ENCRYPTION KEYS...',
            'UPDATING CORE SHADERS...',
            'LINKING NEURAL NETWORK...',
            'BYPASSING FIREWALLS...',
            'OPTIMIZING PACKET FLOW...'
        ];
        let idx = 0;
        const interval = setInterval(() => {
            setScannedLines(prev => [...prev.slice(-4), lines[idx]]);
            idx = (idx + 1) % lines.length;
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    if (loading || !mounted) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-12 h-12 text-blue-500 animate-spin" /></div>;

    const isLight = theme === 'light';

    return (
        <div
            className={`relative min-h-screen transition-colors duration-700 ${isLight ? 'bg-gray-50 text-gray-900' : 'bg-[#050505] text-white'} overflow-hidden selection:bg-blue-500/30 flex items-center justify-center font-sans uppercase`}
            onMouseMove={handleMouseMove}
        >
            {/* Custom Tailwind animation definitions injected exclusively for this page */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes rgb-border {
                    0% { border-color: #ff0000; box-shadow: 0 0 20px #ff0000; }
                    20% { border-color: #ff00ff; box-shadow: 0 0 20px #ff00ff; }
                    40% { border-color: #0000ff; box-shadow: 0 0 20px #0000ff; }
                    60% { border-color: #00ffff; box-shadow: 0 0 20px #00ffff; }
                    80% { border-color: #00ff00; box-shadow: 0 0 20px #00ff00; }
                    100% { border-color: #ff0000; box-shadow: 0 0 20px #ff0000; }
                }
                @keyframes rgb-text {
                    0% { color: #ff0000; text-shadow: 0 0 20px #ff000060; }
                    20% { color: #ff00ff; text-shadow: 0 0 20px #ff00ff60; }
                    40% { color: #0000ff; text-shadow: 0 0 20px #0000ff60; }
                    60% { color: #00ffff; text-shadow: 0 0 20px #00ffff60; }
                    80% { color: #00ff00; text-shadow: 0 0 20px #00ff0060; }
                    100% { color: #ff0000; text-shadow: 0 0 20px #ff000060; }
                }
                @keyframes glitch-anim-1 {
                    0% { clip: rect(20px, 9999px, 85px, 0); transform: translate(0); }
                    20% { clip: rect(6px, 9999px, 47px, 0); transform: translate(-5px, 5px); }
                    40% { clip: rect(74px, 9999px, 83px, 0); transform: translate(5px, -5px); }
                    60% { clip: rect(15px, 9999px, 83px, 0); transform: translate(-5px, 5px); }
                    80% { clip: rect(8px, 9999px, 60px, 0); transform: translate(5px, -5px); }
                    100% { clip: rect(50px, 9999px, 50px, 0); transform: translate(0); }
                }
                .glitch-text {
                    position: relative;
                }
                .glitch-text::before, .glitch-text::after {
                    content: attr(data-text);
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0.8;
                }
                .glitch-text::before {
                    left: 2px;
                    text-shadow: -2px 0 #ff00c1;
                    clip: rect(44px, 450px, 56px, 0);
                    animation: glitch-anim-1 5s infinite linear alternate-reverse;
                }
                .glitch-text::after {
                    left: -2px;
                    text-shadow: -2px 0 #00fff9, 2px 2px #ff00c1;
                    animation: glitch-anim-1 5s infinite linear alternate-reverse;
                    animation-delay: -2.5s;
                }
                .rgb-border-anim {
                    animation: rgb-border 5s infinite linear;
                }
                .rgb-text-anim {
                    animation: rgb-text 5s infinite linear;
                }
                .scanline {
                    width: 100%;
                    height: 100px;
                    background: linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%);
                    opacity: 0.1;
                    position: absolute;
                    bottom: 100%;
                    animation: scanline 8s linear infinite;
                }
                @keyframes float-particle {
                    0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
                    50% { opacity: 0.5; }
                    100% { transform: translateY(-100vh) translateX(50px) rotate(360deg); opacity: 0; }
                }
                .particle {
                    position: absolute;
                    background: white;
                    border-radius: 50%;
                    pointer-events: none;
                    animation: float-particle 15s linear infinite;
                }
                @keyframes pulse-aura {
                    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                    50% { opacity: 0.3; }
                    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
                }
                @keyframes scanline {
                    0% { bottom: 100%; }
                    100% { bottom: -100px; }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
                .aura-ring {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    border: 2px solid var(--theme-primary);
                    border-radius: 50%;
                    pointer-events: none;
                    animation: pulse-aura 4s infinite ease-out;
                    opacity: ${isLight ? '0.08' : '0.2'};
                }
                .glass-card {
                    background: ${isLight ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'};
                    border: 1px solid ${isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)'};
                    backdrop-filter: blur(24px);
                    box-shadow: ${isLight ? '0 20px 50px rgba(0,0,0,0.04)' : '0 20px 50px rgba(0,0,0,0.5)'};
                }
                .frosted-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    pointer-events: none;
                    opacity: ${isLight ? '0.4' : '0.2'};
                }
            `}} />

            {/* AI'S CHOICE: ULTIMATE PREMIUM CYBER-ENGINE BACKGROUND */}
            <motion.div
                style={{ x: bgParallaxX, y: bgParallaxY }}
                className={`absolute inset-0 z-0 overflow-hidden transition-colors duration-700 ${isLight ? 'bg-white' : 'bg-[#050505]'}`}
            >
                {/* 1. Deep Space / Clean Sky Base Layer */}
                <motion.div
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className={`absolute inset-0 ${isLight ?
                        'bg-[radial-gradient(circle_at_50%_50%,rgba(245,248,255,1)_0%,rgba(230,235,250,1)_100%)]' :
                        'bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,40,1)_0%,rgba(5,5,10,1)_100%)]'}`}
                />

                {/* 1b. Light Mode Frosted Orbs */}
                {isLight && (
                    <>
                        <motion.div
                            animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
                            transition={{ duration: 20, repeat: Infinity }}
                            className="frosted-orb w-[600px] h-[600px] -top-48 -left-48"
                            style={{ background: `${config.colorPrimary}15` }}
                        />
                        <motion.div
                            animate={{ x: [0, -100, 0], y: [0, 50, 0] }}
                            transition={{ duration: 25, repeat: Infinity }}
                            className="frosted-orb w-[500px] h-[500px] -bottom-32 -right-32"
                            style={{ background: 'rgba(96, 165, 250, 0.15)' }}
                        />
                    </>
                )}

                {config.animations && (
                    <>
                        {/* 2. Fiber-Optic Light Trails (Enhanced) */}
                        {[...Array(15)].map((_, i) => (
                            <motion.div
                                key={`trail-${i}`}
                                initial={{ x: '-100%', y: `${Math.random() * 100}%`, opacity: 0 }}
                                animate={{ x: '300%', opacity: [0, 0.8, 0] }}
                                transition={{
                                    duration: Math.random() * 4 + 3,
                                    repeat: Infinity,
                                    delay: Math.random() * 15,
                                    ease: "linear"
                                }}
                                className="absolute h-[2px] w-[500px] bg-gradient-to-r from-transparent via-[var(--theme-primary)] to-transparent blur-[2px]"
                                style={{ backgroundColor: `${config.colorPrimary}40` }}
                            />
                        ))}

                        {/* 1. Digital Rain */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.05] flex justify-around">
                            {[...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ y: -100 }}
                                    animate={{ y: '100vh' }}
                                    transition={{
                                        duration: Math.random() * 5 + 5,
                                        repeat: Infinity,
                                        ease: "linear",
                                        delay: Math.random() * 5
                                    }}
                                    className="text-[var(--theme-primary)] font-mono text-xs writing-mode-vertical select-none"
                                    style={{ writingMode: 'vertical-rl' } as any}
                                >
                                    {Math.random().toString(36).substring(2, 15).toUpperCase()}
                                </motion.div>
                            ))}
                        </div>

                        {/* 3. Floating 3D Shards (Enhanced with mouse shift) */}
                        {[...Array(20)].map((_, i) => (
                            <ParallaxShard key={i} dx={dx} dy={dy} i={i} theme={theme} />
                        ))}

                        {/* 4. Central Pulsing Aura Rings (Premium Shift) */}
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={`aura-${i}`}
                                className="aura-ring"
                                style={{
                                    width: `${(i + 1) * 400}px`,
                                    height: `${(i + 1) * 400}px`,
                                    animationDelay: `${i * 1.5}s`,
                                    borderColor: `${config.colorPrimary}20`,
                                    borderWidth: '1px'
                                }}
                            />
                        ))}
                    </>
                )}

                {/* 6. Technical Scanline Overlay */}
                <div className="scanline" />
            </motion.div>

            {/* PERSISTENT HUD OVERLAY (Non-parallax) */}
            <div className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-700 ${isLight ? 'opacity-60' : 'opacity-40'}`}>
                {/* Top Left: System Stats */}
                <div className="absolute top-12 left-12 font-mono text-[10px] tracking-[0.2em] flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className={isLight ? 'text-gray-600' : 'text-white/60'}>SYSTEM STATUS: <span className={isLight ? 'text-gray-900' : 'text-white'}>OPTIMIZING</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Activity className="w-3 h-3" style={{ color: config.colorPrimary }} />
                        <span className={isLight ? 'text-gray-500' : 'text-white/40'}>BANDWIDTH: <span className={isLight ? 'text-gray-800' : 'text-white/80'}>9.4 GB/S</span></span>
                    </div>
                    <div className={`flex flex-col gap-1 px-2 py-1 border ${isLight ? 'border-black/5 bg-black/[0.02]' : 'border-white/5 bg-white/[0.02]'}`}>
                        <div className="flex items-center gap-3">
                            <Terminal className={`w-3 h-3 ${isLight ? 'text-black/40' : 'text-white/40'}`} />
                            <span className={isLight ? 'text-gray-500' : 'text-white/60'}>LOGS:</span>
                        </div>
                        <div className="flex flex-col">
                            {scannedLines.map((line, i) => (
                                <motion.span key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className={`text-[8px] truncate w-48 ${isLight ? 'text-black/30' : 'text-white/30'}`}>
                                    {line}
                                </motion.span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Right: Location/Time */}
                <div className={`absolute bottom-12 right-12 font-mono text-[10px] tracking-[0.3em] flex flex-col items-end gap-2 text-right ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                    <span>AZIMUTH: 45.28° N</span>
                    <span>ELEVATION: 104M</span>
                    <div className={`h-px w-32 my-1 ${isLight ? 'bg-gradient-to-l from-black/10 to-transparent' : 'bg-gradient-to-l from-white/20 to-transparent'}`} />
                    <span className={isLight ? 'text-gray-600' : 'text-white/60'}>PROTOCOL TOURNAMENTS © 2026</span>
                </div>

                {/* HUD Corners */}
                <div className={`absolute top-0 right-0 w-32 h-32 border-t border-r rounded-tr-3xl ${isLight ? 'border-black/5' : 'border-white/5'}`} />
                <div className={`absolute bottom-0 left-0 w-32 h-32 border-b border-l rounded-bl-3xl ${isLight ? 'border-black/5' : 'border-white/5'}`} />
            </div>

            <div className="container max-w-5xl px-4 relative z-30 flex flex-col items-center justify-center text-center">

                {/* ULTIMATE GOD-TIER CYBER CORE */}
                <motion.div
                    style={{ x: coreParallaxX, y: coreParallaxY }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="relative w-80 h-80 mb-12 flex items-center justify-center cursor-default shrink-0 group"
                >
                    {/* Background Massive Glow */}
                    <div className="absolute inset-0 rounded-full blur-[100px] animate-pulse" style={{ backgroundColor: `${config.colorPrimary}${isLight ? '10' : '15'}` }} />

                    {/* Complex Outer Machinery */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                        className={`absolute inset-0 rounded-full border border-dashed ${isLight ? 'border-black/[0.05]' : 'border-white/[0.03]'}`}
                    />

                    {/* Rotating Tech Rails */}
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-6 rounded-full border-2 border-transparent border-t-[var(--theme-primary)]/20 border-b-[var(--theme-primary)]/20"
                        style={{ borderColor: `${config.colorPrimary}30 transparent` }}
                    />

                    {/* The Shield HUD Component */}
                    <div className={`absolute inset-12 rounded-full border flex items-center justify-center ${isLight ? 'border-black/5' : 'border-white/10'}`}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-t-2 rounded-full"
                            style={{ borderTopColor: config.colorPrimary, opacity: 0.4 }}
                        />
                    </div>

                    {/* CENTRAL POWER UNIT */}
                    <motion.div
                        animate={{
                            y: [-10, 10, -10],
                            rotateX: [0, 15, -15, 0],
                            rotateY: [0, 20, -20, 0]
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="relative w-48 h-48 flex items-center justify-center z-10 transform-style-3d"
                    >
                        {/* High-Precision Hexagonal Frame */}
                        <div className={`absolute inset-0 backdrop-blur-3xl border border-white/10 rgb-border-anim [clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)] shadow-2xl ${isLight ? 'bg-white/40 shadow-blue-500/5' : 'bg-black/80'}`}>
                            {/* Inner Machined Detail */}
                            <div className={`absolute inset-1 [clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)] flex items-center justify-center ${isLight ? 'bg-white/80' : 'bg-[#0a0a0c]'}`}>
                                <div className={`w-full h-full opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] scale-50 ${isLight ? 'invert' : ''}`} />
                            </div>
                        </div>

                        {/* THE CORE GLYPH */}
                        <div className="relative flex flex-col items-center z-20">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="relative"
                            >
                                <Gamepad2 className={`w-24 h-24 drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] ${isLight ? 'text-gray-900' : 'text-white'}`} />
                                <div className="absolute -inset-4 blur-2xl -z-10 rounded-full animate-pulse" style={{ backgroundColor: `${config.colorPrimary}${isLight ? '20' : '30'}` }} />
                            </motion.div>

                            {/* Real-time Status Counter */}
                            <div className="mt-4 flex flex-col items-center">
                                <div className={`px-4 py-1.5 rounded-sm border flex items-center gap-2 overflow-hidden relative ${isLight ? 'bg-white border-black/10' : 'bg-black/90 border-white/10'}`}>
                                    <motion.div
                                        animate={{ width: ['0%', '100%'] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute left-0 bottom-0 h-[1px]"
                                        style={{ backgroundColor: config.colorPrimary, boxShadow: `0 0 10px ${config.colorPrimary}` }}
                                    />
                                    <Activity className="w-3 h-3 text-red-500 animate-pulse" />
                                    <span className={`text-[9px] font-bold tracking-[0.4em] ${isLight ? 'text-gray-700' : 'text-white/90'}`}>PROCESSING SYNC</span>
                                </div>
                                <motion.span
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className={`text-[7px] mt-1 font-mono tracking-widest ${isLight ? 'text-gray-400' : 'text-white/40'}`}
                                >
                                    HEX_ADDR: 0x{Math.random().toString(16).substring(2, 8).toUpperCase()}
                                </motion.span>
                            </div>
                        </div>

                        {/* Orbiting Satellite Data Drones */}
                        {[0, 120, 240].map((angle, i) => (
                            <motion.div
                                key={i}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "linear" }}
                                className="absolute w-full h-full pointer-events-none"
                                style={{ rotate: angle }}
                            >
                                <motion.div
                                    className="absolute left-1/2 -top-4 flex items-center gap-2"
                                    style={{ transform: `translateX(-50%) translateY(-110px)` }}
                                >
                                    <div className={`w-2 h-2 rounded-full ${isLight ? 'bg-gray-400 shadow-[0_0_10px_gray]' : 'bg-white shadow-[0_0_15px_white]'}`}>
                                        <div className="absolute inset-0 animate-ping rounded-full" style={{ backgroundColor: config.colorPrimary }} />
                                    </div>
                                    <div className={`w-12 h-[1px] ${isLight ? 'bg-black/5' : 'bg-white/10'}`} />
                                </motion.div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Holographic Assembly Volume Beams */}
                    <div className="absolute inset-0 [clip-path:circle(50%)] opacity-20">
                        <motion.div
                            animate={{ translateY: ['-100%', '100%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="w-full h-24 bg-gradient-to-b from-transparent via-white/50 to-transparent blur-[10px]"
                        />
                    </div>
                </motion.div>

                {/* GLITCH TEXT HEADLINE */}
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-6xl md:text-8xl font-black tracking-tighter mb-6 uppercase italic glitch-text"
                    data-text={config.title}
                >
                    <span className={isLight ? 'text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500' : 'text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500'}>
                        {config.title}
                    </span>
                </motion.h1>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`relative px-8 py-6 backdrop-blur-xl rounded-2xl max-w-3xl mb-12 shadow-2xl glass-card transition-colors duration-700`}
                >
                    {/* Mini corner accents */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 rgb-border-anim rounded-tl-xl opacity-40" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 rgb-border-anim rounded-br-xl opacity-40" />

                    <p className={`text-lg md:text-xl font-medium leading-relaxed tracking-wide ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                        {config.message}
                    </p>
                </motion.div>

                {/* Cyberpunk RGB Countdown */}
                <AnimatePresence>
                    {config.showTimer && config.endTime && !timerExpired && (
                        <motion.div
                            initial={{ y: 20, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: 0.4 }}
                            className="flex justify-center gap-4 md:gap-8 mb-16"
                        >
                            {[
                                { label: 'DAYS', value: timeLeft.d },
                                { label: 'HRS', value: timeLeft.h },
                                { label: 'MIN', value: timeLeft.m },
                                { label: 'SEC', value: timeLeft.s }
                            ].map((item, i) => (
                                <div key={i} className="relative group perspective-[500px]">
                                    <div className={`relative border-y-2 border-transparent rgb-border-anim p-4 md:p-6 min-w-[90px] md:min-w-[140px] transform transition-transform duration-500 hover:rotate-x-[10deg] ${isLight ? 'bg-white shadow-lg' : 'bg-[#0a0a0a]'}`}>
                                        {/* Digital noise overlay */}
                                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

                                        <div className={`text-5xl md:text-7xl font-black font-mono tracking-tighter ${isLight ? 'text-gray-900' : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]'}`}>
                                            {item.value.toString().padStart(2, '0')}
                                        </div>
                                        <div className="text-[10px] md:text-xs rgb-text-anim font-bold tracking-[0.3em] mt-3">
                                            {item.label}
                                        </div>

                                        {/* Corner brackets inside */}
                                        <div className={`absolute top-2 left-2 w-2 h-2 border-t border-l ${isLight ? 'border-black/10' : 'border-white/20'}`} />
                                        <div className={`absolute bottom-2 right-2 w-2 h-2 border-b border-r ${isLight ? 'border-black/10' : 'border-white/20'}`} />
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {config.showTimer && config.endTime && timerExpired && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`py-6 px-12 border-2 border-transparent rgb-border-anim mb-16 backdrop-blur-md relative overflow-hidden group ${isLight ? 'bg-white/80' : 'bg-black/50'}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                            <p className="rgb-text-anim font-black tracking-[0.3em] uppercase flex items-center gap-3 text-2xl">
                                <Zap className="w-8 h-8 animate-ping" />
                                INITIATING LAUNCH SEQUENCE...
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Security Footer Status */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className={`mt-8 flex flex-wrap items-center justify-center gap-6 text-xs md:text-sm font-mono py-4 px-8 border shadow-2xl skew-x-[-10deg] ${isLight ? 'bg-white border-black/5 text-gray-400' : 'bg-[#0a0a0a] border-white/5 text-gray-500'}`}
                >
                    <div className="flex items-center gap-2 skew-x-[10deg]">
                        <ShieldAlert className="w-5 h-5 rgb-text-anim" />
                        <span>NETWORK: <span className="rgb-text-anim font-bold uppercase tracking-widest">OFFLINE</span></span>
                    </div>
                    <div className="w-1.5 h-1.5 bg-gray-300 rotate-45 hidden md:block" />
                    <div className="flex items-center gap-2 skew-x-[10deg]">
                        <Activity className="w-5 h-5" />
                        <span>PROTOCOL: <span className={isLight ? 'text-gray-900 font-bold tracking-widest' : 'text-white font-bold tracking-widest'}>STANDBY</span></span>
                    </div>
                </motion.div>

            </div>

            {/* FLOATING THEME TOGGLE BUTTON */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTheme(isLight ? 'dark' : 'light')}
                className={`fixed bottom-8 right-8 z-50 p-4 rounded-full shadow-2xl border flex items-center justify-center group ${isLight ? 'bg-white border-black/5 text-gray-900' : 'bg-black border-white/10 text-white'}`}
            >
                {isLight ? (
                    <Moon className="w-6 h-6 group-hover:rotate-[-20deg] transition-transform" />
                ) : (
                    <Sun className="w-6 h-6 group-hover:rotate-[180deg] transition-transform text-yellow-400" />
                )}
                {/* Outer spin ring */}
                <div className="absolute inset-0 rounded-full border border-dashed border-gray-400/20 animate-spin-slow" />
            </motion.button>

            {/* Bottom RGB Animated Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 overflow-hidden">
                <motion.div
                    animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                    className="w-full h-full bg-[linear-gradient(90deg,#ff0000,#ff00ff,#0000ff,#00ffff,#00ff00,#ffff00,#ff0000)] bg-[length:200%_auto]"
                />
            </div>
            <div className="absolute top-0 left-0 w-full h-1 overflow-hidden">
                <motion.div
                    animate={{ backgroundPosition: ['100% 50%', '0% 50%', '100% 50%'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                    className="w-full h-full bg-[linear-gradient(90deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] bg-[length:200%_auto]"
                />
            </div>
        </div>
    );
}
