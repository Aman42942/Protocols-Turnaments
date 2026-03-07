"use client";
import React, { useState, useEffect } from 'react';
import { HeroSection } from "@/components/HeroSection";
import { FeatureSection } from "@/components/FeatureSection";
import { DashboardView } from "@/components/DashboardView";
import { useCms, AdSlide } from "@/context/CmsContext";
import { AdSlider } from "@/components/AdSlider";

const DEFAULT_SLIDES: AdSlide[] = [
  {
    id: 'default-1',
    title: 'WELCOME TO PROTOCOL',
    description: 'Join the ultimate gaming tournaments and win real cash daily.',
    mediaType: 'IMAGE',
    mediaUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070',
    ctaLink: '/tournaments',
    ctaText: 'PLAY NOW',
    openInNewTab: false,
    isActive: true,
    displayOrder: 1,
    startDate: null,
    endDate: null,
  },
  {
    id: 'default-2',
    title: 'NEW REWARDS PROGRAM',
    description: 'Earn elite badges and unlock exclusive VIP tournaments.',
    mediaType: 'IMAGE',
    mediaUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071',
    ctaLink: '/profile',
    ctaText: 'VIEW BADGES',
    openInNewTab: false,
    isActive: true,
    displayOrder: 2,
    startDate: null,
    endDate: null,
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

  if (isLoading || cmsLoading) return null;

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
