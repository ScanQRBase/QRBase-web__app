"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import XIcon from '@/src/app/images/svg/socialMedia/XIcon';
import WarpcastIcon from '@/src/app/images/svg/socialMedia/WarpcastIcon';

// ============================================================================
// Shared Modal Wrapper
// ============================================================================

interface ModalWrapperProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    showCloseButton?: boolean;
}

export function ModalWrapper({ isOpen, onClose, children, showCloseButton = true }: ModalWrapperProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl mx-4 max-w-sm w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ============================================================================
// 1. How It Works Modal
// ============================================================================

interface HowItWorksModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
    const steps = [
        {
            icon: "/images/puzzle/howWorkModal/HeartStraight.svg",
            title: "3 attempts daily:",
            description: "60 seconds to solve — timer shrinks as you level up.",
        },
        {
            icon: "/images/puzzle/howWorkModal/ChartPolar.svg",
            title: "Solve to earn:",
            description: "Prize is auto-claimed to your connected wallet.",
        },
        {
            icon: "/images/puzzle/howWorkModal/PuzzlePiece.svg",
            title: "Need more attempts?",
            description: "Complete tasks for free attempts or buy more with $SCAN.",
        },
        {
            icon: "/images/puzzle/howWorkModal/HandHeart.svg",
            title: "Community progress:",
            description: "Your wins contribute to the full QR reveal in Scan Mode.",
        },
        {
            icon: "/images/puzzle/howWorkModal/Scan.svg",
            title: "Earn your access to SCAN MODE:",
            description: "Meet the requirements and compete for the big prize.",
        },
    ];

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col rounded-2xl" style={{ backgroundColor: '#F7F8FD', maxHeight: '90vh' }}>
                {/* Fixed Header */}
                <div className="flex-shrink-0 px-6 pt-4 pb-2 text-center">
                    {/* Icon */}
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center">
                        <img src="/images/puzzle/Info.svg" alt="Info" className="w-6 h-6" />
                    </div>

                    <h2
                        style={{
                            fontFamily: "'Noto Sans Mono', monospace",
                            fontWeight: 700,
                            fontSize: '20px',
                            lineHeight: '28px',
                            textAlign: 'center',
                        }}
                        className="text-gray-900 dark:text-white mb-2"
                    >
                        How the QR Puzzle Works
                    </h2>
                </div>

                {/* Scrollable Steps */}
                <div className="flex-1 overflow-y-auto px-6">
                    <div className="text-left" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    gap: '12px',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '12px',
                                    padding: '8px',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                                    <img src={step.icon} alt="" className="w-5 h-5" style={{ filter: 'invert(21%) sepia(96%) saturate(4962%) hue-rotate(220deg) brightness(96%) contrast(105%)' }} />
                                </div>
                                <div className="flex-1">
                                    <p
                                        style={{
                                            fontFamily: "'Noto Sans Mono', monospace",
                                            fontWeight: 700,
                                            fontSize: '12px',
                                            lineHeight: '20px',
                                        }}
                                        className="text-gray-900 dark:text-white"
                                    >
                                        {step.title}
                                    </p>
                                    <p
                                        style={{
                                            fontFamily: "'Noto Sans Mono', monospace",
                                            fontWeight: 500,
                                            fontSize: '12px',
                                            lineHeight: '20px',
                                        }}
                                        className="text-gray-500 dark:text-gray-400"
                                    >
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fixed Bottom Button */}
                <div className="flex-shrink-0 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-[#0052FF] to-[#0052FF] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity font-mono"
                    >
                        Im ready !
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
}

// ============================================================================
// 2. Reference Image Modal
// ============================================================================

interface ReferenceImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
}

export function ReferenceImageModal({ isOpen, onClose, imageSrc }: ReferenceImageModalProps) {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="p-6 pt-8 text-center">
                {/* Icon */}
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <img src="/images/puzzle/ImageReference.svg" alt="" className="w-6 h-6 invert" />
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-mono">
                    Reference Image
                </h2>

                {/* QR Image */}
                <div className="mx-auto w-48 h-48 mb-4 rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
                    <img
                        src={imageSrc}
                        alt="Reference"
                        className="w-full h-full object-contain"
                    />
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-mono">
                    Arrange the tiles to match this image
                </p>

                <button
                    onClick={onClose}
                    className="w-full py-3 bg-gradient-to-r from-[#0052FF] to-[#0052FF] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity font-mono"
                >
                    Got It !
                </button>
            </div>
        </ModalWrapper>
    );
}

// ============================================================================
// 3. Winners Leaderboard Modal
// ============================================================================

interface Winner {
    username: string;
    avatar: string;
    wins: number;
}

interface WinnersLeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    winners: Winner[];
    isLoading?: boolean;
}

export function WinnersLeaderboardModal({ isOpen, onClose, winners, isLoading }: WinnersLeaderboardModalProps) {
    // Helper to get rank display
    const getRankDisplay = (index: number) => {
        if (index === 0) return <span className="text-lg">🥇</span>;
        if (index === 1) return <span className="text-lg">🥈</span>;
        if (index === 2) return <span className="text-lg">🥉</span>;
        return <span className="text-sm font-bold" style={{ color: '#6B7280' }}>{index + 1}.</span>;
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="p-6 pt-8">
                {/* Icon */}
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <img src="/images/puzzle/Trophy.svg" alt="" className="w-6 h-6 invert" />
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center font-mono">
                    QR Puzzle Winners
                </h2>

                {/* Header */}
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">
                    <span className="flex items-center gap-1">
                        <span className="text-blue-500">👑</span> Winner
                    </span>
                    <span>Win(s)</span>
                </div>

                {/* Winners List */}
                <div className="max-h-64 overflow-y-auto space-y-2">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : winners.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No winners yet</p>
                    ) : (
                        winners.map((winner, index) => (
                            <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded-xl ${index < 3
                                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800/50'
                                    : 'bg-gray-50 dark:bg-gray-700/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Rank */}
                                    <div className="w-6 flex justify-center">
                                        {getRankDisplay(index)}
                                    </div>
                                    {/* Avatar */}
                                    <img
                                        src={winner.avatar || "/web-app-manifest-192x192.png"}
                                        alt={winner.username}
                                        className="w-8 h-8 rounded-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "/web-app-manifest-192x192.png";
                                        }}
                                    />
                                    {/* Name */}
                                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                                        {winner.username}
                                    </span>
                                </div>
                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-full">
                                    {winner.wins}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </ModalWrapper>
    );
}

// ============================================================================
// 4. Prizes Pool Modal
// ============================================================================

interface Prize {
    token: string;
    icon: string;
    remaining: number;
    usdValue: string;
}

interface ActiveBoost {
    partnerName: string;
    partnerLogo: string;
    duration: number;
    endsAt: string;
    prize?: number;
}

interface PrizesPoolModalProps {
    isOpen: boolean;
    onClose: () => void;
    prizes: Prize[];
    isLoading?: boolean;
    activeBoost?: ActiveBoost | null;
    onBoostClick?: () => void;
}

export function PrizesPoolModal({ isOpen, onClose, prizes, isLoading, activeBoost, onBoostClick }: PrizesPoolModalProps) {
    // Helper to format boost remaining time
    const getBoostTimeRemaining = () => {
        if (!activeBoost) return "";
        const now = new Date();
        const endsAt = new Date(activeBoost.endsAt);
        const diffMs = endsAt.getTime() - now.getTime();
        if (diffMs <= 0) return "Ending...";
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${mins}m left`;
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="p-6 pt-8">
                {/* Icon */}
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <img src="/images/puzzle/QrPuzzle.svg" alt="" className="w-6 h-6 invert" />
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center font-mono">
                    Prizes
                </h2>

                {/* Active Boost Banner */}
                {activeBoost && (
                    <div
                        className="p-3 mb-4"
                        style={{
                            backgroundColor: '#FFDA5733',
                            border: '1px solid #EBB800',
                            borderRadius: '8px'
                        }}
                    >
                        {/* Row 1: Logo + Name | Remaining */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <img
                                    src={activeBoost.partnerLogo}
                                    alt=""
                                    className="w-6 h-6 rounded-full object-cover"
                                />
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{activeBoost.partnerName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {(activeBoost.prize || 10000) >= 1000
                                        ? `${((activeBoost.prize || 10000) / 1000).toFixed(0)}K`
                                        : (activeBoost.prize || 10000)}
                                </span>
                                <img
                                    src={activeBoost.partnerLogo}
                                    alt=""
                                    className="w-4 h-4 rounded-full"
                                />
                            </div>
                        </div>

                        {/* Row 2: Boost Badge | Time */}
                        <div className="flex justify-between items-center mt-2">
                            <div
                                className="flex items-center gap-1 px-2 py-0.5"
                                style={{ backgroundColor: '#FFDA57', borderRadius: '12px' }}
                            >
                                <img src="/images/puzzle/boost/boost.svg" alt="" className="w-3 h-3" />
                                <span className="text-[9px] font-bold" style={{ color: '#8F7000' }}>
                                    {activeBoost.duration}H BOOST
                                </span>
                            </div>
                            <div className="text-[10px] text-gray-500">
                                ⏱ {getBoostTimeRemaining()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2 px-2 font-mono">
                    <span>TOKENS</span>
                    <span>REMAINING</span>
                </div>

                {/* Prizes List */}
                <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : prizes.length === 0 ? (
                        <p className="text-center text-gray-500 py-8 font-mono">No prizes available</p>
                    ) : (
                        prizes.map((prize, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold w-5" style={{ color: '#6B7280' }}>
                                        {index + 1}.
                                    </span>
                                    <img
                                        src={prize.icon}
                                        alt={prize.token}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                                        {prize.token}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
                                        {prize.remaining.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        ~{prize.usdValue}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Boost Token Button */}
                {
                    onBoostClick && (
                        <button
                            onClick={onBoostClick}
                            className="w-full h-[48px] rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 hover:opacity-90"
                            style={{ backgroundColor: '#FFDA57', color: '#8F7000' }}
                        >
                            <img src="/images/puzzle/boost/boost.svg" alt="" className="w-5 h-5" /> Boost Token
                        </button>
                    )
                }
            </div >
        </ModalWrapper >
    );
}

// ============================================================================
// 5. Time's Up Modal
// ============================================================================

interface TimesUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    chancesLeft: number;
    totalChances: number;
    onPlayAgain: () => void;
    moves?: number;
}

export function TimesUpModal({ isOpen, onClose, chancesLeft, totalChances, onPlayAgain, moves }: TimesUpModalProps) {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="p-6 pt-8 text-center">
                {/* Ghost Icon */}
                <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center">
                    <img src="/images/puzzle/ghostTimeup.svg" alt="" className="w-6 h-6" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-mono">
                    Time's Up!
                </h2>

                <p className="text-gray-500 dark:text-gray-400 mb-4 font-mono text-sm">
                    The clock beat you this time.<br />
                </p>

                {/* Chances and Moves */}
                <div className="flex justify-center gap-4 mb-6">
                    <div className="px-4 py-2 rounded-lg flex items-center gap-2">
                        <span className="text-blue-500 font-bold text-lg">{chancesLeft}</span>
                        <img src="/images/puzzle/attempt.svg" alt="" className="w-5 h-5" />
                    </div>

                </div>

                <button
                    onClick={() => { onPlayAgain(); onClose(); }}
                    className="w-full h-[48px] bg-[#0052FF] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity font-mono"
                >
                    Play Again !
                </button>
            </div>
        </ModalWrapper>
    );
}

// ============================================================================
// 6. Game Over Modal (No chances left)
// ============================================================================

interface GameOverModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalChances: number;
    onBuyAttempt: () => void;
    isLoading?: boolean;
    moves?: number;
    attemptPrice?: number; // $SCAN per attempt (from level system)
}

export function GameOverModal({ isOpen, onClose, totalChances, onBuyAttempt, isLoading, moves, attemptPrice = 1000 }: GameOverModalProps) {
    const [scanPriceUsd, setScanPriceUsd] = useState<string>("~$0.30");
    const [isLoadingPrice, setIsLoadingPrice] = useState(false);

    // Fetch SCAN price when modal opens
    useEffect(() => {
        if (isOpen) {
            setIsLoadingPrice(true);
            fetch('/api/game/scan-price')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data?.fiveKScanUsdFormatted) {
                        setScanPriceUsd(data.data.fiveKScanUsdFormatted);
                    }
                })
                .catch(console.error)
                .finally(() => setIsLoadingPrice(false));
        }
    }, [isOpen]);

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="p-6 pt-8 text-center">
                {/* Ghost Icon */}
                <div className="w-12 h-12 mx-auto mb-4 rounded-full  flex items-center justify-center">
                    <img src="/images/puzzle/gameOver.svg" alt="" className="w-6 h-6" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-mono">
                    Game Over
                </h2>

                <p className="text-gray-500 dark:text-gray-400 mb-4 font-mono text-sm">
                    You've used all your Attempts.<br />
                    Play again for free in 24h or buy more<br />
                    Attempts to continue now.
                </p>

                {/* Attempts Left and Moves */}
                <div className="flex justify-center gap-4 mb-4">
                    <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <span className="text-blue-500 font-semibold flex items-center gap-2">0
                            <img src="/images/puzzle/attempt.svg" alt="" className="w-5 h-5" />
                        </span>
                    </div>
                </div>

                {/* Buy Option */}
                <div className="flex items-center justify-between px-4 py-3 mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <span className="text-blue-500 font-semibold flex items-center gap-2">+1
                        <img src="/images/puzzle/attempt.svg" alt="" className="w-5 h-5" />
                    </span>
                    <div className="flex items-center gap-1">
                        <img src="https://ik.imagekit.io/cafu/$SCAN/scan.png?updatedAt=1746620925756&ik-s=83f8422add9570195a66cd510d3f1c5e884a50d1" alt="SCAN" className="w-5 h-5" />
                        <span className="font-bold text-gray-900 dark:text-white">{attemptPrice >= 1000 ? `${(attemptPrice / 1000).toFixed(0)}K` : attemptPrice}</span>
                        <span className="text-xs text-gray-500">
                            {isLoadingPrice ? "..." : scanPriceUsd}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => { onBuyAttempt(); }}
                    disabled={isLoading}
                    className="w-full h-[48px] bg-[#0052FF] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity font-mono disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                            Processing...
                        </>
                    ) : (
                        'Get +1 Attempt'
                    )}
                </button>
            </div>
        </ModalWrapper>
    );
}

// ============================================================================
// 7. Buy Attempt Modal
// ============================================================================

interface BuyAttemptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBuy: (quantity: number) => void;
    isLoading?: boolean;
    attemptPrice?: number; // $SCAN per attempt (from level system)
}

export function BuyAttemptModal({ isOpen, onClose, onBuy, isLoading, attemptPrice = 1000 }: BuyAttemptModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [pricePerAttemptUsd, setPricePerAttemptUsd] = useState<number>(0);
    const [isLoadingPrice, setIsLoadingPrice] = useState(false);

    const MIN_QTY = 1;
    const MAX_QTY = 10;

    // Fetch SCAN price when modal opens
    useEffect(() => {
        if (isOpen) {
            setQuantity(1); // Reset to 1 when opening
            setIsLoadingPrice(true);
            fetch('/api/game/scan-price')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data?.fiveKScanUsd) {
                        setPricePerAttemptUsd(data.data.fiveKScanUsd);
                    }
                })
                .catch(console.error)
                .finally(() => setIsLoadingPrice(false));
        }
    }, [isOpen]);

    const totalScan = quantity * attemptPrice;
    const totalScanDisplay = totalScan >= 1000 ? `${(totalScan / 1000).toFixed(0)}K` : totalScan.toString();
    const pricePerUnit = pricePerAttemptUsd > 0 ? pricePerAttemptUsd * (attemptPrice / 5000) : 0;
    const totalUsdDisplay = pricePerUnit > 0
        ? `~$${(pricePerUnit * quantity).toFixed(2)}`
        : '...';

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="p-6 pt-8 text-center">
                {/* Icon */}
                <div className="mx-auto mb-4">
                    <img src="/images/puzzle/attempt.svg" alt="" className="w-16 h-16 mx-auto" />
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 font-mono">
                    Get More Attempts
                </h2>

                {/* Quantity Selector */}
                <div className="flex items-center justify-center gap-0 mb-5">
                    <button
                        onClick={() => setQuantity(q => Math.max(MIN_QTY, q - 1))}
                        disabled={quantity <= MIN_QTY || isLoading}
                        className="w-12 h-12 flex items-center justify-center rounded-l-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xl hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        −
                    </button>
                    <div className="w-20 h-12 flex items-center justify-center border-y border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                        <span className="text-xl font-bold text-gray-900 dark:text-white font-mono">{quantity}</span>
                    </div>
                    <button
                        onClick={() => setQuantity(q => Math.min(MAX_QTY, q + 1))}
                        disabled={quantity >= MAX_QTY || isLoading}
                        className="w-12 h-12 flex items-center justify-center rounded-r-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xl hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        +
                    </button>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between px-4 py-3 mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">Price</span>
                    <div className="flex items-center gap-1.5">
                        <img src="https://ik.imagekit.io/cafu/$SCAN/scan.png?updatedAt=1746620925756&ik-s=83f8422add9570195a66cd510d3f1c5e884a50d1" alt="SCAN" className="w-5 h-5 rounded-full" />
                        <span className="font-bold text-gray-900 dark:text-white font-mono">{totalScanDisplay}</span>
                        <span className="text-xs text-gray-500">
                            {isLoadingPrice ? '...' : totalUsdDisplay}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => onBuy(quantity)}
                    disabled={isLoading}
                    className="w-full h-[48px] bg-[#0052FF] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity font-mono disabled:opacity-50"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                            Processing...
                        </span>
                    ) : (
                        `Purchase ${quantity} Attempt${quantity > 1 ? 's' : ''}`
                    )}
                </button>
            </div>
        </ModalWrapper>
    );
}

// ============================================================================
// 8. Purchase Successful Modal
// ============================================================================

interface PurchaseSuccessfulModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: () => void;
    txHash?: string;
    quantity?: number;
}

export function PurchaseSuccessfulModal({ isOpen, onClose, onContinue, txHash, quantity = 1 }: PurchaseSuccessfulModalProps) {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="p-6 pt-8 text-center">
                {/* Icon */}
                <div className="mx-auto mb-4">
                    <img src="/images/puzzle/attempt.svg" alt="" className="w-16 h-16 mx-auto" />
                </div>

                <div className="inline-block px-3 py-1 mb-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <span className="text-blue-500 font-semibold text-sm">+{quantity} Attempt{quantity > 1 ? 's' : ''}</span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-mono">
                    Purchase Successful
                </h2>

                <p className="text-gray-500 dark:text-gray-400 mb-3 text-sm">
                    Your Purchase of <span className="text-blue-500 font-semibold">+{quantity} Attempt{quantity > 1 ? 's' : ''}</span> has been confirmed.
                </p>

                {/* Tx Hash Link */}
                {txHash && (
                    <div className="mb-4 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Tx: </span>
                        <a
                            href={`https://basescan.org/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:text-blue-600 font-mono underline"
                        >
                            {txHash.slice(0, 6)}...{txHash.slice(-4)}
                        </a>
                    </div>
                )}

                <button
                    onClick={() => { onContinue(); onClose(); }}
                    className="w-full h-[48px] bg-[#0052FF] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity font-mono"
                >
                    Continue Playing
                </button>
            </div>
        </ModalWrapper>
    );
}

// ============================================================================
// 9. You Won Modal
// ============================================================================

interface YouWonModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrImageSrc?: string;
    onShareFarcaster: () => void;
    onShareX: () => void;
    isProcessing?: boolean;
    moves?: number;
    timeSpent?: number;  // Time spent to solve (in seconds)
    txHash?: string;  // Payout transaction hash
    prizeAmount?: number; // Dynamic prize value shown during reward processing
}

export function YouWonModal({ isOpen, onClose, qrImageSrc, onShareFarcaster, onShareX, isProcessing, moves, timeSpent, txHash, prizeAmount }: YouWonModalProps) {
    // Format time as mm:ss
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="p-6 pt-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 font-mono">
                    You Won !
                </h2>

                {/* Reward Status - fixed height to prevent layout shift */}
                <div className="h-[40px] flex items-center justify-center mb-4">
                    {txHash ? (
                        <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Reward Tx: </span>
                            <a
                                href={`https://basescan.org/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 font-mono underline"
                            >
                                {txHash.slice(0, 6)}...{txHash.slice(-4)}
                            </a>
                        </div>
                    ) : isProcessing ? (
                        <div className="flex items-center justify-center gap-2 text-blue-500">
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
                            </svg>
                            <img src="https://ik.imagekit.io/cafu/$SCAN/scan.png?updatedAt=1746620925756&ik-s=83f8422add9570195a66cd510d3f1c5e884a50d1" alt="SCAN" className="w-5 h-5 rounded-full" />
                            <span className="font-bold text-gray-900 dark:text-white text-sm">{(prizeAmount ?? 10000) >= 1000 ? `${(prizeAmount ?? 10000) / 1000}K` : prizeAmount ?? 10000}</span>
                            <span className="text-sm font-mono">Processing Reward...</span>
                        </div>
                    ) : null}
                </div>

                {/* Stats Display */}
                {(moves !== undefined || timeSpent !== undefined) && (
                    <div className="flex justify-center gap-4 mb-4">
                        {moves !== undefined && (
                            <div className="flex-1 max-w-[80px] px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center">
                                <span className="text-green-600 dark:text-green-400 font-bold text-lg">{moves}</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Moves</p>
                            </div>
                        )}
                        {timeSpent !== undefined && (
                            <div className="flex-1 max-w-[80px] px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-center">
                                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">{formatTime(timeSpent)}</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Timer</p>
                            </div>
                        )}
                    </div>
                )}

                {/* QR/Win Image */}
                <div className="mx-auto w-40 h-40 mb-4 rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden flex items-center justify-center bg-white">
                    <img
                        src={qrImageSrc || "/images/puzzle/YouWonIMG.svg"}
                        alt="You Won"
                        className="w-full h-full object-contain p-2"
                    />
                </div>

                <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm font-mono">
                    Share on...
                </p>

                {/* Share Buttons */}
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onShareFarcaster}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        <WarpcastIcon size={20} color="#0052FF" />
                        <span className="font-medium text-gray-900 dark:text-white">Farcaster</span>
                    </button>

                    <button
                        onClick={onShareX}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        <XIcon size={18} color="#000000" />
                        <span className="font-medium text-gray-900 dark:text-white">X.com</span>
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
}

// ============================================================================
// 10. Reset Overlay (No chances, waiting for reset)
// ============================================================================

interface ResetOverlayProps {
    isVisible: boolean;
    resetTime: string;
    onBuyAttempt: () => void;
    isConnected?: boolean;
    onSignIn?: () => void;
    needsWalletConnection?: boolean;
    onLinkWallet?: () => void;
}

export function ResetOverlay({ isVisible, resetTime, onBuyAttempt, isConnected = true, onSignIn, needsWalletConnection, onLinkWallet }: ResetOverlayProps) {
    if (!isVisible) return null;

    // Show "Wallet Required" when user is authenticated but wallet is missing
    if (!isConnected && needsWalletConnection) {
        return (
            <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 rounded-xl">
                <div className="text-center p-6">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-r from-[#50DEF5]/20 to-[#0052FF]/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 font-mono">
                        Wallet Required
                    </h3>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Connect your wallet to start<br />
                        playing and earn rewards
                    </p>

                    {onLinkWallet && (
                        <button
                            onClick={onLinkWallet}
                            className="px-6 h-[48px] text-white font-bold rounded-xl hover:opacity-90 transition-opacity font-mono"
                            style={{ background: 'linear-gradient(to right, #50DEF5, #0052FF, #AE80FF)' }}
                        >
                            Connect Wallet
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Show "Connect to Play" when user is not authenticated at all
    if (!isConnected) {
        return (
            <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 rounded-xl">
                <div className="text-center p-6">
                    {/* Lock Icon */}
                    <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 font-mono">
                        Connect to Play
                    </h3>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Sign in with X or Farcaster and<br />
                        connect your wallet to play
                    </p>

                    {onSignIn && (
                        <button
                            onClick={onSignIn}
                            className="px-6 h-[48px] bg-[#0052FF] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity font-mono"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Original content for connected users with no attempts
    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 rounded-xl">
            <div className="text-center p-6">
                {/* Lock Icon */}
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 font-mono">
                    Attempts reset in
                </h3>

                <p className="text-2xl font-bold text-blue-500 mb-4 font-mono">
                    {resetTime}
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Wait for the Reset or<br />
                    Buy more Attempts to keep playing.
                </p>
            </div>
        </div>
    );
}

// ============================================================================
// 11. Boost Token Modal
// ============================================================================

interface BoostEntry {
    id: string;
    partnerAddress: string;
    partnerName: string;
    partnerLogo: string;
    duration: number;
    startsAt: string;
    endsAt: string;
    purchasedBy: string;
    amount: number;
    status: 'active' | 'queued' | 'completed';
}

interface BoostTokenModalProps {
    isOpen: boolean;
    onClose: () => void;
    partners: Array<{ name: string; logo: string; ca: string }>;
    onPurchase: (partnerAddress: string, duration: number) => Promise<void>;
    isLoading?: boolean;
    nextAvailableAt?: string;
}

export function BoostTokenModal({
    isOpen,
    onClose,
    partners,
    onPurchase,
    isLoading,
    nextAvailableAt
}: BoostTokenModalProps) {
    const [selectedPartner, setSelectedPartner] = useState<string>("");
    const [selectedDuration, setSelectedDuration] = useState<number>(6);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [partnerBalances, setPartnerBalances] = useState<Record<string, { balance: number; hasEnoughFunds: boolean }>>({});
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);

    // Fetch balances when modal opens
    useEffect(() => {
        if (isOpen && partners.length > 0) {
            setIsLoadingBalances(true);
            fetch('/api/game/partners/balances')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data) {
                        const balanceMap: Record<string, { balance: number; hasEnoughFunds: boolean }> = {};
                        data.data.forEach((p: { ca: string; balance: number; hasEnoughFunds: boolean }) => {
                            balanceMap[p.ca] = { balance: p.balance, hasEnoughFunds: p.hasEnoughFunds };
                        });
                        setPartnerBalances(balanceMap);
                    }
                })
                .catch(console.error)
                .finally(() => setIsLoadingBalances(false));
        }
    }, [isOpen, partners.length]);

    const durations = [
        { hours: 6, price: 25 },
        { hours: 12, price: 55 },
        { hours: 24, price: 99 },
    ];

    const selectedPartnerData = partners.find(p => p.ca === selectedPartner);

    // Calculate estimated dates for each duration
    const getEstimatedDatesForDuration = (hours: number) => {
        const startDate = nextAvailableAt ? new Date(nextAvailableAt) : new Date();
        const endDate = new Date(startDate.getTime() + hours * 60 * 60 * 1000);
        return {
            start: startDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            end: endDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        };
    };

    const handlePurchase = async () => {
        if (!selectedPartner) return;
        await onPurchase(selectedPartner, selectedDuration);
    };

    const handleSelectPartner = (ca: string) => {
        setSelectedPartner(ca);
        setIsDropdownOpen(false);
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="p-4 pt-6">
                {/* Boost Icon */}
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-yellow-400 flex items-center justify-center">
                    <img src="/images/puzzle/boost/boost.svg" alt="" className="w-6 h-6" />
                </div>

                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
                    Boost a Token
                </h2>

                {/* Partner Dropdown */}
                <div className="relative mb-4">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDropdownOpen(!isDropdownOpen);
                        }}
                        className="flex items-center justify-between w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                        {selectedPartnerData ? (
                            <div className="flex items-center gap-2">
                                <img src={selectedPartnerData.logo} alt="" className="w-5 h-5 rounded-full" />
                                <span className="text-sm text-gray-900 dark:text-white">{selectedPartnerData.name}</span>
                            </div>
                        ) : (
                            <span className="text-sm text-gray-500">Select Token</span>
                        )}
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-[100] max-h-40 overflow-y-auto">
                            {partners.length === 0 ? (
                                <div className="p-3 text-sm text-gray-500">Loading...</div>
                            ) : isLoadingBalances ? (
                                <div className="p-3 text-sm text-gray-500 flex items-center gap-2">
                                    <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    Checking funds...
                                </div>
                            ) : partners.map((partner) => {
                                const balanceInfo = partnerBalances[partner.ca];
                                const hasEnoughFunds = balanceInfo?.hasEnoughFunds ?? true;
                                const balance = balanceInfo?.balance ?? 0;

                                return (
                                    <button
                                        type="button"
                                        key={partner.ca}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (hasEnoughFunds) {
                                                handleSelectPartner(partner.ca);
                                            }
                                        }}
                                        disabled={!hasEnoughFunds}
                                        className={`flex items-center gap-2 w-full p-2.5 text-left ${hasEnoughFunds
                                            ? 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            : 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900'
                                            }`}
                                    >
                                        <img src={partner.logo} alt="" className="w-5 h-5 rounded-full" />
                                        <span className={`text-sm ${hasEnoughFunds ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                            {partner.name}
                                        </span>
                                        {!hasEnoughFunds && (
                                            <span className="text-[10px] text-red-500 ml-auto">No funds</span>
                                        )}
                                        {hasEnoughFunds && balance > 0 && (
                                            <span className="text-[10px] text-green-500 ml-auto">
                                                {balance >= 1000 ? `${(balance / 1000).toFixed(0)}K` : balance.toFixed(0)}
                                            </span>
                                        )}
                                        {selectedPartner === partner.ca && hasEnoughFunds && (
                                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Duration Selection - grid like mockup */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    {durations.slice(0, 2).map((d) => {
                        const dates = getEstimatedDatesForDuration(d.hours);
                        const isSelected = selectedDuration === d.hours;
                        return (
                            <button
                                type="button"
                                key={d.hours}
                                onClick={() => setSelectedDuration(d.hours)}
                                className={`relative p-3 rounded-xl border transition-all text-left ${isSelected
                                    ? 'border-blue-500 bg-white dark:bg-gray-800'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                    }`}
                            >
                                {/* Radio in top-right */}
                                <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                </div>

                                {/* Badge */}
                                <div
                                    className="flex items-center gap-1 px-2 py-1 mb-1"
                                    style={{ backgroundColor: '#FFDA57', borderRadius: '24px', maxWidth: '100px' }}
                                >
                                    <img src="/images/puzzle/boost/boost.svg" alt="" className="w-4 h-4" />
                                    <span
                                        className="text-[10px] font-bold tracking-wider"
                                        style={{ color: '#8F7000' }}
                                    >
                                        {d.hours}H BOOST
                                    </span>
                                </div>

                                {/* Price */}
                                <div className="text-lg font-bold text-gray-900 dark:text-white">${d.price}</div>

                                {/* Tiny dates */}
                                <div className="text-[9px] text-gray-400 mt-1">
                                    {dates.start} → {dates.end}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* 24H - Full width */}
                <div className="mb-4">
                    {(() => {
                        const d = durations[2];
                        const dates = getEstimatedDatesForDuration(d.hours);
                        const isSelected = selectedDuration === d.hours;
                        return (
                            <button
                                type="button"
                                onClick={() => setSelectedDuration(d.hours)}
                                className={`relative w-full p-3 rounded-xl border transition-all text-center ${isSelected
                                    ? 'border-blue-500 bg-white dark:bg-gray-800'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                    }`}
                            >
                                {/* Radio in top-right */}
                                <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                </div>

                                {/* Badge */}
                                <div
                                    className="flex items-center justify-center gap-1 px-2 py-1 mb-1"
                                    style={{ backgroundColor: '#FFDA57', borderRadius: '24px', maxWidth: '100px', margin: '0 auto' }}
                                >
                                    <img src="/images/puzzle/boost/boost.svg" alt="" className="w-4 h-4" />
                                    <span
                                        className="text-[10px] font-bold tracking-wider"
                                        style={{ color: '#8F7000' }}
                                    >
                                        {d.hours}H BOOST
                                    </span>
                                </div>

                                {/* Price */}
                                <div className="text-lg font-bold text-gray-900 dark:text-white">${d.price}</div>

                                {/* Tiny dates */}
                                <div className="text-[9px] text-gray-400 mt-1">
                                    {dates.start} → {dates.end}
                                </div>
                            </button>
                        );
                    })()}
                </div>

                {/* Purchase Button */}
                <button
                    type="button"
                    onClick={handlePurchase}
                    disabled={!selectedPartner || isLoading}
                    className="w-full h-[48px] bg-[#0052FF] text-white rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>Buy Boost Pack</>
                    )}
                </button>
            </div>
        </ModalWrapper>
    );
}

// ============================================================================
// 12. Token Boosted Modal (shows current boost info)
// ============================================================================

interface TokenBoostedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBoostToken: () => void;
    boostDuration?: number;
    partnerName?: string;
}

export function TokenBoostedModal({ isOpen, onClose, onBoostToken, boostDuration, partnerName }: TokenBoostedModalProps) {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="p-6 pt-8 text-center">
                {/* Boost Badge */}
                <div className="inline-flex items-center gap-1.5 px-4 py-2 mb-4 rounded-full" style={{ backgroundColor: '#FFDA57' }}>
                    <img src="/images/puzzle/boost/boost.svg" alt="" className="w-4 h-4" />
                    <span className="text-sm font-bold" style={{ color: '#8F7000' }}>BOOST</span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 font-mono">
                    Token Boosted
                </h2>

                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                    {partnerName ? (
                        <>This token's community activated a boost and locked the puzzle.</>
                    ) : (
                        <>This token's community activated a boost and locked the puzzle.</>
                    )}
                </p>

                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                    All players will face this puzzle until the boost expires.
                </p>

                {/* Buttons - stack on mobile, side by side on desktop */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 h-[48px] bg-[#0052FF] text-white font-bold rounded-xl hover:opacity-90 transition-opacity font-mono"
                    >
                        Got It
                    </button>
                    <Link
                        href="/puzzle/boost"
                        onClick={onClose}
                        className="flex-1 h-[48px] rounded-xl font-bold transition-colors flex items-center justify-center gap-2 hover:opacity-90"
                        style={{ backgroundColor: '#FFDA57', color: '#8F7000' }}
                    >
                        <img src="/images/puzzle/boost/boost.svg" alt="" className="w-5 h-5" />
                        Boost Token
                    </Link>
                </div>
            </div>
        </ModalWrapper>
    );
}

// ============================================================================
// 13. Leave Puzzle Modal (navigation guard while playing)
// ============================================================================

interface LeavePuzzleModalProps {
    isOpen: boolean;
    onLeave: () => void;
    onContinue: () => void;
}

export function LeavePuzzleModal({ isOpen, onLeave, onContinue }: LeavePuzzleModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={onContinue}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative bg-white dark:bg-gray-800 shadow-2xl mx-4 overflow-hidden"
                        style={{
                            width: '100%',
                            maxWidth: 374,
                            maxHeight: 702,
                            borderRadius: 16,
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={onContinue}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Warning Icon */}
                        <div className="flex justify-center">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center">
                                <img src="/images/puzzle/Warning.svg" alt="Warning" className="w-9 h-9" />
                            </div>
                        </div>

                        {/* Title */}
                        <h2
                            className="text-center"
                            style={{
                                fontFamily: "'Noto Sans Mono', monospace",
                                fontWeight: 700,
                                fontSize: 20,
                                lineHeight: '28px',
                                color: '#000',
                            }}
                        >
                            Leave Puzzle?
                        </h2>

                        {/* Description */}
                        <p
                            className="text-center"
                            style={{
                                fontFamily: "'Noto Sans Mono', monospace",
                                fontWeight: 500,
                                fontSize: 13,
                                lineHeight: '20px',
                                color: '#6B7280',
                            }}
                        >
                            Leaving now ends this attempt and<br />counts as a loss.
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={onLeave}
                                className="flex-1 flex items-center justify-center transition-opacity hover:opacity-80"
                                style={{
                                    height: 44,
                                    borderRadius: 8,
                                    backgroundColor: '#0052FF1A',
                                    color: '#0052FF',
                                    fontFamily: "'Noto Sans Mono', monospace",
                                    fontWeight: 600,
                                    fontSize: 12,
                                    lineHeight: '20px',
                                    paddingTop: 10,
                                    paddingBottom: 10,
                                    paddingLeft: 16,
                                    paddingRight: 16,
                                }}
                            >
                                Leave
                            </button>
                            <button
                                onClick={onContinue}
                                className="flex-1 flex items-center justify-center text-white transition-opacity hover:opacity-90"
                                style={{
                                    height: 44,
                                    borderRadius: 8,
                                    backgroundColor: '#0052FF',
                                    fontFamily: "'Noto Sans Mono', monospace",
                                    fontWeight: 600,
                                    fontSize: 12,
                                    lineHeight: '20px',
                                    paddingTop: 10,
                                    paddingBottom: 10,
                                    paddingLeft: 16,
                                    paddingRight: 16,
                                }}
                            >
                                Continue Playing
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Export BoostEntry type
export type { BoostEntry };
