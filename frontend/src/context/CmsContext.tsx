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

interface CmsConfig {
    theme: GlobalTheme;
    content: Record<string, string>;
    layout: ComponentLayout[];
    features: CustomFeature[];
}

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

    const fetchConfig = async () => {
        try {
            const res = await api.get('/cms/config');
            const data = res.data;
            setConfig(data);
            applyGlobalTheme(data.theme);
        } catch (error) {
            console.error('Failed to load global CMS config:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyGlobalTheme = (theme: GlobalTheme) => {
        if (!theme) return;
        const root = document.documentElement;

        // Apply Tailwind HSL CSS Variables
        if (theme.primaryColor) root.style.setProperty('--primary', hexToHslString(theme.primaryColor));
        if (theme.secondaryColor) root.style.setProperty('--secondary', hexToHslString(theme.secondaryColor));

        // Smart Color Overrides: 
        // If mode is DARK and background is #000000, or mode is LIGHT and background is #FFFFFF, 
        // we clear the override to let the system theme take over.
        const isDark = theme.mode === 'DARK';
        const isDefaultBg = isDark ? (theme.backgroundColor === '#000000') : (theme.backgroundColor === '#FFFFFF');
        const isDefaultFg = isDark ? (theme.textColor === '#FFFFFF') : (theme.textColor === '#000000');

        if (theme.backgroundColor && !isDefaultBg) {
            root.style.setProperty('--background', hexToHslString(theme.backgroundColor));
        } else {
            root.style.removeProperty('--background');
        }

        if (theme.textColor && !isDefaultFg) {
            root.style.setProperty('--foreground', hexToHslString(theme.textColor));
        } else {
            root.style.removeProperty('--foreground');
        }

        // Apply Structural / Design Variables
        if (theme.borderRounding) root.style.setProperty('--radius', theme.borderRounding);

        // Convert animation speed
        let dur = '0ms';
        if (theme.animationSpeed === 'slow') dur = '500ms';
        if (theme.animationSpeed === 'normal') dur = '300ms';
        if (theme.animationSpeed === 'fast') dur = '150ms';
        root.style.setProperty('--animation-duration', dur);

        // Advanced Visuals
        root.style.setProperty('--button-style', theme.buttonStyle || 'solid');
        root.style.setProperty('--background-style', theme.backgroundStyle || 'solid');
        if (theme.glassmorphism) {
            root.classList.add('glass-active');
        } else {
            root.classList.remove('glass-active');
        }

        // Swap fonts
        if (theme.fontFamily) {
            root.style.setProperty('--font-sans', `"${theme.fontFamily}", ui-sans-serif, system-ui, sans-serif`);
        }

        // Toggle Mode Class
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

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
