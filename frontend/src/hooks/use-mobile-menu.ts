"use client";
import { useState, useEffect, useCallback } from 'react';

// A simple global state for the mobile menu using a custom event
const MOBILE_MENU_TOGGLE_EVENT = 'protocol-mobile-menu-toggle';

export function useMobileMenu() {
    const [isOpen, setIsOpen] = useState(false);

    const toggle = useCallback((force?: boolean) => {
        const nextState = force !== undefined ? force : !isOpen;
        window.dispatchEvent(new CustomEvent(MOBILE_MENU_TOGGLE_EVENT, { detail: nextState }));
    }, [isOpen]);

    useEffect(() => {
        const handleToggle = (e: any) => {
            setIsOpen(e.detail);
        };

        window.addEventListener(MOBILE_MENU_TOGGLE_EVENT, handleToggle);
        return () => window.removeEventListener(MOBILE_MENU_TOGGLE_EVENT, handleToggle);
    }, []);

    return {
        isOpen,
        toggle,
        open: () => toggle(true),
        close: () => toggle(false)
    };
}
