"use client";
import React, { useState, useEffect } from 'react';
import { HeroSection } from "@/components/HeroSection";
import { FeatureSection } from "@/components/FeatureSection";
import { DashboardView } from "@/components/DashboardView";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    setIsLoading(false);
  }, []);

  if (isLoading) return null;

  return (
    <div className="flex flex-col gap-0">
      {isLoggedIn ? (
        <DashboardView />
      ) : (
        <>
          <HeroSection />
          <FeatureSection />
          {/* Tournament List will go here for guest view if needed */}
        </>
      )}
    </div>
  );
}
