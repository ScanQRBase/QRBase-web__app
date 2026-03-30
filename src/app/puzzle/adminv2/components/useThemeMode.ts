"use client";

import { useState, useEffect } from "react";

export type ThemeMode = "dark" | "light";

/**
 * Detects the current theme by watching the `dark` class on <html>.
 * Works with Tailwind's `darkMode: 'class'` strategy.
 */
export function useThemeMode(): ThemeMode {
    const [mode, setMode] = useState<ThemeMode>("dark");

    useEffect(() => {
        const html = document.documentElement;
        const update = () => setMode(html.classList.contains("dark") ? "dark" : "light");
        update();

        const observer = new MutationObserver(update);
        observer.observe(html, { attributes: true, attributeFilter: ["class"] });

        // Also listen for prefers-color-scheme changes
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        mq.addEventListener("change", update);

        return () => {
            observer.disconnect();
            mq.removeEventListener("change", update);
        };
    }, []);

    return mode;
}
