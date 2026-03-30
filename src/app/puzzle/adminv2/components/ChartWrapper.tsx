"use client";

import { useState, ReactNode } from "react";
import {
    BarChart3, TrendingUp, PieChart, Radar, Gauge, Filter,
    ScatterChart, ArrowDownNarrowWide,
} from "lucide-react";

// ── Chart type definitions ──────────────────────────────────────────────────
export type ChartType = "line" | "bar" | "pie" | "scatter" | "radar" | "funnel" | "gauge" | "heatmap";

const CHART_META: Record<ChartType, { icon: ReactNode; label: string }> = {
    line:    { icon: <TrendingUp size={14} />,           label: "Line" },
    bar:     { icon: <BarChart3 size={14} />,            label: "Bar" },
    pie:     { icon: <PieChart size={14} />,             label: "Pie" },
    scatter: { icon: <ScatterChart size={14} />,         label: "Scatter" },
    radar:   { icon: <Radar size={14} />,                label: "Radar" },
    funnel:  { icon: <ArrowDownNarrowWide size={14} />,  label: "Funnel" },
    gauge:   { icon: <Gauge size={14} />,                label: "Gauge" },
    heatmap: { icon: <Filter size={14} />,               label: "Heatmap" },
};

// ── Standalone hook ─────────────────────────────────────────────────────────
export function useChartType(defaultType: ChartType): [ChartType, (t: ChartType) => void] {
    const [type, setType] = useState<ChartType>(defaultType);
    return [type, setType];
}

// ── Chart Header with selector ──────────────────────────────────────────────
export function ChartHeader({
    title,
    icon,
    allowedTypes,
    activeType,
    onTypeChange,
}: {
    title: string;
    icon?: ReactNode;
    allowedTypes: ChartType[];
    activeType: ChartType;
    onTypeChange: (type: ChartType) => void;
}) {
    return (
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {icon}
                {title}
            </h2>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
                {allowedTypes.map((type) => {
                    const meta = CHART_META[type];
                    const isActive = type === activeType;
                    return (
                        <button
                            key={type}
                            type="button"
                            onClick={() => onTypeChange(type)}
                            title={meta.label}
                            className={`
                                flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                                transition-all duration-200 cursor-pointer select-none
                                ${isActive
                                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-600/40"
                                }
                            `}
                        >
                            {meta.icon}
                            <span className="hidden sm:inline">{meta.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
