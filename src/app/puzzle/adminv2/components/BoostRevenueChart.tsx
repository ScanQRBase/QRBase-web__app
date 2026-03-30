"use client";

import ReactECharts from "echarts-for-react";
import { useThemeMode } from "./useThemeMode";
import type { ChartType } from "./ChartWrapper";

interface BoostDateData { date: string; count: number; revenue: number; }
interface BoostRevenueChartProps { data: BoostDateData[]; chartType?: ChartType; }

const formatDate = (dateStr: string): string =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export default function BoostRevenueChart({ data, chartType = "bar" }: BoostRevenueChartProps) {
    const mode = useThemeMode();
    const isDark = mode === "dark";
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const dates = sorted.map((d) => formatDate(d.date));

    const tooltip = {
        trigger: "axis" as const,
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        borderColor: isDark ? "#374151" : "#e5e7eb",
        textStyle: { color: isDark ? "#f3f4f6" : "#111827" },
    };
    const legend = { data: ["Boosts", "Revenue ($)"], top: 0, textStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, icon: "circle", itemWidth: 8, itemHeight: 8 };
    const grid = { left: "3%", right: "4%", bottom: "3%", containLabel: true };
    const xAxis = { type: "category" as const, data: dates, axisLine: { lineStyle: { color: isDark ? "#4b5563" : "#d1d5db" } }, axisLabel: { color: isDark ? "#9ca3af" : "#6b7280", fontSize: 11, rotate: 30 } };
    const yAxes = [
        { type: "value" as const, name: "Count", nameTextStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, splitLine: { lineStyle: { color: isDark ? "#374151" : "#e5e7eb", type: "dashed" as const } }, axisLabel: { color: isDark ? "#9ca3af" : "#6b7280" } },
        { type: "value" as const, name: "Revenue ($)", nameTextStyle: { color: isDark ? "#9ca3af" : "#6b7280" }, splitLine: { show: false }, axisLabel: { color: isDark ? "#9ca3af" : "#6b7280", formatter: "${value}" } },
    ];

    const seriesType = chartType === "scatter" ? "scatter" : chartType === "line" ? "line" : "bar";

    const series = [
        {
            name: "Boosts", type: seriesType, yAxisIndex: 0,
            data: sorted.map((d) => d.count),
            ...(seriesType === "bar" ? { itemStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#f59e0b" }, { offset: 1, color: "#d97706" }] }, borderRadius: [4, 4, 0, 0] }, barMaxWidth: 30 } : {}),
            ...(seriesType === "line" ? { smooth: true, lineStyle: { width: 3, color: "#f59e0b" }, itemStyle: { color: "#f59e0b" }, areaStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(245,158,11,0.3)" }, { offset: 1, color: "rgba(245,158,11,0.02)" }] } } } : {}),
            ...(seriesType === "scatter" ? { symbolSize: 12, itemStyle: { color: "#f59e0b" } } : {}),
            emphasis: { focus: "series" as const },
        },
        {
            name: "Revenue ($)", type: seriesType === "bar" ? "line" : seriesType, yAxisIndex: 1,
            smooth: true, symbol: "diamond", symbolSize: 10,
            data: sorted.map((d) => d.revenue),
            lineStyle: { width: 3, color: "#8b5cf6" },
            itemStyle: { color: "#8b5cf6", borderWidth: 2, borderColor: isDark ? "#1f2937" : "#fff" },
            areaStyle: seriesType !== "scatter" ? { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(139,92,246,0.25)" }, { offset: 1, color: "rgba(139,92,246,0.02)" }] } } : undefined,
            emphasis: { focus: "series" as const },
        },
    ];

    return (
        <ReactECharts key={chartType}
            option={{ backgroundColor: "transparent", tooltip, legend, grid, xAxis, yAxis: yAxes, series, animationDuration: 1000 }}
            style={{ height: 320 }}
            notMerge lazyUpdate
        />
    );
}
