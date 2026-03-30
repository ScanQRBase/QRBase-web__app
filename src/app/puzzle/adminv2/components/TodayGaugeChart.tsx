"use client";

import ReactECharts from "echarts-for-react";
import { useThemeMode } from "./useThemeMode";
import type { ChartType } from "./ChartWrapper";

interface TodayGaugeChartProps { wins: number; losses: number; plays: number; chartType?: ChartType; }

export default function TodayGaugeChart({ wins, losses, plays, chartType = "gauge" }: TodayGaugeChartProps) {
    const mode = useThemeMode();
    const isDark = mode === "dark";
    const total = wins + losses;
    const winRate = total > 0 ? parseFloat(((wins / total) * 100).toFixed(1)) : 0;

    // ── Bar ──
    if (chartType === "bar") {
        return (
            <ReactECharts key={chartType} option={{
                backgroundColor: "transparent",
                tooltip: { trigger: "axis" as const, backgroundColor: isDark ? "#1f2937" : "#ffffff", borderColor: isDark ? "#374151" : "#e5e7eb", textStyle: { color: isDark ? "#f3f4f6" : "#111827" } },
                grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
                xAxis: { type: "category" as const, data: ["Plays", "Wins", "Losses"], axisLine: { lineStyle: { color: isDark ? "#4b5563" : "#d1d5db" } }, axisLabel: { color: isDark ? "#d1d5db" : "#374151", fontSize: 13, fontWeight: "bold" as const } },
                yAxis: { type: "value" as const, splitLine: { lineStyle: { color: isDark ? "#374151" : "#e5e7eb", type: "dashed" as const } }, axisLabel: { color: isDark ? "#9ca3af" : "#6b7280" } },
                series: [{ type: "bar", barMaxWidth: 50, data: [
                    { value: plays, itemStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#3b82f6" }, { offset: 1, color: "#2563eb" }] }, borderRadius: [8, 8, 0, 0] } },
                    { value: wins, itemStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#22c55e" }, { offset: 1, color: "#16a34a" }] }, borderRadius: [8, 8, 0, 0] } },
                    { value: losses, itemStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#ef4444" }, { offset: 1, color: "#dc2626" }] }, borderRadius: [8, 8, 0, 0] } },
                ], label: { show: true, position: "top" as const, color: isDark ? "#d1d5db" : "#374151", fontWeight: "bold" as const, fontSize: 14 } }],
                animationDuration: 800,
            }} style={{ height: 280 }} notMerge lazyUpdate />
        );
    }

    // ── Pie ──
    if (chartType === "pie") {
        return (
            <ReactECharts key={chartType} option={{
                backgroundColor: "transparent",
                tooltip: { trigger: "item" as const, backgroundColor: isDark ? "#1f2937" : "#ffffff", borderColor: isDark ? "#374151" : "#e5e7eb", textStyle: { color: isDark ? "#f3f4f6" : "#111827" }, formatter: "{b}: {c} ({d}%)" },
                legend: { bottom: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, icon: "circle", itemWidth: 8, itemHeight: 8 },
                graphic: [
                    { type: "text" as const, left: "center", top: "38%", style: { text: `${winRate}%`, textAlign: "center" as const, fill: isDark ? "#ffffff" : "#111827", fontSize: 28, fontWeight: "bold" as const, fontFamily: "system-ui, sans-serif" } },
                    { type: "text" as const, left: "center", top: "50%", style: { text: "Win Rate", textAlign: "center" as const, fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 13, fontFamily: "system-ui, sans-serif" } },
                ],
                series: [{
                    type: "pie", radius: ["55%", "78%"], center: ["50%", "45%"], padAngle: 3, itemStyle: { borderRadius: 6 },
                    label: { show: false },
                    emphasis: { itemStyle: { shadowBlur: 20, shadowColor: "rgba(0,0,0,0.3)" }, scale: true, scaleSize: 6 },
                    data: [
                        { value: wins, name: "Wins", itemStyle: { color: "#22c55e" } },
                        { value: losses, name: "Losses", itemStyle: { color: "#ef4444" } },
                    ],
                    animationType: "expansion" as const, animationDuration: 1200,
                }],
            }} style={{ height: 280 }} notMerge lazyUpdate />
        );
    }

    // ── Gauge (default) ──
    return (
        <ReactECharts key={chartType} option={{
            backgroundColor: "transparent",
            series: [{
                type: "gauge", startAngle: 200, endAngle: -20, min: 0, max: 100,
                center: ["50%", "55%"], radius: "90%", splitNumber: 5,
                axisLine: { lineStyle: { width: 18, color: [[0.3, "#ef4444"], [0.5, "#f59e0b"], [0.7, "#eab308"], [1, "#22c55e"]] } },
                pointer: { icon: "path://M2090.36389,615.30999 L2## M12.8,0.029c7.1,0,12.8,5.7,12.8,12.8c0,7.1-5.7,12.8-12.8,12.8S0,19.929,0,12.829C0,5.729,5.7,0.029,12.8,0.029z##", length: "70%", width: 6, offsetCenter: [0, "-5%"], itemStyle: { color: isDark ? "#e5e7eb" : "#374151" } },
                axisTick: { length: 8, lineStyle: { color: "auto", width: 1.5 } },
                splitLine: { length: 14, lineStyle: { color: "auto", width: 2 } },
                axisLabel: { color: isDark ? "#9ca3af" : "#6b7280", fontSize: 11, distance: 22, formatter: "{value}%" },
                title: { show: true, offsetCenter: [0, "70%"], fontSize: 13, color: isDark ? "#9ca3af" : "#6b7280" },
                detail: { fontSize: 32, fontWeight: "bold" as const, offsetCenter: [0, "35%"], valueAnimation: true, formatter: "{value}%", color: isDark ? "#ffffff" : "#111827" },
                data: [{ value: winRate, name: "Today's Win Rate" }],
                animationDuration: 1500, animationEasing: "elasticOut" as const,
            }],
        }} style={{ height: 280 }} notMerge lazyUpdate />
    );
}
