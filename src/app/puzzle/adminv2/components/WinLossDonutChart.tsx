"use client";

import ReactECharts from "echarts-for-react";
import { useThemeMode } from "./useThemeMode";
import type { ChartType } from "./ChartWrapper";

interface WinLossDonutChartProps {
    wins: number;
    losses: number;
    chartType?: ChartType;
}

export default function WinLossDonutChart({ wins, losses, chartType = "pie" }: WinLossDonutChartProps) {
    const mode = useThemeMode();
    const isDark = mode === "dark";
    const total = wins + losses;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0";

    const tooltip = {
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        borderColor: isDark ? "#374151" : "#e5e7eb",
        textStyle: { color: isDark ? "#f3f4f6" : "#111827" },
    };

    // ── Funnel ──
    if (chartType === "funnel") {
        return (
            <ReactECharts key={chartType}
                option={{
                    backgroundColor: "transparent",
                    tooltip: { trigger: "item" as const, ...tooltip, formatter: "{b}: {c} ({d}%)" },
                    legend: { bottom: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, icon: "circle", itemWidth: 8, itemHeight: 8 },
                    series: [{
                        type: "funnel", left: "10%", right: "10%", top: 40, bottom: 40,
                        minSize: "20%", maxSize: "100%", sort: "descending" as const, gap: 4,
                        label: { show: true, position: "inside" as const, formatter: "{b}\n{c}", color: "#fff", fontSize: 13, fontWeight: "bold" as const },
                        itemStyle: { borderColor: isDark ? "#1f2937" : "#fff", borderWidth: 2 },
                        data: [
                            { value: total, name: "Total Games", itemStyle: { color: "#3b82f6" } },
                            { value: wins, name: "Wins", itemStyle: { color: "#22c55e" } },
                            { value: losses, name: "Losses", itemStyle: { color: "#ef4444" } },
                        ],
                    }],
                    animationDuration: 1000,
                }}
                style={{ height: 300 }}
                notMerge
                lazyUpdate
            />
        );
    }

    // ── Radar ──
    if (chartType === "radar") {
        const maxVal = Math.max(wins, losses, total) * 1.2 || 100;
        return (
            <ReactECharts key={chartType}
                option={{
                    backgroundColor: "transparent",
                    tooltip: { ...tooltip },
                    radar: {
                        indicator: [
                            { name: "Wins", max: maxVal },
                            { name: "Losses", max: maxVal },
                            { name: "Total", max: maxVal },
                            { name: "Win Rate %", max: 100 },
                        ],
                        shape: "polygon" as const,
                        splitArea: { areaStyle: { color: isDark ? ["rgba(55,65,81,0.3)", "rgba(55,65,81,0.15)"] : ["rgba(229,231,235,0.5)", "rgba(229,231,235,0.2)"] } },
                        axisName: { color: isDark ? "#9ca3af" : "#6b7280" },
                    },
                    series: [{
                        type: "radar",
                        data: [{
                            value: [wins, losses, total, parseFloat(winRate)],
                            name: "Performance",
                            lineStyle: { color: "#3b82f6", width: 2 },
                            areaStyle: { color: "rgba(59,130,246,0.25)" },
                            itemStyle: { color: "#3b82f6" },
                        }],
                    }],
                    animationDuration: 800,
                }}
                style={{ height: 300 }}
                notMerge
                lazyUpdate
            />
        );
    }

    // ── Bar ──
    if (chartType === "bar") {
        return (
            <ReactECharts key={chartType}
                option={{
                    backgroundColor: "transparent",
                    tooltip: { trigger: "axis" as const, ...tooltip },
                    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
                    xAxis: {
                        type: "category" as const, data: ["Wins", "Losses"],
                        axisLine: { lineStyle: { color: isDark ? "#4b5563" : "#d1d5db" } },
                        axisLabel: { color: isDark ? "#d1d5db" : "#374151", fontSize: 13, fontWeight: "bold" as const },
                    },
                    yAxis: {
                        type: "value" as const,
                        splitLine: { lineStyle: { color: isDark ? "#374151" : "#e5e7eb", type: "dashed" as const } },
                        axisLabel: { color: isDark ? "#9ca3af" : "#6b7280" },
                    },
                    series: [{
                        type: "bar", barMaxWidth: 60,
                        data: [
                            { value: wins, itemStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#22c55e" }, { offset: 1, color: "#16a34a" }] }, borderRadius: [8, 8, 0, 0] } },
                            { value: losses, itemStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#ef4444" }, { offset: 1, color: "#dc2626" }] }, borderRadius: [8, 8, 0, 0] } },
                        ],
                        label: { show: true, position: "top" as const, color: isDark ? "#d1d5db" : "#374151", fontWeight: "bold" as const, fontSize: 14 },
                    }],
                    animationDuration: 800,
                }}
                style={{ height: 300 }}
                notMerge
                lazyUpdate
            />
        );
    }

    // ── Pie (default) ──
    return (
        <ReactECharts key={chartType}
            option={{
                backgroundColor: "transparent",
                tooltip: { trigger: "item" as const, ...tooltip, formatter: "{b}: {c} ({d}%)" },
                legend: { bottom: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, icon: "circle", itemWidth: 8, itemHeight: 8 },
                graphic: [
                    { type: "text" as const, left: "center", top: "38%", style: { text: `${winRate}%`, textAlign: "center" as const, fill: isDark ? "#ffffff" : "#111827", fontSize: 28, fontWeight: "bold" as const, fontFamily: "system-ui, sans-serif" } },
                    { type: "text" as const, left: "center", top: "50%", style: { text: "Win Rate", textAlign: "center" as const, fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 13, fontFamily: "system-ui, sans-serif" } },
                ],
                series: [{
                    name: "Win/Loss", type: "pie", radius: ["55%", "78%"], center: ["50%", "45%"],
                    avoidLabelOverlap: false, padAngle: 3, itemStyle: { borderRadius: 6 },
                    label: { show: false },
                    emphasis: { itemStyle: { shadowBlur: 20, shadowOffsetX: 0, shadowColor: "rgba(0, 0, 0, 0.3)" }, scale: true, scaleSize: 6 },
                    data: [
                        { value: wins, name: "Wins", itemStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: "#22c55e" }, { offset: 1, color: "#16a34a" }] } } },
                        { value: losses, name: "Losses", itemStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: "#ef4444" }, { offset: 1, color: "#dc2626" }] } } },
                    ],
                    animationType: "expansion" as const, animationDuration: 1200,
                }],
            }}
            style={{ height: 300 }}
            notMerge
            lazyUpdate
        />
    );
}
