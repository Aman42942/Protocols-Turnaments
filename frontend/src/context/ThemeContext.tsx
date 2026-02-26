
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

interface ThemeSettings {
    siteName: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    heroTitle: string;
    heroSubtitle: string;
    heroImageUrl?: string;
    customCss?: string;
}

interface ThemeContextType {
    theme: ThemeSettings | null;
    loading: boolean;
    refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: null,
    loading: true,
    refreshTheme: async () => { },
});

export const useTheme = () => useContext(ThemeContext);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<ThemeSettings | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchTheme = async (retries = 3) => {
        try {
            const res = await api.get('/theme');
            setTheme(res.data);
            applyTheme(res.data);
        } catch (error) {
            if (retries > 0) {
                console.log(`Failed to load theme, retrying (${retries} left)...`);
                setTimeout(() => fetchTheme(retries - 1), 2000);
            } else {
                console.error('Failed to load theme after multiple attempts:', error);
                // Apply default theme if fetch fails - Default to BLUE (Protocol Brand)
                applyTheme({
                    siteName: "Protocol Tournaments",
                    primaryColor: "#3b82f6", // Blue
                    secondaryColor: "#1e293b", // Slate-800
                    accentColor: "#f59e0b", // Amber
                    backgroundColor: "#020617", // Slate-950
                    heroTitle: "Compete. Win. Become a Legend.",
                    heroSubtitle: "The ultimate esports platform for competitive gamers. Join tournaments, climb the leaderboards, and win real cash prizes."
                });
            }
        } finally {
            if (retries === 0) setLoading(false);
            else if (!loading) setLoading(false); // only if we succeeded or ran out
        }
    };

    const hexToHsl = (hex: string) => {
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

    const applyTheme = (settings: ThemeSettings) => {
        if (!settings) return;
        const root = document.documentElement;

        // Apply colors as HSL channels for Tailwind
        // Only apply Brand Colors (Primary & Accent). 
        // Background and Secondary should be handled by Tailwind's dark/light mode classes to ensure proper theming.
        if (settings.primaryColor) root.style.setProperty('--primary', hexToHsl(settings.primaryColor));
        if (settings.accentColor) root.style.setProperty('--accent', hexToHsl(settings.accentColor));

        // We do NOT set --background or --secondary here, as it would override the .dark class variables
        // and break the Light/Dark mode toggle.
        // if (settings.secondaryColor) root.style.setProperty('--secondary', hexToHsl(settings.secondaryColor));
        // if (settings.backgroundColor) root.style.setProperty('--background', hexToHsl(settings.backgroundColor));

        // Update Title
        if (typeof document !== 'undefined') {
            document.title = settings.siteName;
        }

        // Apply Custom CSS
        if (settings.customCss) {
            let styleTag = document.getElementById('custom-theme-css');
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'custom-theme-css';
                document.head.appendChild(styleTag);
            }
            styleTag.textContent = settings.customCss;
        }
    };

    useEffect(() => {
        fetchTheme();
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, loading, refreshTheme: fetchTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
