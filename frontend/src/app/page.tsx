"use client";
import React, { useState, useEffect } from 'react';
import { HeroSection } from "@/components/HeroSection";
import { FeatureSection } from "@/components/FeatureSection";
import { DashboardView } from "@/components/DashboardView";
import { useCms } from "@/context/CmsContext";
import { AdSlider } from "@/components/AdSlider";

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
      return (
        <>
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
      {isLoggedIn ? (
        <DashboardView />
      ) : (
        renderDynamicLayout()
      )}
    </div>
  );
}
