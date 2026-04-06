"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { DashboardView } from "@/components/DashboardView";
import { useCms, AdSlide } from "@/context/CmsContext";
import { HomeSkeleton } from "@/components/HomeSkeleton";

const HeroSection = dynamic(() => import("@/components/HeroSection").then(m => ({ default: m.HeroSection })), { ssr: false });
const FeatureSection = dynamic(() => import("@/components/FeatureSection").then(m => ({ default: m.FeatureSection })), { ssr: false });
const AdSlider = dynamic(() => import("@/components/AdSlider").then(m => ({ default: m.AdSlider })), { ssr: false });

const DEFAULT_SLIDES: AdSlide[] = [
  {
    id: 'default-1',
    title: 'COMPETE. WIN. DOMINATE.',
    description: 'Join India\'s fastest-growing esports platform. Daily tournaments with real cash prizes for BGMI, Valorant, PUBG & Free Fire.',
    mediaType: 'IMAGE',
    mediaUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=75&auto=format',
    ctaLink: '/tournaments',
    ctaText: 'JOIN NOW',
    openInNewTab: false,
    isActive: true,
    displayOrder: 1,
    startDate: null,
    endDate: null,
    titleColor: '#FFFFFF',
    descriptionColor: 'rgba(255,255,255,0.75)',
    ctaColor: '#3b82f6',
  },
  {
    id: 'default-2',
    title: 'DAILY TOURNAMENTS LIVE',
    description: 'Solo, Duo & Squad modes available. Register your team, enter the arena, and battle for glory every single day.',
    mediaType: 'IMAGE',
    mediaUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=75&auto=format',
    ctaLink: '/tournaments',
    ctaText: 'EXPLORE BATTLES',
    openInNewTab: false,
    isActive: true,
    displayOrder: 2,
    startDate: null,
    endDate: null,
    titleColor: '#FFFFFF',
    descriptionColor: 'rgba(255,255,255,0.75)',
    ctaColor: '#8b5cf6',
  },
  {
    id: 'default-3',
    title: 'EARN ELITE REWARDS',
    description: 'Unlock exclusive badges, climb the global leaderboard, and access VIP-only tournaments with massive prize pools.',
    mediaType: 'IMAGE',
    mediaUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=75&auto=format',
    ctaLink: '/profile',
    ctaText: 'VIEW BADGES',
    openInNewTab: false,
    isActive: true,
    displayOrder: 3,
    startDate: null,
    endDate: null,
    titleColor: '#FFFFFF',
    descriptionColor: 'rgba(255,255,255,0.75)',
    ctaColor: '#f59e0b',
  },
  {
    id: 'default-4',
    title: 'BUILD YOUR SQUAD',
    description: 'Create or join a team, invite your friends, strategize together, and rise through the competitive ranks as a unit.',
    mediaType: 'IMAGE',
    mediaUrl: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200&q=75&auto=format',
    ctaLink: '/dashboard/teams',
    ctaText: 'CREATE TEAM',
    openInNewTab: false,
    isActive: true,
    displayOrder: 4,
    startDate: null,
    endDate: null,
    titleColor: '#FFFFFF',
    descriptionColor: 'rgba(255,255,255,0.75)',
    ctaColor: '#10b981',
  },
  {
    id: 'default-5',
    title: 'INSTANT WITHDRAWALS',
    description: 'Win tournaments, earn coins, and withdraw your winnings instantly. Your gaming skills pay real money.',
    mediaType: 'IMAGE',
    mediaUrl: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=1200&q=75&auto=format',
    ctaLink: '/dashboard/wallet',
    ctaText: 'MY WALLET',
    openInNewTab: false,
    isActive: true,
    displayOrder: 5,
    startDate: null,
    endDate: null,
    titleColor: '#FFFFFF',
    descriptionColor: 'rgba(255,255,255,0.75)',
    ctaColor: '#ef4444',
  }
];

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { config, loading: cmsLoading } = useCms();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    setIsLoading(false);
  }, []);

  if (isLoading || cmsLoading) return <HomeSkeleton />;

  // Build the dynamic landing page Layout
  const renderDynamicLayout = () => {
    if (!config?.layout || config.layout.length === 0) {
      // Fallback if DB is empty
      const slidesToUse = config?.slides && config.slides.length > 0 ? config.slides : DEFAULT_SLIDES;

      return (
        <>
          <AdSlider slides={slidesToUse} />
          <HeroSection />
          <FeatureSection />
        </>
      );
    }

    // Sort valid active layouts by display order
    const sortedLayouts = [...config.layout]
      .filter(l => l.isVisible)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    return sortedLayouts.map(layout => {
      switch (layout.componentId) {
        case 'HERO': return <HeroSection key={layout.componentId} />;
        case 'AD_SLIDER': return <AdSlider key={layout.componentId} slides={config.slides || []} />;
        case 'FEATURES': return <FeatureSection key={layout.componentId} />;
        case 'TOURNAMENTS': return null; // Placeholder for future component
        default: return null;
      }
    });
  };

  return (
    <div className="flex flex-col gap-0">
      {renderDynamicLayout()}
    </div>
  );
}
