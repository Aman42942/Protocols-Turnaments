'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, ExternalLink, Volume2, VolumeX } from 'lucide-react';
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
    }, [activeSlides.length, isPaused]);

    if (activeSlides.length === 0) return null;

    // Safety check for index
    const safeIndex = currentIndex >= activeSlides.length ? 0 : currentIndex;
    const currentSlide = activeSlides[safeIndex];

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
    };

    const isVideo = currentSlide.mediaType === 'VIDEO';

    return (
        <div
            className="relative w-full h-[300px] md:h-[450px] overflow-hidden group border-b"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide.id}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute inset-0 w-full h-full"
                >
                    {/* Background Media */}
                    {isVideo ? (
                        <div className="absolute inset-0 w-full h-full bg-black">
                            <video
                                src={currentSlide.mediaUrl}
                                autoPlay
                                loop
                                muted={muted}
                                playsInline
                                className="w-full h-full object-cover opacity-80"
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                                className="absolute bottom-6 right-6 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white z-20 hover:bg-black/60 transition-all"
                            >
                                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                            </button>
                        </div>
                    ) : (
                        <div
                            className="absolute inset-0 w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${currentSlide.mediaUrl})` }}
                        />
                    )}

                    {/* Overlays */}
                    <div className="absolute inset-0 bg-black/30 md:bg-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-transparent hidden md:block" />

                    {/* Content */}
                    <div className="absolute inset-0 flex items-center">
                        <div className="container px-4 md:px-12">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                                className="max-w-2xl space-y-4 md:space-y-6"
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest">
                                    <Play className="h-3 w-3 fill-current" /> Sponsored
                                </div>

                                <h2 className="text-2xl sm:text-3xl md:text-6xl font-black tracking-tighter leading-[0.9] text-white italic drop-shadow-2xl">
                                    {currentSlide.title.toUpperCase()}
                                </h2>

                                {currentSlide.description && (
                                    <p className="text-sm md:text-lg text-white/70 max-w-lg font-medium leading-relaxed line-clamp-2 md:line-clamp-none">
                                        {currentSlide.description}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-4 pt-4">
                                    {currentSlide.ctaLink && (
                                        <a
                                            href={currentSlide.ctaLink}
                                            target={currentSlide.openInNewTab ? "_blank" : "_self"}
                                            rel={currentSlide.openInNewTab ? "noopener noreferrer" : ""}
                                        >
                                            <Button size="lg" className="rounded-full px-8 h-12 font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                                                {currentSlide.ctaText || "LEARN MORE"}
                                                <ChevronRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {activeSlides.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/5 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:border-primary -translate-x-4 group-hover:translate-x-0 z-20"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/5 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:border-primary translate-x-4 group-hover:translate-x-0 z-20"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </>
            )}

            {/* Indicators / Progress */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {activeSlides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            currentIndex === i ? "w-8 bg-primary" : "w-1.5 bg-white/30"
                        )}
                    />
                ))}
            </div>

            {/* Glassy Progress Bar at Top */}
            {!isPaused && activeSlides.length > 1 && (
                <div className="absolute top-0 left-0 w-full h-1 bg-white/10 z-30">
                    <motion.div
                        key={currentIndex}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 6, ease: "linear" }}
                        className="h-full bg-primary"
                    />
                </div>
            )}
        </div>
    );
}
