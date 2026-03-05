'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX, Maximize2, ExternalLink, Zap, Trophy, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AdSlide } from '@/context/CmsContext';
import { cn } from '@/lib/utils';

interface AdSliderProps {
    slides: AdSlide[];
}

export function AdSlider({ slides }: AdSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [muted, setMuted] = useState(true);
    const [imageMode, setImageMode] = useState<'cover' | 'contain'>('cover');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const activeSlides = slides.filter(s => s.isActive);

    useEffect(() => {
        if (activeSlides.length <= 1 || isPaused) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
        }, 6000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeSlides.length, isPaused, currentIndex]);

    if (activeSlides.length === 0) return null;

    const safeIndex = currentIndex >= activeSlides.length ? 0 : currentIndex;
    const currentSlide = activeSlides[safeIndex];
    const isVideo = currentSlide.mediaType === 'VIDEO';

    const handleNext = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
        setIsPaused(false);
    };
    const handlePrev = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
        setIsPaused(false);
    };

    return (
        <div
            className="relative w-full h-[280px] sm:h-[380px] md:h-[480px] overflow-hidden group border-b border-border bg-black"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide.id}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="absolute inset-0 w-full h-full"
                >
                    {/* ── BACKGROUND MEDIA ─────────────────────────── */}
                    {isVideo ? (
                        <div className="absolute inset-0 w-full h-full bg-black">
                            <video
                                src={currentSlide.mediaUrl}
                                autoPlay loop muted={muted} playsInline
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="absolute inset-0 w-full h-full">
                            {/* Blurred background version for contain mode */}
                            {imageMode === 'contain' && (
                                <div
                                    className="absolute inset-0 scale-110"
                                    style={{
                                        backgroundImage: `url(${currentSlide.mediaUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        filter: 'blur(20px) brightness(0.3)',
                                    }}
                                />
                            )}
                            {/* Main image */}
                            <img
                                src={currentSlide.mediaUrl}
                                alt={currentSlide.title}
                                className={cn(
                                    'absolute inset-0 w-full h-full transition-all duration-300',
                                    imageMode === 'cover'
                                        ? 'object-cover object-center'
                                        : 'object-contain object-center'
                                )}
                            />
                        </div>
                    )}

                    {/* ── GRADIENT OVERLAYS ─────────────────────────── */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent hidden md:block" />

                    {/* ── GAMING SCANLINE EFFECT ────────────────────── */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.03]"
                        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)' }}
                    />

                    {/* ── CORNER HUD DECORATIONS ────────────────────── */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary/60 z-10 hidden md:block" />
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary/60 z-10 hidden md:block" />
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary/40 z-10 hidden md:block" />
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary/40 z-10 hidden md:block" />

                    {/* ── SLIDE CONTENT ─────────────────────────────── */}
                    <div className="absolute inset-0 flex items-end md:items-center z-10">
                        <div className="container px-5 md:px-14 pb-14 md:pb-0">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.55 }}
                                className="max-w-xl space-y-3 md:space-y-4"
                            >
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 backdrop-blur-sm text-primary text-[10px] font-black uppercase tracking-widest">
                                    <motion.span
                                        animate={{ opacity: [1, 0.3, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="w-1.5 h-1.5 rounded-full bg-primary"
                                    />
                                    Sponsored
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-[0.9] text-white italic drop-shadow-xl">
                                    {currentSlide.title.toUpperCase()}
                                </h2>

                                {currentSlide.description && (
                                    <p className="text-sm md:text-base text-white/75 max-w-md font-medium leading-relaxed line-clamp-2 md:line-clamp-3">
                                        {currentSlide.description}
                                    </p>
                                )}

                                {/* CTA */}
                                {currentSlide.ctaLink && (
                                    <div className="flex flex-wrap gap-3 pt-2">
                                        <a
                                            href={currentSlide.ctaLink}
                                            target={currentSlide.openInNewTab ? '_blank' : '_self'}
                                            rel={currentSlide.openInNewTab ? 'noopener noreferrer' : ''}
                                        >
                                            <motion.div
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.96 }}
                                            >
                                                <Button
                                                    size="lg"
                                                    className="rounded-full px-7 h-11 font-black uppercase tracking-widest shadow-xl shadow-primary/30 text-sm"
                                                >
                                                    <Zap className="mr-2 h-4 w-4 fill-current" />
                                                    {currentSlide.ctaText || 'LEARN MORE'}
                                                </Button>
                                            </motion.div>
                                        </a>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>

                    {/* Slide number */}
                    <div className="absolute top-4 right-16 text-[10px] font-black text-white/30 tracking-widest z-10 hidden md:block">
                        {safeIndex + 1} / {activeSlides.length}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* ── TOP PROGRESS BAR ──────────────────────────────────── */}
            {!isPaused && activeSlides.length > 1 && (
                <div className="absolute top-0 left-0 w-full h-[3px] bg-white/10 z-30">
                    <motion.div
                        key={currentIndex}
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 6, ease: 'linear' }}
                        className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]"
                    />
                </div>
            )}

            {/* ── NAV ARROWS ──────────────────────────────────────────── */}
            {activeSlides.length > 1 && (
                <>
                    <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 z-20 hover:bg-primary hover:border-primary"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 z-20 hover:bg-primary hover:border-primary"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </motion.button>
                </>
            )}

            {/* ── BOTTOM CONTROLS ROW ────────────────────────────────── */}
            <div className="absolute bottom-5 left-0 right-0 flex items-center justify-between px-5 md:px-14 z-20">
                {/* Dot indicators */}
                <div className="flex gap-1.5">
                    {activeSlides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={cn(
                                'h-1.5 rounded-full transition-all duration-400',
                                safeIndex === i ? 'w-8 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]' : 'w-1.5 bg-white/30 hover:bg-white/60'
                            )}
                        />
                    ))}
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1.5">
                    {/* Fit/Fill toggle */}
                    {!isVideo && (
                        <button
                            onClick={() => setImageMode(m => m === 'cover' ? 'contain' : 'cover')}
                            title={imageMode === 'cover' ? 'Switch to Fit (show full image)' : 'Switch to Fill'}
                            className="p-2 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-black/50 transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                        >
                            <Maximize2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{imageMode === 'cover' ? 'Fit' : 'Fill'}</span>
                        </button>
                    )}

                    {/* Mute for video */}
                    {isVideo && (
                        <button
                            onClick={() => setMuted(!muted)}
                            className="p-2 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 text-white/60 hover:text-white transition-all"
                        >
                            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
