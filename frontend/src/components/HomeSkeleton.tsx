"use client";
import React from 'react';
import { motion } from 'framer-motion';

export function HomeSkeleton() {
    return (
        <div className="flex flex-col gap-0 min-h-screen bg-background animate-in fade-in duration-500">
            {/* AdSlider Skeleton */}
            <div className="relative w-full h-[280px] sm:h-[380px] md:h-[480px] bg-black/40 overflow-hidden border-b border-border">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="container px-5 md:px-14 flex flex-col gap-4">
                        <div className="h-6 w-32 bg-white/10 rounded-full animate-pulse" />
                        <div className="h-12 md:h-16 w-3/4 bg-white/10 rounded-xl animate-pulse" />
                        <div className="h-6 w-1/2 bg-white/10 rounded-lg animate-pulse" />
                        <div className="h-12 w-40 bg-primary/20 rounded-full animate-pulse mt-4" />
                    </div>
                </div>
                {/* HUD Elements */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary/20 hidden md:block" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary/20 hidden md:block" />
            </div>

            {/* HeroSection Skeleton */}
            <div className="container py-24 space-y-12">
                <div className="flex flex-col items-center text-center space-y-8">
                    <div className="h-8 w-48 bg-primary/10 border border-primary/20 rounded-2xl animate-pulse" />
                    <div className="space-y-4 w-full max-w-4xl flex flex-col items-center">
                        <div className="h-16 md:h-24 w-full bg-muted/20 rounded-2xl animate-pulse" />
                        <div className="h-16 md:h-24 w-2/3 bg-muted/20 rounded-2xl animate-pulse" />
                    </div>
                    <div className="h-6 w-full max-w-2xl bg-muted/20 rounded-lg animate-pulse" />
                    <div className="flex gap-6 pt-4">
                        <div className="h-16 w-48 bg-primary/20 rounded-[1.5rem] animate-pulse" />
                        <div className="h-16 w-48 bg-muted/30 rounded-[1.5rem] animate-pulse" />
                    </div>
                </div>

                {/* Feature Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto pt-12">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-10 rounded-[2.5rem] border border-border/10 bg-card/20 h-64 animate-pulse space-y-6">
                            <div className="w-16 h-16 rounded-2xl bg-muted/30" />
                            <div className="h-8 w-3/4 bg-muted/30 rounded-lg" />
                            <div className="h-4 w-full bg-muted/20 rounded-md" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
