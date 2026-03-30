"use client";

import ReactECharts from "echarts-for-react";
import { useThemeMode } from "./useThemeMode";
import type { ChartType } from "./ChartWrapper";

interface ReferralData { referrerId: string; displayName: string | null; totalReferrals: number; totalEarnings: number; }
interface ReferralChartProps { data: ReferralData[]; chartType?: ChartType; }

function parseDisplayName(name: string | null): string {
    if (!name) return "";
    if (name.includes(":")) { const parts = name.split(":"); return parts[parts.length - 1].trim(); }
    return name;
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899", "#14b8a6", "#f97316"];

export default function ReferralChart({ data, chartType = "bar" }: ReferralChartProps) {
    const mode = useThemeMode();
    const isDark = mode === "dark";
    const top = [...data].sort((a, b) => b.totalEarnings - a.totalEarnings).slice(0, 10);
    const names = top.map((d) => parseDisplayName(d.displayName) || d.referrerId.slice(0, 12) + "...");

    const tooltip = { backgroundColor: isDark ? "#1f2937" : "#ffffff", borderColor: isDark ? "#374151" : "#e5e7eb", textStyle: { color: isDark ? "#f3f4f6" : "#111827" } };

    if (top.length === 0) {
        return <div className="text-center text-gray-500 dark:text-gray-400 py-8">No referral data yet</div>;
    }

    // ── Pie ──
    if (chartType === "pie") {
        return (
            <ReactECharts key={chartType} option={{
                backgroundColor: "transparent", tooltip: { trigger: "item" as const, ...tooltip, formatter: "{b}: {c} $SCAN ({d}%)" },
                legend: { bottom: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280", fontSize: 10 }, icon: "circle", itemWidth: 8, itemHeight: 8, type: "scroll" as const },
                series: [{ type: "pie", radius: ["30%", "70%"], center: ["50%", "42%"], padAngle: 2, itemStyle: { borderRadius: 6 },
                    label: { show: true, formatter: "{b}", color: isDark ? "#d1d5db" : "#374151", fontSize: 10 },
                    labelLine: { lineStyle: { color: isDark ? "#4b5563" : "#d1d5db" } },
                    emphasis: { itemStyle: { shadowBlur: 15, shadowColor: "rgba(0,0,0,0.3)" }, scale: true, scaleSize: 6 },
                    data: top.map((d, i) => ({ value: d.totalEarnings, name: names[i], itemStyle: { color: COLORS[i % COLORS.length] } })),
                    animationType: "expansion" as const, animationDuration: 1000,
                }],
            }} style={{ height: Math.max(300, top.length * 30) }} notMerge lazyUpdate />
        );
    }

    // ── Scatter ──
    if (chartType === "scatter") {
        return (
            <ReactECharts key={chartType} option={{
                backgroundColor: "transparent",
                tooltip: { ...tooltip, formatter: (params: any) => `<strong>${names[params.dataIndex]}</strong><br/>Referrals: ${params.value[0]}<br/>Earnings: ${params.value[1]} $SCAN` },
                grid: { left: "3%", right: "6%", bottom: "3%", containLabel: true },
                xAxis: { type: "value" as const, name: "Referrals", nameTextStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, splitLine: { lineStyle: { color: isDark ? "#374151" : "#e5e7eb", type: "dashed" as const } }, axisLabel: { color: isDark ? "#9ca3af" : "#6b7280" } },
                yAxis: { type: "value" as const, name: "Earnings", nameTextStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, splitLine: { lineStyle: { color: isDark ? "#374151" : "#e5e7eb", type: "dashed" as const } }, axisLabel: { color: isDark ? "#9ca3af" : "#6b7280" } },
                series: [{ type: "scatter", symbolSize: (val: number[]) => Math.max(14, val[1] / 100), data: top.map((d, i) => ({ value: [d.totalReferrals, d.totalEarnings], itemStyle: { color: COLORS[i % COLORS.length] } })),
                    label: { show: true, formatter: (p: any) => names[p.dataIndex], position: "top" as const, color: isDark ? "#d1d5db" : "#374151", fontSize: 10 },
                }],
                animationDuration: 800,
            }} style={{ height: Math.max(300, top.length * 30) }} notMerge lazyUpdate />
        );
    }

    // ── Line ──
    if (chartType === "line") {
        return (
            <ReactECharts key={chartType} option={{
                backgroundColor: "transparent", tooltip: { trigger: "axis" as const, ...tooltip },
                legend: { data: ["Referrals", "Earnings ($SCAN)"], top: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, icon: "circle", itemWidth: 8, itemHeight: 8 },
                grid: { left: "3%", right: "6%", bottom: "3%", containLabel: true },
                xAxis: { type: "category" as const, data: names, axisLine: { lineStyle: { color: isDark ? "#4b5563" : "#d1d5db" } }, axisLabel: { color: isDark ? "#d1d5db" : "#374151", fontSize: 10, rotate: 30 } },
                yAxis: { type: "value" as const, splitLine: { lineStyle: { color: isDark ? "#374151" : "#e5e7eb", type: "dashed" as const } }, axisLabel: { color: isDark ? "#9ca3af" : "#6b7280" } },
                series: [
                    { name: "Referrals", type: "line", smooth: true, data: top.map((d) => d.totalReferrals), lineStyle: { width: 3, color: "#3b82f6" }, itemStyle: { color: "#3b82f6" }, areaStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(59,130,246,0.3)" }, { offset: 1, color: "rgba(59,130,246,0.02)" }] } } },
                    { name: "Earnings ($SCAN)", type: "line", smooth: true, data: top.map((d) => d.totalEarnings), lineStyle: { width: 3, color: "#22c55e" }, itemStyle: { color: "#22c55e" }, areaStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(34,197,94,0.3)" }, { offset: 1, color: "rgba(34,197,94,0.02)" }] } } },
                ],
                animationDuration: 800,
            }} style={{ height: Math.max(280, top.length * 25) }} notMerge lazyUpdate />
        );
    }

    // ── Bar (default) ──
    return (
        <ReactECharts key={chartType} option={{
            backgroundColor: "transparent", tooltip: { trigger: "axis" as const, axisPointer: { type: "shadow" as const }, ...tooltip },
            legend: { data: ["Referrals", "Earnings ($SCAN)"], top: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, icon: "circle", itemWidth: 8, itemHeight: 8 },
            grid: { left: "3%", right: "6%", bottom: "3%", containLabel: true },
            xAxis: { type: "value" as const, splitLine: { lineStyle: { color: isDark ? "#374151" : "#e5e7eb", type: "dashed" as const } }, axisLabel: { color: isDark ? "#9ca3af" : "#6b7280" } },
            yAxis: { type: "category" as const, data: names, inverse: true, axisLine: { lineStyle: { color: isDark ? "#4b5563" : "#d1d5db" } }, axisLabel: { color: isDark ? "#d1d5db" : "#374151", fontSize: 11, width: 90, overflow: "truncate" as const } },
            series: [
                { name: "Referrals", type: "bar", data: top.map((d) => d.totalReferrals), itemStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#3b82f6" }, { offset: 1, color: "#2563eb" }] }, borderRadius: [0, 4, 4, 0] }, barMaxWidth: 14, emphasis: { focus: "series" as const } },
                { name: "Earnings ($SCAN)", type: "bar", data: top.map((d) => d.totalEarnings), itemStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#22c55e" }, { offset: 1, color: "#16a34a" }] }, borderRadius: [0, 4, 4, 0] }, barMaxWidth: 14, emphasis: { focus: "series" as const } },
            ],
            animationDuration: 800,
        }} style={{ height: Math.max(250, top.length * 40) }} notMerge lazyUpdate />
    );
}
