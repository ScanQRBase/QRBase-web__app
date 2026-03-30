"use client";

import ReactECharts from "echarts-for-react";
import { useThemeMode } from "./useThemeMode";
import type { ChartType } from "./ChartWrapper";

interface PartnerData {
    partnerName: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
}

interface PartnerPerformanceChartProps {
    data: PartnerData[];
    chartType?: ChartType;
    onPartnerClick?: (partnerName: string) => void;
}

const COLORS = ["#3b82f6", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function PartnerPerformanceChart({ data, chartType = "bar", onPartnerClick }: PartnerPerformanceChartProps) {
    const mode = useThemeMode();
    const isDark = mode === "dark";
    const sorted = [...data].sort((a, b) => b.gamesPlayed - a.gamesPlayed).slice(0, 10);
    const partners = sorted.map((d) => d.partnerName);

    const tooltip = {
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        borderColor: isDark ? "#374151" : "#e5e7eb",
        textStyle: { color: isDark ? "#f3f4f6" : "#111827" },
    };

    const onEvents = onPartnerClick ? { click: (params: any) => { if (params.name) onPartnerClick(params.name); } } : undefined;

    // ── Pie ──
    if (chartType === "pie") {
        return (
            <ReactECharts key={chartType}
                option={{
                    backgroundColor: "transparent",
                    tooltip: { trigger: "item" as const, ...tooltip, formatter: "{b}: {c} games ({d}%)" },
                    legend: { bottom: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280", fontSize: 10 }, icon: "circle", itemWidth: 8, itemHeight: 8, type: "scroll" as const },
                    series: [{
                        type: "pie", radius: ["30%", "70%"], center: ["50%", "42%"],
                        roseType: "radius" as const, padAngle: 2, itemStyle: { borderRadius: 6 },
                        label: { show: true, formatter: "{b}", color: isDark ? "#d1d5db" : "#374151", fontSize: 11 },
                        labelLine: { lineStyle: { color: isDark ? "#4b5563" : "#d1d5db" } },
                        emphasis: { itemStyle: { shadowBlur: 15, shadowColor: "rgba(0,0,0,0.3)" }, scale: true, scaleSize: 6 },
                        data: sorted.map((d, i) => ({ value: d.gamesPlayed, name: d.partnerName, itemStyle: { color: COLORS[i % COLORS.length] } })),
                        animationType: "expansion" as const, animationDuration: 1000,
                    }],
                }}
                style={{ height: Math.max(300, sorted.length * 30) }}
                notMerge lazyUpdate onEvents={onEvents}
            />
        );
    }

    // ── Radar ──
    if (chartType === "radar") {
        const maxPlays = Math.max(...sorted.map((d) => d.gamesPlayed)) * 1.2 || 100;
        const indicators = sorted.map((d) => ({ name: d.partnerName, max: maxPlays }));
        return (
            <ReactECharts key={chartType}
                option={{
                    backgroundColor: "transparent",
                    tooltip: { ...tooltip },
                    legend: { data: ["Wins", "Losses"], top: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, icon: "circle", itemWidth: 8, itemHeight: 8 },
                    radar: { indicator: indicators, shape: "polygon" as const, splitArea: { areaStyle: { color: isDark ? ["rgba(55,65,81,0.3)", "rgba(55,65,81,0.15)"] : ["rgba(229,231,235,0.5)", "rgba(229,231,235,0.2)"] } }, axisName: { color: isDark ? "#9ca3af" : "#6b7280", fontSize: 10 } },
                    series: [{
                        type: "radar",
                        data: [
                            { value: sorted.map((d) => d.wins), name: "Wins", lineStyle: { color: "#22c55e", width: 2 }, areaStyle: { color: "rgba(34,197,94,0.2)" }, itemStyle: { color: "#22c55e" } },
                            { value: sorted.map((d) => d.losses), name: "Losses", lineStyle: { color: "#ef4444", width: 2 }, areaStyle: { color: "rgba(239,68,68,0.15)" }, itemStyle: { color: "#ef4444" } },
                        ],
                    }],
                    animationDuration: 800,
                }}
                style={{ height: 350 }}
                notMerge lazyUpdate onEvents={onEvents}
            />
        );
    }

    // ── Scatter ──
    if (chartType === "scatter") {
        return (
            <ReactECharts key={chartType}
                option={{
                    backgroundColor: "transparent",
                    tooltip: {
                        ...tooltip,
                        formatter: (params: any) => `<strong>${sorted[params.dataIndex]?.partnerName || ""}</strong><br/>Wins: ${params.value[0]}<br/>Losses: ${params.value[1]}`,
                    },
                    grid: { left: "3%", right: "6%", bottom: "3%", containLabel: true },
                    xAxis: { type: "value" as const, name: "Wins", nameTextStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, splitLine: { lineStyle: { color: isDark ? "#374151" : "#e5e7eb", type: "dashed" as const } }, axisLabel: { color: isDark ? "#9ca3af" : "#6b7280" } },
                    yAxis: { type: "value" as const, name: "Losses", nameTextStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, splitLine: { lineStyle: { color: isDark ? "#374151" : "#e5e7eb", type: "dashed" as const } }, axisLabel: { color: isDark ? "#9ca3af" : "#6b7280" } },
                    series: [{
                        type: "scatter", symbolSize: (val: number[]) => Math.max(12, (val[0] + val[1]) / 2),
                        data: sorted.map((d, i) => ({ value: [d.wins, d.losses], itemStyle: { color: COLORS[i % COLORS.length] } })),
                        label: { show: true, formatter: (p: any) => sorted[p.dataIndex]?.partnerName || "", position: "top" as const, color: isDark ? "#d1d5db" : "#374151", fontSize: 10 },
                    }],
                    animationDuration: 800,
                }}
                style={{ height: 350 }}
                notMerge lazyUpdate onEvents={onEvents}
            />
        );
    }

    // ── Line ──
    if (chartType === "line") {
        return (
            <ReactECharts key={chartType}
                option={{
                    backgroundColor: "transparent",
                    tooltip: { trigger: "axis" as const, axisPointer: { type: "shadow" as const }, ...tooltip },
                    legend: { data: ["Wins", "Losses"], top: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, icon: "circle", itemWidth: 8, itemHeight: 8 },
                    grid: { left: "3%", right: "6%", bottom: "3%", containLabel: true },
                    xAxis: { type: "category" as const, data: partners, axisLine: { lineStyle: { color: isDark ? "#4b5563" : "#d1d5db" } }, axisLabel: { color: isDark ? "#d1d5db" : "#374151", fontSize: 10, rotate: 30, width: 60, overflow: "truncate" as const } },
                    yAxis: { type: "value" as const, splitLine: { lineStyle: { color: isDark ? "#374151" : "#e5e7eb", type: "dashed" as const } }, axisLabel: { color: isDark ? "#9ca3af" : "#6b7280" } },
                    series: [
                        { name: "Wins", type: "line", smooth: true, data: sorted.map((d) => d.wins), lineStyle: { width: 3, color: "#22c55e" }, itemStyle: { color: "#22c55e" }, areaStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(34,197,94,0.3)" }, { offset: 1, color: "rgba(34,197,94,0.02)" }] } } },
                        { name: "Losses", type: "line", smooth: true, data: sorted.map((d) => d.losses), lineStyle: { width: 3, color: "#ef4444" }, itemStyle: { color: "#ef4444" }, areaStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(239,68,68,0.25)" }, { offset: 1, color: "rgba(239,68,68,0.02)" }] } } },
                    ],
                    animationDuration: 800,
                }}
                style={{ height: Math.max(280, sorted.length * 25) }}
                notMerge lazyUpdate onEvents={onEvents}
            />
        );
    }

    // ── Bar (default) ──
    return (
        <ReactECharts key={chartType}
            option={{
                backgroundColor: "transparent",
                tooltip: {
                    trigger: "axis" as const, axisPointer: { type: "shadow" as const }, ...tooltip,
                    formatter: (params: any[]) => {
                        const name = params[0]?.axisValue || "";
                        const wins = params.find((p: any) => p.seriesName === "Wins")?.value || 0;
                        const losses = params.find((p: any) => p.seriesName === "Losses")?.value || 0;
                        const total = wins + losses;
                        const wr = total > 0 ? ((wins / total) * 100).toFixed(0) : 0;
                        return `<strong>${name}</strong><br/>Wins: <span style="color:#22c55e;font-weight:bold">${wins}</span><br/>Losses: <span style="color:#ef4444;font-weight:bold">${losses}</span><br/>Win Rate: ${wr}%`;
                    },
                },
                legend: { data: ["Wins", "Losses"], top: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, icon: "circle", itemWidth: 8, itemHeight: 8 },
                grid: { left: "3%", right: "6%", bottom: "3%", containLabel: true },
                xAxis: { type: "value" as const, splitLine: { lineStyle: { color: isDark ? "#374151" : "#e5e7eb", type: "dashed" as const } }, axisLabel: { color: isDark ? "#9ca3af" : "#6b7280" } },
                yAxis: { type: "category" as const, data: partners, inverse: true, axisLine: { lineStyle: { color: isDark ? "#4b5563" : "#d1d5db" } }, axisLabel: { color: isDark ? "#d1d5db" : "#374151", fontSize: 11, width: 80, overflow: "truncate" as const } },
                series: [
                    { name: "Wins", type: "bar", stack: "total", data: sorted.map((d) => d.wins), itemStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#22c55e" }, { offset: 1, color: "#16a34a" }] }, borderRadius: [0, 0, 0, 0] }, emphasis: { focus: "series" as const }, barMaxWidth: 20 },
                    { name: "Losses", type: "bar", stack: "total", data: sorted.map((d) => d.losses), itemStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#ef4444" }, { offset: 1, color: "#dc2626" }] }, borderRadius: [0, 4, 4, 0] }, emphasis: { focus: "series" as const }, barMaxWidth: 20 },
                ],
                animationDuration: 800, animationEasing: "cubicOut" as const,
            }}
            style={{ height: Math.max(250, sorted.length * 35) }}
            notMerge lazyUpdate onEvents={onEvents}
        />
    );
}
