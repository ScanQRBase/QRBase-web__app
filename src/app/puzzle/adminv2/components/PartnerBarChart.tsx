"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PartnerData {
    partnerName: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
}

interface PartnerBarChartProps {
    data: PartnerData[];
    onPartnerClick?: (partnerName: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const total = payload.reduce((acc: number, p: any) => acc + p.value, 0);
        const winRate = total > 0 ? ((payload[0]?.value / total) * 100).toFixed(0) : 0;
        return (
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <p className="font-bold text-gray-900 dark:text-white mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-bold">{entry.value}</span>
                    </p>
                ))}
                <p className="text-sm text-gray-500 mt-1">Win Rate: {winRate}%</p>
            </div>
        );
    }
    return null;
};

export default function PartnerBarChart({ data, onPartnerClick }: PartnerBarChartProps) {
    // Sort by games played descending, take top 8
    const sortedData = [...data]
        .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
        .slice(0, 8);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                📊 Partner Performance
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                        onClick={(data) => {
                            if (data?.activeLabel && onPartnerClick) {
                                onPartnerClick(data.activeLabel);
                            }
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={false} />
                        <XAxis type="number" stroke="#6b7280" fontSize={12} />
                        <YAxis
                            type="category"
                            dataKey="partnerName"
                            stroke="#6b7280"
                            fontSize={11}
                            width={80}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                        <Legend iconType="circle" />
                        <Bar
                            dataKey="wins"
                            name="Wins"
                            stackId="a"
                            fill="#22c55e"
                            radius={[0, 0, 0, 0]}
                            animationDuration={800}
                        />
                        <Bar
                            dataKey="losses"
                            name="Losses"
                            stackId="a"
                            fill="#ef4444"
                            radius={[0, 4, 4, 0]}
                            animationDuration={800}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
