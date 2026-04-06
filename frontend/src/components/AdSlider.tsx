'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AdSlide } from '@/context/CmsContext';
import { cn } from '@/lib/utils';
import { Button } from './ui/Button';

interface AdSliderProps {
    slides: AdSlide[];
}

const SLIDE_DURATION = 7000;

export function AdSlider({ slides }: AdSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);


    const activeSlides = slides
        .filter(s => s.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, [activeSlides.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
    }, [activeSlides.length]);


    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };


    useEffect(() => {
        if (activeSlides.length <= 1 || isPaused) return;

        const interval = setInterval(nextSlide, SLIDE_DURATION);
        return () => clearInterval(interval);
    }, [isPaused, nextSlide, activeSlides.length]);


    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide]);

    if (!activeSlides.length) return null;

    const currentSlide = activeSlides[currentIndex];

    // Simple Fade variants
    const wrapperVariants = {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.5 } },
        exit: { opacity: 0, transition: { duration: 0.5 } }
    };

    const contentVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { delay: 0.2, duration: 0.4 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4 } }
    };


    return (
        <div 
            className="group relative w-full h-[300px] sm:h-[450px] md:h-[550px] bg-black overflow-hidden border-b border-border shadow-md"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >

            <AnimatePresence initial={false} mode="wait">
                <motion.div
                    key={currentIndex}
                    variants={wrapperVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute inset-0 w-full h-full"
                >

                    {/* Main Slide Link (Full Area) */}
                    <Link 
                        href={currentSlide.ctaLink || '/'} 
                        target={currentSlide.openInNewTab ? '_blank' : '_self'}
                        className="absolute inset-0 z-10 block group/slide"
                    >
                        {/* Media */}
                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                            {currentSlide.mediaType === 'VIDEO' ? (
                                <video
                                    src={currentSlide.mediaUrl}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/slide:scale-105"
                                />
                            ) : (
                                <Image
                                    src={currentSlide.mediaUrl}
                                    alt={currentSlide.title}
                                    fill
                                    priority={currentIndex === 0}
                                    className="object-cover object-center transition-transform duration-700 group-hover/slide:scale-105"
                                    sizes="100vw"
                                />
                            )}

                            {/* Premium Gradient Overlays (Tighter for clean focus) */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent hidden md:block" />

                            {/* Focus Blur Layer (Clean Linear Fade) */}
                            <div 
                                className="absolute inset-0 z-0 backdrop-blur-xl pointer-events-none"
                                style={{
                                    maskImage: 'linear-gradient(to right, black 0%, black 25%, transparent 60%)',
                                    WebkitMaskImage: 'linear-gradient(to right, black 0%, black 25%, transparent 60%)'
                                }}
                            />
                        </div>



                        {/* Content Layer */}
                        <div className="absolute inset-0 flex items-center">
                            <div className="container mx-auto px-6 md:px-16 w-full">
                                <motion.div 
                                    variants={contentVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="max-w-xl relative z-20 p-4 md:p-0"
                                >


                                    <motion.div variants={itemVariants} className="mb-4">
                                        <span className="text-primary font-black tracking-[0.2em] uppercase text-xs md:text-sm drop-shadow-md">
                                            Featured Content
                                        </span>
                                    </motion.div>

                                    <motion.h1 
                                        variants={itemVariants}
                                        className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[0.9] mb-6 tracking-tighter italic uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                                        style={{ color: currentSlide.titleColor || '#FFFFFF' }}
                                    >
                                        {currentSlide.title}
                                    </motion.h1>

                                    <motion.p 
                                        variants={itemVariants}
                                        className="text-base md:text-xl text-white/90 mb-8 max-w-xl font-bold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                                        style={{ color: currentSlide.descriptionColor || 'rgba(255,255,255,0.9)' }}
                                    >
                                        {currentSlide.description}
                                    </motion.p>


                                    <motion.div variants={itemVariants}>
                                        <div 
                                            className="inline-flex h-12 md:h-14 px-8 items-center justify-center rounded-sm font-black text-white transition-all hover:px-10 gap-3 text-sm md:text-base uppercase tracking-widest border-l-4"
                                            style={{ 
                                                backgroundColor: currentSlide.ctaColor || 'var(--primary)',
                                                borderLeftColor: 'white'
                                            }}
                                        >
                                            {currentSlide.ctaText}
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </motion.div>
                                </motion.div>
                            </div>
                        </div>
                    </Link>


                </motion.div>
            </AnimatePresence>

            {/* Premium Pagination */}
            <div className="absolute bottom-6 left-0 right-0 z-50">
                <div className="container mx-auto px-6 md:px-16 flex items-center justify-between">
                    {/* Progress Bar Indicators */}
                    <div className="flex items-center gap-2 px-4 py-2 flex-1 max-w-md">
                        {activeSlides.map((_, idx) => (
                            <div
                                key={idx}
                                onClick={() => goToSlide(idx)}
                                className="relative h-1 flex-1 bg-white/20 rounded-full overflow-hidden cursor-pointer"
                            >
                                {idx === currentIndex && (
                                    <motion.div
                                        initial={{ width: '0%' }}
                                        animate={isPaused ? { width: '0%' } : { width: '100%' }}
                                        transition={{ 
                                            duration: SLIDE_DURATION / 1000, 
                                            ease: "linear" 
                                        }}
                                        key={`${currentIndex}-${isPaused}`}
                                        className="absolute inset-y-0 left-0 bg-primary"
                                    />
                                )}
                                {idx < currentIndex && (
                                    <div className="absolute inset-0 bg-primary/40" />
                                )}
                            </div>
                        ))}
                    </div>




                    {/* Controls */}
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={prevSlide}
                            className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={nextSlide}
                            className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>


                </div>
            </div>
        </div>
    );
}
