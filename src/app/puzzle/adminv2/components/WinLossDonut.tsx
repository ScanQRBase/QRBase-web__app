"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface WinLossDonutProps {
    wins: number;
    losses: number;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm" style={{ color: payload[0].payload.fill }}>
                    {payload[0].name}: <span className="font-bold">{payload[0].value}</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function WinLossDonut({ wins, losses }: WinLossDonutProps) {
    const data = [
        { name: 'Wins', value: wins, fill: '#22c55e' },
        { name: 'Losses', value: losses, fill: '#ef4444' },
    ];

    const total = wins + losses;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                🍩 Win/Loss Ratio
            </h3>
            <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={800}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            iconType="circle"
                            wrapperStyle={{ bottom: 0 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{winRate}%</div>
                        <div className="text-sm text-gray-500">Win Rate</div>
                    </div>
                </div>
            </div>
            {/* Stats below */}
            <div className="flex justify-center gap-8 mt-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{wins.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Victories</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{losses.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Defeats</div>
                </div>
            </div>
        </div>
    );
}
