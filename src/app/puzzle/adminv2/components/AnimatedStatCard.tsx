"use client";

import { useEffect, useState } from 'react';

interface AnimatedStatCardProps {
    title: string;
    value: number | string;
    icon: string;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
    trend?: {
        value: number;
        isPositive: boolean;
    };
    suffix?: string;
    prefix?: string;
}

const colorConfig = {
    blue: {
        text: 'text-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        hoverClass: 'hover:shadow-blue-500/20',
    },
    green: {
        text: 'text-green-600',
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        hoverClass: 'hover:shadow-green-500/20',
    },
    red: {
        text: 'text-red-600',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        hoverClass: 'hover:shadow-red-500/20',
    },
    yellow: {
        text: 'text-yellow-600',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        hoverClass: 'hover:shadow-yellow-500/20',
    },
    purple: {
        text: 'text-purple-600',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        hoverClass: 'hover:shadow-purple-500/20',
    },
};

function useAnimatedNumber(targetValue: number, duration: number = 1000) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const startValue = 0;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Easing function: ease-out
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * eased);
            setDisplayValue(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setDisplayValue(targetValue);
            }
        };

        requestAnimationFrame(animate);
    }, [targetValue, duration]);

    return displayValue;
}

export default function AnimatedStatCard({
    title,
    value,
    icon,
    color = 'blue',
    trend,
    suffix = '',
    prefix = ''
}: AnimatedStatCardProps) {
    const config = colorConfig[color] || colorConfig.blue;
    const numericValue = typeof value === 'number' ? value : parseInt(value.toString()) || 0;
    const animatedValue = useAnimatedNumber(numericValue);
    const displayValue = typeof value === 'string' && isNaN(parseInt(value)) ? value : animatedValue.toLocaleString();

    return (
        <div className={`
            bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm
            border ${config.border}
            hover:shadow-lg ${config.hoverClass}
            transition-all duration-300
            group
        `}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        <span>{trend.isPositive ? '↑' : '↓'}</span>
                        <span>{Math.abs(trend.value)}%</span>
                    </div>
                )}
            </div>
            <div className={`text-2xl md:text-3xl font-bold ${config.text} mb-1`}>
                {prefix}{displayValue}{suffix}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{title}</div>
        </div>
    );
}
