"use client";
import { useTheme } from "@/src/app/components/providers/ThemeProvider";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
    const { resolvedTheme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-center min-w-[28px] min-h-[28px] w-7 h-7 rounded-full 
        bg-white/20 hover:bg-white/30 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`}
        >
            {resolvedTheme === "light" ? (
                <Moon className="w-4 h-4 text-white" />
            ) : (
                <Sun className="w-4 h-4 text-white" />
            )}
        </button>
    );
}
