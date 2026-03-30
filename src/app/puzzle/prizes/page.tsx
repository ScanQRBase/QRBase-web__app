"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import PuzzleFooter from "@/src/app/components/puzzle/PuzzleFooter";
import { QrBaseBanner } from "@/src/app/components/puzzle/PuzzleBanner";
import QrBaseNavbar from "@/src/app/components/puzzle/PuzzleNavbar";
import { usePuzzleData } from "@/src/app/lib/context/PuzzleDataContext";
import { formatNumber } from "@/src/app/lib/formatNumber";

// Animated number component
function AnimatedNumber({ value, duration = 500 }: { value: number; duration?: number }) {
    const [displayValue, setDisplayValue] = useState(value);
    const prevValueRef = useRef(value);

    useEffect(() => {
        const startValue = prevValueRef.current;
        const diff = value - startValue;
        if (diff === 0) return;

        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setDisplayValue(Math.round(startValue + diff * eased));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        prevValueRef.current = value;
    }, [value, duration]);

    return <>{formatNumber(displayValue)}</>;
}



// Skeleton loader component
function SkeletonRow() {
    return (
        <tr className="border-b border-gray-200 dark:border-gray-700 animate-pulse">
            <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
            </td>
            <td className="px-3 py-3">
                <div className="flex flex-col items-center gap-1">
                    <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
            </td>
            <td className="px-3 py-3 text-right">
                <div className="inline-block w-14 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </td>
        </tr>
    );
}

export default function PrizesPage() {
    const [boostTimeLeft, setBoostTimeLeft] = useState<string>("");

    // Use shared context for synchronized data
    const { prizes: allPrizes, activeBoost, loading, pricesLoading, realtimeConnected } = usePuzzleData();

    // QUICK ROUND: Only show scan mode tokens in prizes page
    const prizes = allPrizes.filter(p => p.scanMode);

    // Update boost countdown timer
    useEffect(() => {
        if (!activeBoost?.endsAt) return;

        const updateTimer = () => {
            const end = new Date(activeBoost.endsAt).getTime();
            const now = Date.now();
            const diff = end - now;

            if (diff <= 0) {
                setBoostTimeLeft("Ended");
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setBoostTimeLeft(`${hours}h ${minutes}m left`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, [activeBoost?.endsAt]);

    // Find boosted token in prizes
    const boostedPrize = activeBoost
        ? prizes.find(p => p.token.toLowerCase().includes(activeBoost.partnerName.toLowerCase()))
        : null;

    return (
        <div className="flex min-h-screen flex-col font-sansMono bg-[#F7F8FD] dark:bg-gray-900 pb-28">
            <QrBaseBanner round="1" isCompleted={false} />
            <QrBaseNavbar />

            <main className="flex-1 pt-28 px-4 max-w-lg mx-auto w-full">
                {/* Header Icon */}


                <h1 className="text-xl font-bold text-center mb-4 dark:text-white flex items-center justify-center gap-2">
                    <Image
                        src="/images/puzzle/navbar/TreasureChest.svg"
                        alt="Prizes"
                        width={28}
                        height={28}
                        style={{ filter: 'brightness(0) saturate(100%) invert(17%) sepia(90%) saturate(5735%) hue-rotate(220deg) brightness(100%) contrast(106%)' }}
                    />
                    Prize Pool
                </h1>

                {/* Real-time connection + last updated */}
                {/* <div className="flex justify-center items-center gap-3 mb-4">
                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${realtimeConnected
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        {realtimeConnected ? 'Live' : 'Connecting...'}
                    </span>

                </div> */}

                {/* Active Boost Banner */}
                {activeBoost && boostedPrize && (
                    <div
                        className="mb-6"
                        style={{
                            backgroundColor: '#FFDA5733',
                            border: '1px solid #D9A500',
                            borderRadius: '4px'
                        }}
                    >
                        {/* Top row: Boost tag + Time left */}
                        <div className="flex justify-between items-center px-3 py-2">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400 rounded-full">
                                <img src="/images/puzzle/boost/boost.svg" alt="" className="w-3 h-3" />
                                <span className="text-[10px] font-bold text-yellow-800">{activeBoost.duration}H BOOST</span>
                            </div>
                            <div
                                className="flex items-center gap-1"
                                style={{
                                    color: '#D9A500',
                                    fontFamily: '"Noto Sans Mono", monospace',
                                    fontWeight: 600,
                                    fontSize: '12px',
                                    lineHeight: '21.21px',
                                    letterSpacing: '0px'
                                }}
                            >
                                <img src="/images/puzzle/clock.svg" alt="" className="w-5 h-5" style={{ filter: 'brightness(0) saturate(100%) invert(58%) sepia(98%) saturate(393%) hue-rotate(11deg) brightness(97%) contrast(91%)' }} />
                                {boostTimeLeft}
                            </div>
                        </div>

                        {/* Separator line */}
                        <div style={{ borderTop: '1px solid #D9A50033', marginLeft: '10px', marginRight: '10px' }} />

                        {/* Bottom row: Token info | Wins | Prize */}
                        <div className="flex items-center justify-between px-3 py-2">
                            {/* Left: Token logo + name */}
                            <div className="flex items-center gap-2">
                                {activeBoost.partnerLogo ? (
                                    <img
                                        src={activeBoost.partnerLogo}
                                        alt={activeBoost.partnerName}
                                        className="w-8 h-8 rounded-full object-cover border border-yellow-400"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-yellow-300 flex items-center justify-center border border-yellow-400">
                                        <Image src="/images/puzzle/navbar/Lightning.svg" alt="" width={16} height={16} style={{ filter: 'brightness(0)' }} />
                                    </div>
                                )}
                                <span
                                    style={{
                                        color: '#D9A500',
                                        fontFamily: '"Noto Sans Mono", monospace',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        lineHeight: '20px'
                                    }}
                                >
                                    ${activeBoost.partnerName}
                                </span>
                            </div>

                            {/* Center: Wins */}
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1 text-sm" style={{ color: '#D9A500', fontFamily: '"Noto Sans Mono", monospace', fontWeight: 600 }}>
                                    <img src="/images/puzzle/smallPuzzle.svg" alt="" className="w-3 h-3" style={{ filter: 'brightness(0) saturate(100%) invert(58%) sepia(98%) saturate(393%) hue-rotate(11deg) brightness(97%) contrast(91%)' }} />
                                    {formatNumber(boostedPrize.wins || 0)}/{formatNumber(boostedPrize.maxWins || 1000)}
                                </div>
                                <div className="h-1 w-16 rounded-full mt-1" style={{ backgroundColor: '#D9A50033' }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${((boostedPrize.wins || 0) / (boostedPrize.maxWins || 1000)) * 100}%`,
                                            backgroundColor: '#D9A500'
                                        }}
                                    />
                                </div>
                                <div className="text-[10px] mt-0.5" style={{ color: '#D9A500' }}>
                                    {Math.round(((boostedPrize.wins || 0) / (boostedPrize.maxWins || 1000)) * 100)}%
                                </div>
                            </div>

                            {/* Right: Prize */}
                            <div className="text-right">
                                <div className="font-bold text-sm" style={{ color: '#D9A500', fontFamily: '"Noto Sans Mono", monospace' }}>
                                    {formatNumber(boostedPrize.prize)}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                    {pricesLoading ? (
                                        <span className="inline-block w-10 h-3 bg-yellow-300/50 rounded animate-pulse" />
                                    ) : boostedPrize.usdValue}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Token Table */}
                <div className="overflow-x-auto rounded-2xl shadow-md">
                    <table className="min-w-full text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800">
                        <thead className="font-semibold bg-[#EFF5FF] dark:bg-gray-700 text-[#6B7280] dark:text-gray-300 text-xs">
                            <tr>
                                <th className="px-3 py-3 text-left">TOKENS</th>
                                <th className="px-3 py-3 text-center">Wins</th>
                                <th className="px-3 py-3 text-right">Prize</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                // Skeleton loading
                                <>
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                </>
                            ) : prizes.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center text-gray-500 py-12 font-mono">
                                        No prizes available yet.
                                    </td>
                                </tr>
                            ) : (
                                prizes.map((prize, index) => {
                                    const medals = ['🥇', '🥈', '🥉'];
                                    const medal = index < 3 ? medals[index] : `${index + 1}.`;
                                    const progress = ((prize.wins || 0) / (prize.maxWins || 1000)) * 100;

                                    return (
                                        <tr
                                            key={prize.tokenAddress || index}
                                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            {/* Token Column */}
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold w-6">{medal}</span>
                                                    <div className="w-7 h-7 overflow-hidden border border-white shadow-sm flex-shrink-0 rounded-full">
                                                        {prize.icon && (
                                                            <img src={prize.icon} alt="" className="w-full h-full object-cover" />
                                                        )}
                                                    </div>
                                                    <span className="font-bold dark:text-white text-sm">{prize.token}</span>
                                                </div>
                                            </td>

                                            {/* Wins Column */}
                                            <td className="px-3 py-3">
                                                <div className="flex flex-col items-center">
                                                    <div className="text-xs px-2 py-1 rounded-full font-bold text-center flex items-center justify-center gap-1 bg-[#EFF5FF] dark:bg-blue-900/30 text-blue-500">
                                                        <img src="/images/puzzle/smallPuzzle.svg" alt="" className="w-3 h-3" style={{ filter: 'brightness(0) saturate(100%) invert(21%) sepia(96%) saturate(4847%) hue-rotate(221deg) brightness(99%) contrast(106%)' }} />
                                                        {formatNumber(prize.wins || 0)}/{formatNumber(prize.maxWins || 1000)}
                                                    </div>
                                                    <div className="h-1 w-16 rounded-full mt-1 bg-blue-100">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500 bg-blue-500"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-[10px] mt-0.5 text-blue-500">
                                                        {Math.round(progress)}%
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Competition Prize Column (USDC) */}
                                            <td className="px-3 py-3 text-right">
                                                {prize.scanModePrizes ? (
                                                    <>
                                                        <div className="text-xs px-2 py-1 rounded-full font-bold inline-block bg-green-50 dark:bg-green-900/30 text-green-600">
                                                            ${prize.scanModePrizes} USDC
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                                            Competition
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="text-xs px-2 py-1 rounded-full font-bold inline-block bg-[#EFF5FF] dark:bg-blue-900/30 text-blue-500">
                                                            {formatNumber(prize.prize)}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                                            {pricesLoading ? (
                                                                <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse inline-block" />
                                                            ) : (
                                                                prize.usdValue
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Boost Button */}
                <Link
                    href="/puzzle/boost"
                    className="w-full h-[48px] rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 hover:opacity-90 mt-5"
                    style={{ backgroundColor: '#FFDA57', color: '#8F7000' }}
                >
                    <img src="/images/puzzle/boost/boost.svg" alt="" className="w-5 h-5" /> Boost Token
                </Link>
            </main>

            <PuzzleFooter />
        </div>
    );
}
