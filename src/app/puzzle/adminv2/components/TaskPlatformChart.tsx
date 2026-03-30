"use client";

import ReactECharts from "echarts-for-react";
import { useThemeMode } from "./useThemeMode";
import type { ChartType } from "./ChartWrapper";

interface PlatformData { platform: string; taskCount: number; totalCompletions: number; totalRevenue: number; avgFillRate: number; }
interface TaskPlatformChartProps { data: PlatformData[]; chartType?: ChartType; }

const PLAT_COLORS: Record<string, string[]> = { x: ["#1d9bf0", "#0d8bd9"], farcaster: ["#8b5cf6", "#7c3aed"] };

export default function TaskPlatformChart({ data, chartType = "pie" }: TaskPlatformChartProps) {
    const mode = useThemeMode();
    const isDark = mode === "dark";

    const tooltip = { backgroundColor: isDark ? "#1f2937" : "#ffffff", borderColor: isDark ? "#374151" : "#e5e7eb", textStyle: { color: isDark ? "#f3f4f6" : "#111827" } };
    const chartData = data.map((d) => {
        const colors = PLAT_COLORS[d.platform] || ["#6b7280", "#4b5563"];
        return { value: d.totalCompletions, name: d.platform === "x" ? "X (Twitter)" : "Farcaster", colors, tasks: d.taskCount, revenue: d.totalRevenue, fillRate: d.avgFillRate };
    });

    const ttFormatter = (params: any) => {
        const d = params.data;
        return `<strong>${params.name || d.name}</strong><br/>Completions: <strong>${params.value || d.value}</strong><br/>Tasks: ${d.tasks}<br/>Revenue: $${d.revenue}<br/>Fill Rate: ${d.fillRate}%`;
    };

    // ── Bar ──
    if (chartType === "bar") {
        return (
            <ReactECharts key={chartType} option={{
                backgroundColor: "transparent", tooltip: { trigger: "axis" as const, ...tooltip },
                grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
                xAxis: { type: "category" as const, data: chartData.map((d) => d.name), axisLine: { lineStyle: { color: isDark ? "#4b5563" : "#d1d5db" } }, axisLabel: { color: isDark ? "#d1d5db" : "#374151", fontSize: 13, fontWeight: "bold" as const } },
                yAxis: { type: "value" as const, splitLine: { lineStyle: { color: isDark ? "#374151" : "#e5e7eb", type: "dashed" as const } }, axisLabel: { color: isDark ? "#9ca3af" : "#6b7280" } },
                series: [{
                    type: "bar", barMaxWidth: 60,
                    data: chartData.map((d) => ({ value: d.value, name: d.name, tasks: d.tasks, revenue: d.revenue, fillRate: d.fillRate, itemStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: d.colors[0] }, { offset: 1, color: d.colors[1] }] }, borderRadius: [8, 8, 0, 0] } })),
                    label: { show: true, position: "top" as const, color: isDark ? "#d1d5db" : "#374151", fontWeight: "bold" as const, fontSize: 14 },
                }],
                animationDuration: 800,
            }} style={{ height: 300 }} notMerge lazyUpdate />
        );
    }

    // ── Funnel ──
    if (chartType === "funnel") {
        return (
            <ReactECharts key={chartType} option={{
                backgroundColor: "transparent", tooltip: { trigger: "item" as const, ...tooltip, formatter: ttFormatter },
                legend: { bottom: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, icon: "circle", itemWidth: 8, itemHeight: 8 },
                series: [{
                    type: "funnel", left: "10%", right: "10%", top: 30, bottom: 40, minSize: "20%", maxSize: "100%", sort: "descending" as const, gap: 4,
                    label: { show: true, position: "inside" as const, formatter: "{b}\n{c}", color: "#fff", fontSize: 13, fontWeight: "bold" as const },
                    itemStyle: { borderColor: isDark ? "#1f2937" : "#fff", borderWidth: 2 },
                    data: chartData.map((d) => ({ ...d, itemStyle: { color: d.colors[0] } })),
                }],
                animationDuration: 1000,
            }} style={{ height: 300 }} notMerge lazyUpdate />
        );
    }

    // ── Radar ──
    if (chartType === "radar") {
        const max = Math.max(...chartData.map((d) => d.value)) * 1.3 || 100;
        return (
            <ReactECharts key={chartType} option={{
                backgroundColor: "transparent", tooltip: { ...tooltip },
                radar: { indicator: [{ name: "Completions", max }, { name: "Tasks", max: Math.max(...data.map((d) => d.taskCount)) * 1.3 || 10 }, { name: "Revenue", max: Math.max(...data.map((d) => d.totalRevenue)) * 1.3 || 100 }, { name: "Fill Rate %", max: 100 }], shape: "polygon" as const, splitArea: { areaStyle: { color: isDark ? ["rgba(55,65,81,0.3)", "rgba(55,65,81,0.15)"] : ["rgba(229,231,235,0.5)", "rgba(229,231,235,0.2)"] } }, axisName: { color: isDark ? "#9ca3af" : "#6b7280" } },
                legend: { bottom: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, icon: "circle", itemWidth: 8, itemHeight: 8 },
                series: [{ type: "radar", data: data.map((d, i) => ({ value: [d.totalCompletions, d.taskCount, d.totalRevenue, d.avgFillRate], name: d.platform === "x" ? "X (Twitter)" : "Farcaster", lineStyle: { color: (PLAT_COLORS[d.platform] || ["#6b7280"])[0], width: 2 }, areaStyle: { color: `${(PLAT_COLORS[d.platform] || ["#6b7280"])[0]}30` }, itemStyle: { color: (PLAT_COLORS[d.platform] || ["#6b7280"])[0] } })) }],
                animationDuration: 800,
            }} style={{ height: 300 }} notMerge lazyUpdate />
        );
    }

    // ── Pie (default) ──
    return (
        <ReactECharts key={chartType} option={{
            backgroundColor: "transparent",
            tooltip: { trigger: "item" as const, ...tooltip, formatter: ttFormatter },
            legend: { bottom: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, icon: "circle", itemWidth: 8, itemHeight: 8 },
            series: [{
                type: "pie", radius: ["40%", "72%"], center: ["50%", "45%"], roseType: "area" as const,
                avoidLabelOverlap: true, padAngle: 4, itemStyle: { borderRadius: 8 },
                label: { show: true, position: "outside" as const, formatter: "{b}\n{d}%", color: isDark ? "#d1d5db" : "#374151", fontSize: 12, fontWeight: "bold" as const },
                labelLine: { show: true, lineStyle: { color: isDark ? "#4b5563" : "#d1d5db" } },
                emphasis: { itemStyle: { shadowBlur: 20, shadowColor: "rgba(0,0,0,0.3)" }, scale: true, scaleSize: 8 },
                data: chartData.map((d) => ({ ...d, itemStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: d.colors[0] }, { offset: 1, color: d.colors[1] }] } } })),
                animationType: "expansion" as const, animationDuration: 1000,
            }],
        }} style={{ height: 300 }} notMerge lazyUpdate />
    );
}
