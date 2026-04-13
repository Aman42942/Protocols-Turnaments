'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

interface GlobalTheme {
    mode: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    borderRounding: string;
    animationSpeed: string;
    buttonStyle: string;
    glassmorphism: boolean;
    backgroundStyle: string;
    smokeVisibility: number;
}

interface ComponentLayout {
    componentId: string;
    isVisible: boolean;
    displayOrder: number;
}

export interface CustomFeature {
    id: string;
    title: string;
    description: string | null;
    icon: string | null;
    imageUrl: string | null;
    type: string;
    isActive: boolean;
    order: number;
}

export interface AdSlide {
    id: string;
    title: string;
    description: string | null;
    mediaType: 'IMAGE' | 'VIDEO';
    mediaUrl: string;
    ctaLink: string | null;
    ctaText: string | null;
    openInNewTab: boolean;
    isActive: boolean;
    displayOrder: number;
    startDate: string | null;
    endDate: string | null;
    titleColor: string | null;
    descriptionColor: string | null;
    ctaColor: string | null;
}

interface CmsConfig {
    theme: GlobalTheme;
    content: Record<string, string>;
    layout: ComponentLayout[];
    features: CustomFeature[];
    slides: AdSlide[];
    presets?: any[];
}

import { useTheme } from 'next-themes';

interface CmsContextType {
    config: CmsConfig | null;
    loading: boolean;
    refreshConfig: () => Promise<void>;
    getContent: (key: string, fallback: string) => string;
    isComponentVisible: (componentId: string) => boolean;
}

const CmsContext = createContext<CmsContextType>({
    config: null,
    loading: true,
    refreshConfig: async () => { },
    getContent: (k, f) => f,
    isComponentVisible: () => true,
});

export const useCms = () => useContext(CmsContext);

// Converts Hex to HSL string (e.g., "210 100% 50%") for Tailwind CSS variables
const hexToHslString = (hex: string): string => {
    let c = hex.substring(1).split('');
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    const r = parseInt(c.slice(0, 2).join(''), 16) / 255;
    const g = parseInt(c.slice(2, 4).join(''), 16) / 255;
    const b = parseInt(c.slice(4, 6).join(''), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
};

export function CmsEngineProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<CmsConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const { setTheme: setSystemTheme, resolvedTheme } = useTheme();

    const fetchConfig = async () => {
        // Try to load from cache first for instant UI
        const cached = typeof window !== 'undefined' ? localStorage.getItem('cms_cached_config') : null;
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setConfig(parsed);
                // We'll apply theme in the useEffect below to handle resolvedTheme properly
            } catch (e) {
                console.warn('Stale CMS cache');
            }
        }

        try {
            const res = await api.get('/cms/config');
            const data = res.data;
            setConfig(data);
            
            // Background update cache
            if (typeof window !== 'undefined') {
                localStorage.setItem('cms_cached_config', JSON.stringify(data));
            }
        } catch (error) {
            console.error('Failed to load global CMS config:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyGlobalTheme = (theme: GlobalTheme) => {
        if (!theme) return;

        // ── Theme Mode Synchronization ──
        // Only trigger system theme change on initial config load if specifically set
        if (theme.mode === 'DARK' || theme.mode === 'LIGHT') {
            const cmsMode = theme.mode.toLowerCase();
            const hasUserThemePreference = typeof window !== 'undefined' && !!localStorage.getItem('theme');
            if (!hasUserThemePreference) {
                setSystemTheme(cmsMode);
            }
        }

        // ── Dynamic Style Injection ──
        // Instead of root.style.setProperty, we inject a style tag.
        // This allows us to use CSS selectors like :root:not(.dark) and .dark
        // to ensure overrides ONLY apply to the intended mode.
        let styleTag = document.getElementById('cms-theme-overrides');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'cms-theme-overrides';
            document.head.appendChild(styleTag);
        }

        const isDarkConfig = theme.mode === 'DARK';
        const primaryHsl = theme.primaryColor ? hexToHslString(theme.primaryColor) : null;
        const secondaryHsl = theme.secondaryColor ? hexToHslString(theme.secondaryColor) : null;
        const bgHsl = theme.backgroundColor ? hexToHslString(theme.backgroundColor) : null;
        const fgHsl = theme.textColor ? hexToHslString(theme.textColor) : null;

        // Mode-specific selector logic
        // If CMS says DARK, we only apply BG/FG to .dark
        // If CMS says LIGHT, we only apply BG/FG to :root:not(.dark)
        const targetSelector = isDarkConfig ? '.dark' : ':root:not(.dark)';

        styleTag.innerHTML = `
            :root {
                ${primaryHsl ? `--primary: ${primaryHsl};` : ''}
                ${secondaryHsl ? `--secondary: ${secondaryHsl};` : ''}
                ${theme.borderRounding ? `--radius: ${theme.borderRounding};` : ''}
                --animation-duration: ${theme.animationSpeed === 'slow' ? '500ms' : theme.animationSpeed === 'fast' ? '150ms' : '300ms'};
                --button-style: ${theme.buttonStyle || 'solid'};
                --background-style: ${theme.backgroundStyle || 'solid'};
            }
            ${targetSelector} {
                ${bgHsl ? `--background: ${bgHsl};` : ''}
                ${fgHsl ? `--foreground: ${fgHsl};` : ''}
            }
            ${theme.fontFamily ? `
            :root {
                --font-sans: "${theme.fontFamily}", ui-sans-serif, system-ui, sans-serif;
            }` : ''}
        `;

        const root = document.documentElement;
        if (theme.glassmorphism) {
            root.classList.add('glass-active');
        } else {
            root.classList.remove('glass-active');
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    // Re-apply theme whenever config changes
    useEffect(() => {
        if (config?.theme) {
            applyGlobalTheme(config.theme);
        }
    }, [config]);

    const getContent = (key: string, fallback: string) => {
        if (!config || !config.content) return fallback;
        return config.content[key] || fallback;
    };

    const isComponentVisible = (componentId: string) => {
        if (!config || !config.layout) return true; // default visible
        const layout = config.layout.find(l => l.componentId === componentId);
        return layout ? layout.isVisible : true;
    };

    return (
        <CmsContext.Provider value={{ config, loading, refreshConfig: fetchConfig, getContent, isComponentVisible }}>
            {children}
        </CmsContext.Provider>
    );
}
