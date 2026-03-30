"use client";

import ReactECharts from "echarts-for-react";
import { useThemeMode } from "./useThemeMode";
import type { ChartType } from "./ChartWrapper";

interface TokenData { partnerName: string; count: number; revenue: number; hours: number; }
interface BoostTokenDistributionProps { data: TokenData[]; chartType?: ChartType; }

const COLORS = ["#f59e0b", "#8b5cf6", "#3b82f6", "#22c55e", "#ef4444", "#ec4899", "#14b8a6", "#f97316"];

export default function BoostTokenDistribution({ data, chartType = "pie" }: BoostTokenDistributionProps) {
    const mode = useThemeMode();
    const isDark = mode === "dark";
    const sorted = [...data].sort((a, b) => b.revenue - a.revenue).slice(0, 8);

    const tooltip = { backgroundColor: isDark ? "#1f2937" : "#ffffff", borderColor: isDark ? "#374151" : "#e5e7eb", textStyle: { color: isDark ? "#f3f4f6" : "#111827" } };

    if (sorted.length === 0) {
        return <div className="text-center text-gray-500 dark:text-gray-400 py-8">No token data yet</div>;
    }

    // ── Bar ──
    if (chartType === "bar") {
        return (
            <ReactECharts key={chartType} option={{
                backgroundColor: "transparent", tooltip: { trigger: "axis" as const, ...tooltip },
                grid: { left: "3%", right: "6%", bottom: "3%", containLabel: true },
                yAxis: { type: "category" as const, data: sorted.map((d) => d.partnerName), inverse: true, axisLine: { lineStyle: { color: isDark ? "#4b5563" : "#d1d5db" } }, axisLabel: { color: isDark ? "#d1d5db" : "#374151", fontSize: 11 } },
                xAxis: { type: "value" as const, name: "Revenue ($)", nameTextStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, splitLine: { lineStyle: { color: isDark ? "#374151" : "#e5e7eb", type: "dashed" as const } }, axisLabel: { color: isDark ? "#9ca3af" : "#6b7280" } },
                series: [{ type: "bar", barMaxWidth: 24, data: sorted.map((d, i) => ({ value: d.revenue, itemStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: COLORS[i % COLORS.length] }, { offset: 1, color: COLORS[i % COLORS.length] + "cc" }] }, borderRadius: [0, 6, 6, 0] } })), label: { show: true, position: "right" as const, formatter: "${c}", color: isDark ? "#d1d5db" : "#374151", fontSize: 11 } }],
                animationDuration: 800,
            }} style={{ height: 320 }} notMerge lazyUpdate />
        );
    }

    // ── Funnel ──
    if (chartType === "funnel") {
        return (
            <ReactECharts key={chartType} option={{
                backgroundColor: "transparent", tooltip: { trigger: "item" as const, ...tooltip },
                legend: { bottom: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280", fontSize: 10 }, icon: "circle", itemWidth: 8, itemHeight: 8, type: "scroll" as const },
                series: [{
                    type: "funnel", left: "10%", right: "10%", top: 20, bottom: 50, minSize: "15%", maxSize: "100%", sort: "descending" as const, gap: 3,
                    label: { show: true, position: "inside" as const, formatter: "{b}\n${c}", color: "#fff", fontSize: 11, fontWeight: "bold" as const },
                    itemStyle: { borderColor: isDark ? "#1f2937" : "#fff", borderWidth: 2 },
                    data: sorted.map((d, i) => ({ value: d.revenue, name: d.partnerName, itemStyle: { color: COLORS[i % COLORS.length] } })),
                }],
                animationDuration: 1000,
            }} style={{ height: 320 }} notMerge lazyUpdate />
        );
    }

    // ── Pie (default) ──
    const chartData = sorted.map((d, i) => ({ value: d.revenue, name: d.partnerName, count: d.count, hours: d.hours, itemStyle: { color: COLORS[i % COLORS.length] } }));
    return (
        <ReactECharts key={chartType} option={{
            backgroundColor: "transparent",
            tooltip: { trigger: "item" as const, ...tooltip, formatter: (params: any) => { const d = params.data; return `<strong>${d.name}</strong><br/>Revenue: <strong>$${d.value}</strong><br/>Boosts: ${d.count}<br/>Hours: ${d.hours}h`; } },
            legend: { bottom: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }, icon: "circle", itemWidth: 8, itemHeight: 8 },
            series: [{
                type: "pie", radius: ["20%", "72%"], center: ["50%", "42%"], roseType: "radius" as const,
                avoidLabelOverlap: true, padAngle: 2, itemStyle: { borderRadius: 6 },
                label: { show: true, formatter: "{b}", color: isDark ? "#d1d5db" : "#374151", fontSize: 11 },
                labelLine: { lineStyle: { color: isDark ? "#4b5563" : "#d1d5db" } },
                emphasis: { itemStyle: { shadowBlur: 15, shadowColor: "rgba(0,0,0,0.3)" }, scale: true, scaleSize: 6 },
                data: chartData, animationType: "expansion" as const, animationDuration: 1000,
            }],
        }} style={{ height: 320 }} notMerge lazyUpdate />
    );
}
