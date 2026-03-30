"use client";

import ReactECharts from "echarts-for-react";
import { useThemeMode } from "./useThemeMode";
import type { ChartType } from "./ChartWrapper";

interface DayData {
    date: string;
    plays: number;
    wins: number;
    losses: number;
}

interface DailyTrendChartProps {
    data: DayData[];
    chartType?: ChartType;
}

const formatDate = (dateStr: string): string =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const COLORS = { plays: "#3b82f6", wins: "#22c55e", losses: "#ef4444" };

function makeAreaGradient(color: string, opacity = 0.3) {
    return {
        type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
            { offset: 0, color: color.replace(")", `, ${opacity})`).replace("rgb", "rgba").replace("#", "").length ? `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}` : color },
            { offset: 1, color: `${color}05` },
        ],
    };
}

export default function DailyTrendChart({ data, chartType = "line" }: DailyTrendChartProps) {
    const mode = useThemeMode();
    const isDark = mode === "dark";
    const dates = data.map((d) => formatDate(d.date));
    const names = ["Plays", "Wins", "Losses"] as const;
    const keys = ["plays", "wins", "losses"] as const;
    const colors = [COLORS.plays, COLORS.wins, COLORS.losses];

    // Radar needs indicator + radar axis
    if (chartType === "radar") {
        const indicators = dates.map((d) => ({ name: d, max: Math.max(...data.map((x) => x.plays)) * 1.2 || 100 }));
        return (
            <ReactECharts
                key={chartType}
                option={{
                    backgroundColor: "transparent",
                    tooltip: { trigger: "item" },
                    legend: { data: [...names], top: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, icon: "circle", itemWidth: 8, itemHeight: 8 },
                    radar: { indicator: indicators, shape: "polygon" as const, splitArea: { areaStyle: { color: isDark ? ["rgba(55,65,81,0.3)", "rgba(55,65,81,0.15)"] : ["rgba(229,231,235,0.5)", "rgba(229,231,235,0.2)"] } }, axisName: { color: isDark ? "#9ca3af" : "#6b7280", fontSize: 10 } },
                    series: [{ type: "radar", data: names.map((n, i) => ({ value: data.map((d) => d[keys[i]]), name: n, lineStyle: { color: colors[i], width: 2 }, areaStyle: { color: `${colors[i]}30` }, itemStyle: { color: colors[i] } })) }],
                    animationDuration: 800,
                }}
                style={{ height: 320 }}
                notMerge
                lazyUpdate
            />
        );
    }

    // Bar / Line / Scatter
    const seriesType = chartType === "scatter" ? "scatter" : chartType === "bar" ? "bar" : "line";

    const series = names.map((name, i) => ({
        name,
        type: seriesType,
        smooth: seriesType === "line",
        symbol: seriesType === "scatter" ? "circle" : "circle",
        symbolSize: seriesType === "scatter" ? 10 : 8,
        lineStyle: seriesType === "line" ? { width: 3, color: colors[i] } : undefined,
        itemStyle: {
            color: colors[i],
            borderWidth: 2,
            borderColor: isDark ? "#1f2937" : "#fff",
            ...(seriesType === "bar" ? { borderRadius: [4, 4, 0, 0] } : {}),
        },
        areaStyle: seriesType === "line" ? {
            color: {
                type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                    { offset: 0, color: `${colors[i]}50` },
                    { offset: 1, color: `${colors[i]}05` },
                ],
            },
        } : undefined,
        barMaxWidth: 20,
        data: data.map((d) => d[keys[i]]),
        emphasis: { focus: "series" as const },
    }));

    const option = {
        backgroundColor: "transparent",
        tooltip: {
            trigger: "axis" as const,
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
            borderColor: isDark ? "#374151" : "#e5e7eb",
            textStyle: { color: isDark ? "#f3f4f6" : "#111827" },
            axisPointer: { type: "cross", crossStyle: { color: "#999" } },
        },
        legend: { data: [...names], top: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, icon: "circle", itemWidth: 8, itemHeight: 8 },
        grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
        xAxis: {
            type: "category" as const, data: dates,
            axisLine: { lineStyle: { color: isDark ? "#4b5563" : "#d1d5db" } },
            axisLabel: { color: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 },
        },
        yAxis: {
            type: "value" as const,
            splitLine: { lineStyle: { color: isDark ? "#374151" : "#e5e7eb", type: "dashed" as const } },
            axisLabel: { color: isDark ? "#9ca3af" : "#6b7280" },
        },
        series,
        animationDuration: 1000,
        animationEasing: "cubicInOut" as const,
    };

    return <ReactECharts key={chartType} option={option} style={{ height: 320 }} notMerge lazyUpdate />;
}
