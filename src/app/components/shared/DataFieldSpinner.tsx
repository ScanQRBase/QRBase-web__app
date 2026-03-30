"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DataFieldSpinnerProps {
    /** The current value to display */
    value: string | number;
    /** Optional label to show before the value */
    label?: string;
    /** CSS class for the value text */
    valueClassName?: string;
    /** CSS class for the label text */
    labelClassName?: string;
    /** CSS class for the container */
    className?: string;
    /** Minimum duration to show spinner (prevents flickering), default 300ms */
    minSpinnerDuration?: number;
    /** Size of the spinner: 'sm' | 'md' */
    spinnerSize?: 'sm' | 'md';
}

/**
 * DataFieldSpinner Component
 * 
 * Displays a data value with an inline spinner that only appears when the value changes.
 * Prevents spinner flickering by:
 * - Tracking previous value with useRef
 * - Only showing spinner when value actually changes
 * - Maintaining minimum spinner duration to prevent visual glitches
 */
export default function DataFieldSpinner({
    value,
    label,
    valueClassName = "font-bold text-gray-900 dark:text-white",
    labelClassName = "text-gray-500 dark:text-gray-400",
    className = "",
    minSpinnerDuration = 300,
    spinnerSize = 'sm',
}: DataFieldSpinnerProps) {
    const prevValueRef = useRef<string | number | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [displayValue, setDisplayValue] = useState(value);
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialMount = useRef(true);

    useEffect(() => {
        // Skip spinner on initial mount
        if (isInitialMount.current) {
            isInitialMount.current = false;
            prevValueRef.current = value;
            setDisplayValue(value);
            return;
        }

        // Only trigger spinner if value actually changed
        if (prevValueRef.current !== value) {
            // Clear any pending timeout
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }

            // Show spinner
            setIsUpdating(true);

            // After minimum duration, update value and hide spinner
            updateTimeoutRef.current = setTimeout(() => {
                setDisplayValue(value);
                setIsUpdating(false);
                prevValueRef.current = value;
            }, minSpinnerDuration);
        }

        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, [value, minSpinnerDuration]);

    const spinnerSizeClass = spinnerSize === 'sm'
        ? 'w-3 h-3 border-[1.5px]'
        : 'w-4 h-4 border';

    return (
        <div className={`inline-flex items-center ${className}`}>
            {label && <span className={labelClassName}>{label}</span>}

            <div className="relative inline-flex items-center">
                <AnimatePresence mode="wait">
                    {isUpdating ? (
                        <motion.div
                            key="spinner"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center justify-center"
                        >
                            <div
                                className={`${spinnerSizeClass} border-blue-500 border-t-transparent rounded-full animate-spin`}
                            />
                        </motion.div>
                    ) : (
                        <motion.span
                            key="value"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={valueClassName}
                        >
                            {displayValue}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
