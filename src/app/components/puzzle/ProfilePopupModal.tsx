/**
 * ProfilePopupModal
 * Enhanced profile popup with Level System and Referral UI
 * Redesigned to match reference mockup with modern styling
 */

"use client";

import { useState, useEffect } from 'react';
import { ChevronDown, Users, Copy, Check, Info, ExternalLink, AlertTriangle, X } from 'lucide-react';
import { useUserProfile, ReferralDetail } from '@/src/app/hooks/useUserProfile';
import { usePuzzleData } from '@/src/app/lib/context/PuzzleDataContext';
import { useRealtimeData } from '@/src/app/lib/realtime';
import { formatNumber } from '@/src/app/lib/formatNumber';
import XIcon from '@/src/app/images/svg/socialMedia/XIcon';
import WarpcastIcon from '@/src/app/images/svg/socialMedia/WarpcastIcon';
import BaseIcon from '@/src/app/images/svg/socialMedia/BaseIcon';

interface ProfilePopupModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
    twitter: string | null;
    twitterImage: string | null;
    address: string | null;
    onWalletConnect: () => void;
    onLogout: () => void;
    isFarcaster?: boolean;
}

// const WORKER_URL = 'https://game-api.qrbase.workers.dev';

export default function ProfilePopupModal({
    isOpen,
    onClose,
    userId,
    twitter,
    twitterImage,
    address,
    onWalletConnect,
    onLogout,
    isFarcaster = false,
}: ProfilePopupModalProps) {
    const [showReferralDetails, setShowReferralDetails] = useState(false);
    const [addressCopied, setAddressCopied] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [showClaimWarning, setShowClaimWarning] = useState(false);
    const [claimError, setClaimError] = useState<string | null>(null);
    const [showCopyLinkPopup, setShowCopyLinkPopup] = useState(false);
    const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
    const [claimSuccess, setClaimSuccess] = useState<{ txHash: string; amount: number } | null>(null);

    const { profile, loading, refresh: refreshProfile } = useUserProfile(userId);

    // Get synchronized prizes data from shared context
    const { prizes, realtimeConnected } = usePuzzleData();

    // Subscribe to real-time updates for profile data (when user wins/loses)
    const { stats: realtimeStats } = useRealtimeData({
        rooms: ['stats'],
    });

    // Refresh profile when popup opens
    useEffect(() => {
        if (isOpen && userId) {
            refreshProfile();
        }
    }, [isOpen, userId, refreshProfile]);

    // Refresh profile when real-time stats update (user might have won/lost)
    useEffect(() => {
        if (realtimeStats && isOpen && userId) {
            // Debounce the refresh to avoid too many calls
            const timeout = setTimeout(() => {
                refreshProfile();
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [realtimeStats, isOpen, userId, refreshProfile]);

    // Get referral stats from profile (now included in status response)
    const referralStats = profile?.referralStats ?? null;

    // Helper to get partner logo by name - now uses synchronized prizes from context
    const getPartnerLogo = (partnerName: string): string => {
        const partner = prizes.find(p =>
            p.token.toUpperCase().replace('$', '') === partnerName.toUpperCase().replace('$', '')
        );
        return partner?.icon || '/web-app-manifest-192x192.png';
    };

    if (!isOpen) return null;

    const handleCopyPlatformLink = (platform: 'x' | 'farcaster' | 'base') => {
        let referralLink = '';
        switch (platform) {
            case 'x':
                referralLink = `https://www.qrbase.xyz/puzzle?ref=${userId}`;
                break;
            case 'farcaster':
                referralLink = `https://farcaster.xyz/miniapps/pSTSE9GDxQA7/qrbase?path=/puzzle&ref=${userId}`;
                break;
            case 'base':
                referralLink = `https://base.app/app/www.qrbase.xyz/puzzle?ref=${userId}`;
                break;
        }
        navigator.clipboard.writeText(referralLink);
        setCopiedPlatform(platform);
        setTimeout(() => setCopiedPlatform(null), 2000);
    };

    const handleCopyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setAddressCopied(true);
            setTimeout(() => setAddressCopied(false), 1200);
        }
    };

    const handleClaim = async () => {
        if (!userId || claiming) return;

        const pending = referralStats?.pendingEarnings ?? 0;

        // Check minimum threshold
        if (pending < 10000) {
            setShowClaimWarning(true);
            return;
        }

        // Check wallet is connected
        if (!address) {
            setClaimError('Please connect your wallet first.');
            return;
        }

        setClaiming(true);
        setClaimError(null);
        setClaimSuccess(null);

        try {
            const response = await fetch('/api/game/referral/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, recipientAddress: address }),
            });
            const data = await response.json();

            if (data.success) {
                setClaimSuccess({
                    txHash: data.data.txHash,
                    amount: data.data.claimedAmount,
                });
                refreshProfile();
                // Optimistic balance update: add claimed amount
                window.dispatchEvent(new CustomEvent('balance-refresh', { detail: { delta: data.data.claimedAmount } }));
            } else {
                setClaimError(data.error || 'Failed to claim rewards');
            }
        } catch (error) {
            console.error('Claim error:', error);
            setClaimError('Network error. Please try again.');
        } finally {
            setClaiming(false);
        }
    };



    const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    // Calculate level data with fallbacks for production API compatibility
    const totalPlays = profile?.totalPlays ?? 0;
    const winsAllTime = profile?.winsAllTime ?? 0;

    // Calculate win rate with fallback
    const calculatedWinRate = totalPlays > 0 ? winsAllTime / totalPlays : 0;
    const winRate = profile?.winRate ?? calculatedWinRate;

    // Calculate level with fallback based on the level formula
    const calculateFallbackLevel = (plays: number, rate: number): number => {
        if (plays >= 150 && rate >= 0.80) return 6;
        if (plays >= 80 && rate >= 0.70) return 5;
        if (plays >= 40 && rate >= 0.60) return 4;
        if (plays >= 20 && rate >= 0.50) return 3;
        if (plays >= 10 && rate >= 0.40) return 2;
        if (plays >= 5) return 1;
        return 1;
    };

    const level = profile?.level ?? calculateFallbackLevel(totalPlays, winRate);
    const levelProgress = profile?.progressToNextLevel ?? Math.min((totalPlays / 5) * 10, 100);
    // Progress bar shows level: level 1 = 1 blue segment, level 10 = all 10 blue
    const progressSegments = level;

    return (
        <div
            className={`fixed inset-0 flex justify-center bg-black/50 backdrop-blur-sm z-[200] transition-opacity duration-200 ${isFarcaster ? "items-end" : "items-center"}`}
            onClick={onClose}
        >
            <div
                className={`relative shadow-2xl w-[380px] max-w-[95vw] max-h-[85vh] overflow-hidden transition-all duration-300 ease-out flex flex-col ${isFarcaster ? "rounded-t-2xl animate-slideUp" : "rounded-2xl animate-scaleIn"}`}
                style={{ backgroundColor: '#F7F8FD' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Fixed Header: Avatar + Username + Close Button */}
                <div className="flex items-center gap-3 px-6 pt-6 pb-4 flex-shrink-0" style={{ backgroundColor: '#F7F8FD' }}>
                    <img
                        src={twitterImage || "/web-app-manifest-192x192.png"}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100 dark:ring-blue-900"
                        alt="Profile"
                    />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex-1">@{twitter}</h2>
                    <button
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M1 1L13 13M1 13L13 1" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1">
                    {/* Loading Overlay */}
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10 rounded-2xl">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm text-gray-500">Loading...</span>
                            </div>
                        </div>
                    )}

                    {/* Wallet Section */}
                    <div className="px-3 sm:px-6 pb-4">
                        <p
                            className="text-gray-500 dark:text-gray-400 mb-2"
                            style={{
                                fontFamily: '"Noto Sans Mono", monospace',
                                fontWeight: 500,
                                fontSize: '12px',
                            }}
                        >
                            Wallet
                        </p>
                        <div
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[6px]"
                            style={{ padding: '12px 15px' }}
                        >

                            {address ? (
                                <button
                                    onClick={handleCopyAddress}
                                    className="inline-flex items-center gap-3 group"
                                >
                                    <span
                                        className="text-gray-900 dark:text-white"
                                        style={{
                                            fontFamily: '"Noto Sans Mono", monospace',
                                            fontWeight: 700,
                                            fontSize: '12px',
                                        }}
                                    >
                                        Connected
                                    </span>
                                    <span
                                        className="text-gray-500 dark:text-gray-400"
                                        style={{
                                            fontFamily: '"Noto Sans Mono", monospace',
                                            fontWeight: 400,
                                            fontSize: '12px',
                                        }}
                                    >
                                        {truncateAddress(address)}
                                    </span>
                                    {addressCopied ? (
                                        <Check size={14} className="text-green-500" />
                                    ) : (
                                        <Copy size={14} className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={onWalletConnect}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0052FF] hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all"
                                    style={{ fontFamily: '"Noto Sans Mono", monospace' }}
                                >
                                    Connect Wallet
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Level Section - Pixel-perfect design specs */}
                    {profile && (
                        <div
                            className="relative mx-3 sm:mx-6 mb-5 p-[1px] rounded-[6px]"
                            style={{
                                background: 'linear-gradient(90deg, #50DEF5, #0052FF, #AE80FF)',
                            }}
                        >
                            <div
                                className="bg-white dark:bg-gray-800 rounded-[5px] flex flex-col items-center"
                                style={{ padding: '12px', gap: '4px' }}
                            >
                                {/* Header: Title with 16px gap + info icon */}
                                <div
                                    className="w-full relative flex items-center justify-center"
                                    style={{ marginBottom: '16px' }}
                                >
                                    <h3
                                        className="font-bold text-gray-900 dark:text-white"
                                        style={{
                                            fontFamily: '"Noto Sans Mono", monospace',
                                            fontSize: '18px',
                                            fontWeight: 700,
                                        }}
                                    >
                                        LvL {level}
                                    </h3>
                                    <button
                                        className="absolute right-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        aria-label="Level info"
                                        title={`Next level: ${(profile.nextLevelRequirements?.minWinRate ?? 0) * 100}% win rate → ${profile.nextLevelRequirements?.timerSeconds ?? '--'}s timer`}
                                    >
                                        <Info size={18} />
                                    </button>
                                </div>

                                {/* Segmented Progress Bar with border container */}
                                <div
                                    style={{
                                        width: '100%',
                                        maxWidth: '280px',
                                        padding: '4px 6px',
                                        marginBottom: '12px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '4px',
                                    }}
                                >
                                    <div
                                        className="flex items-center"
                                        style={{
                                            width: '100%',
                                            height: '7px',
                                            gap: '3px',
                                        }}
                                    >
                                        {[...Array(10)].map((_, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    flex: 1,
                                                    height: '100%',
                                                    borderRadius: '2px',
                                                    backgroundColor: i < progressSegments ? '#0052FF' : '#D9D9D9',
                                                    transition: 'background-color 0.3s ease',
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Stats Pills - Exact specs */}
                                <div className="flex items-center justify-center" style={{ gap: '8px' }}>
                                    {/* Plays pill - 74x22, padding 5px 10px, radius 26px */}
                                    <div
                                        className="inline-flex items-center bg-white dark:bg-gray-700"
                                        style={{
                                            height: '22px',
                                            paddingTop: '4.98px',
                                            paddingRight: '9.97px',
                                            paddingBottom: '4.98px',
                                            paddingLeft: '9.97px',
                                            gap: '4.98px',
                                            borderRadius: '26.32px',
                                            border: '0.94px solid #E5E7EB',
                                        }}
                                    >
                                        <span
                                            className="text-gray-900 dark:text-white"
                                            style={{
                                                fontFamily: '"Noto Sans Mono", monospace',
                                                fontWeight: 700,
                                                fontSize: '12px',
                                                lineHeight: '18.21px',
                                                letterSpacing: '-0.03em',
                                            }}
                                        >
                                            {totalPlays}
                                        </span>
                                        <span
                                            className="text-gray-500 dark:text-gray-400"
                                            style={{
                                                fontSize: '12px',
                                                lineHeight: '18.21px',
                                            }}
                                        >
                                            Plays
                                        </span>
                                    </div>

                                    {/* Win Rate pill - 107x22, padding 5px 10px, radius 26px */}
                                    <div
                                        className="inline-flex items-center bg-white dark:bg-gray-700"
                                        style={{
                                            height: '22px',
                                            paddingTop: '4.98px',
                                            paddingRight: '9.97px',
                                            paddingBottom: '4.98px',
                                            paddingLeft: '9.97px',
                                            gap: '4.98px',
                                            borderRadius: '26.32px',
                                            border: '0.94px solid #E5E7EB',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily: '"Noto Sans Mono", monospace',
                                                fontWeight: 700,
                                                fontSize: '12px',
                                                lineHeight: '18.21px',
                                                letterSpacing: '-0.03em',
                                                color: '#0052FF',
                                            }}
                                        >
                                            {Math.round(winRate * 100)}%
                                        </span>
                                        <span
                                            className="text-gray-500 dark:text-gray-400"
                                            style={{
                                                fontSize: '12px',
                                                lineHeight: '18.21px',
                                            }}
                                        >
                                            Win(%) Rate
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Cards - Exact specs */}
                    <div className="flex justify-center gap-2 px-3 sm:px-6 mb-5">
                        {/* Total Wins - Green */}
                        <div
                            className="text-center flex-1"
                            style={{
                                minWidth: '100px',
                                height: '72px',
                                borderRadius: '6px',
                                padding: '12px 8px',
                                backgroundColor: '#04B5411A',
                            }}
                        >
                            <p
                                style={{
                                    fontFamily: '"Noto Sans Mono", monospace',
                                    fontWeight: 400,
                                    fontSize: '10px',
                                    lineHeight: '16px',
                                    color: '#6B7280',
                                    marginBottom: '4px',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Total Wins
                            </p>
                            <p
                                className="font-bold"
                                style={{
                                    fontFamily: '"Noto Sans Mono", monospace',
                                    fontSize: '20px',
                                    color: '#04B541',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {profile?.winsAllTime ?? 0}W
                            </p>
                        </div>

                        {/* Total Losses - Red */}
                        <div
                            className="text-center flex-1"
                            style={{
                                minWidth: '100px',
                                height: '72px',
                                borderRadius: '6px',
                                padding: '12px 8px',
                                backgroundColor: '#DE05051A',
                            }}
                        >
                            <p
                                style={{
                                    fontFamily: '"Noto Sans Mono", monospace',
                                    fontWeight: 400,
                                    fontSize: '10px',
                                    lineHeight: '16px',
                                    color: '#6B7280',
                                    marginBottom: '4px',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Total Losses
                            </p>
                            <p
                                className="font-bold"
                                style={{
                                    fontFamily: '"Noto Sans Mono", monospace',
                                    fontSize: '20px',
                                    color: '#DE0505',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {profile?.totalLosses ?? 0}L
                            </p>
                        </div>

                        {/* Puzzle Rewards - Blue */}
                        <div
                            className="text-center flex-1"
                            style={{
                                minWidth: '100px',
                                height: '72px',
                                borderRadius: '6px',
                                padding: '12px 8px',
                                backgroundColor: '#0052FF1A',
                            }}
                        >
                            <p
                                style={{
                                    fontFamily: '"Noto Sans Mono", monospace',
                                    fontWeight: 400,
                                    fontSize: '10px',
                                    lineHeight: '16px',
                                    color: '#6B7280',
                                    marginBottom: '4px',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Puzzle Rewards
                            </p>
                            <div className="flex items-center justify-center gap-1">
                                <img src="/images/puzzle/partner/$SCAN.png" alt="SCAN" style={{ width: '18px', height: '18px' }} />
                                <span
                                    className="font-bold"
                                    style={{
                                        fontFamily: '"Noto Sans Mono", monospace',
                                        fontSize: '20px',
                                        color: '#0052FF',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {formatNumber(profile?.scanRewarded ?? 0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Invite a Friend Section - Exact Figma specs with gradient border like level card */}
                    <div
                        className="relative mx-3 sm:mx-6 mb-5 p-[1px] rounded-[6px]"
                        style={{
                            background: 'linear-gradient(90deg, #50DEF5, #0052FF, #AE80FF)',
                        }}
                    >
                        <div
                            className="bg-white dark:bg-gray-800"
                            style={{
                                width: '100%',
                                padding: '15px 10px',
                                borderRadius: '5px',
                            }}
                        >
                            {/* Header Row: Title + Info Icon */}
                            <div className="flex items-start justify-between" style={{ marginBottom: '4px' }}>
                                <div>
                                    {/* Title */}
                                    <h3
                                        className="text-gray-900 dark:text-white"
                                        style={{
                                            fontFamily: '"Noto Sans Mono", monospace',
                                            fontWeight: 700,
                                            fontSize: '12px',
                                            lineHeight: '24px',
                                            margin: 0,
                                        }}
                                    >
                                        Invite a friend
                                    </h3>
                                    {/* Description */}
                                    <p
                                        className="text-gray-500 dark:text-gray-400"
                                        style={{
                                            fontFamily: '"Noto Sans Mono", monospace',
                                            fontWeight: 500,
                                            fontSize: '10px',
                                            lineHeight: '14px',
                                            margin: 0,
                                        }}
                                    >
                                        Earn 10% each time your referral buys an attempt
                                    </p>
                                </div>
                                <button
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                                    aria-label="Referral info"
                                    title="Earn 10% each time your referral buys an attempt"
                                >
                                    <Info size={16} />
                                </button>
                            </div>

                            {/* Stats Row + Buttons Row */}
                            <div className="flex items-center justify-between" style={{ marginTop: '10px' }}>
                                {/* Stats Pills */}
                                <div className="flex items-center" style={{ gap: '5.3px' }}>
                                    {/* Number of Referrals Pill */}
                                    <div
                                        className="flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                                        style={{
                                            height: '23.4px',
                                            paddingTop: '5.3px',
                                            paddingRight: '10.6px',
                                            paddingBottom: '5.3px',
                                            paddingLeft: '10.6px',
                                            gap: '5.3px',
                                            borderRadius: '28px',
                                        }}
                                    >
                                        <Users size={12} className="text-gray-500 dark:text-gray-400" />
                                        <span
                                            className="text-gray-700 dark:text-gray-200"
                                            style={{
                                                fontFamily: '"Noto Sans Mono", monospace',
                                                fontWeight: 500,
                                                fontSize: '10px',
                                            }}
                                        >
                                            {referralStats?.totalReferrals ?? 0}
                                        </span>
                                    </div>

                                    {/* SCAN Reward Pill */}
                                    <div
                                        className="flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                                        style={{
                                            height: '23.4px',
                                            paddingTop: '5.3px',
                                            paddingRight: '8px',
                                            paddingBottom: '5.3px',
                                            paddingLeft: '8px',
                                            gap: '5.3px',
                                            borderRadius: '28px',
                                        }}
                                    >
                                        <img src="/images/puzzle/partner/$SCAN.png" alt="SCAN" style={{ width: '12px', height: '12px' }} />
                                        <span
                                            style={{
                                                fontFamily: '"Noto Sans Mono", monospace',
                                                fontWeight: 500,
                                                fontSize: '10px',
                                                color: '#0052FF',
                                            }}
                                        >
                                            {formatNumber(referralStats?.pendingEarnings ?? 0)}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center" style={{ gap: '3.5px' }}>
                                    {/* Claim Reward Button */}
                                    <button
                                        onClick={handleClaim}
                                        disabled={claiming || (referralStats?.pendingEarnings ?? 0) <= 0}
                                        style={{
                                            width: '83px',
                                            height: '28px',
                                            padding: '7px',
                                            gap: '3.5px',
                                            borderRadius: '4.67px',
                                            backgroundColor: claiming || (referralStats?.pendingEarnings ?? 0) <= 0 ? '#9CA3AF' : '#0052FF',
                                            color: '#FFFFFF',
                                            fontFamily: '"Noto Sans Mono", monospace',
                                            fontWeight: 500,
                                            fontSize: '9px',
                                            border: 'none',
                                            cursor: claiming || (referralStats?.pendingEarnings ?? 0) <= 0 ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {claiming ? 'Claiming...' : 'Claim Reward'}
                                    </button>

                                    {/* Copy Link Button */}
                                    <button
                                        onClick={() => setShowCopyLinkPopup(true)}
                                        className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                                        style={{
                                            width: '83px',
                                            height: '28px',
                                            padding: '7px',
                                            gap: '3.5px',
                                            borderRadius: '4.67px',
                                            fontFamily: '"Noto Sans Mono", monospace',
                                            fontWeight: 500,
                                            fontSize: '9px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        Copy Link
                                    </button>
                                </div>
                            </div>

                            {/* Show Details Button - Centered */}
                            <div className="flex justify-center" style={{ marginTop: '10px' }}>
                                <button
                                    onClick={() => setShowReferralDetails(true)}
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                    style={{
                                        fontFamily: '"Noto Sans Mono", monospace',
                                        fontWeight: 700,
                                        fontSize: '10px',
                                        lineHeight: '24px',
                                        textDecoration: 'underline',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '2px',
                                    }}
                                >
                                    Show Details
                                    <ChevronDown size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Copy Link Platform Picker Popup */}
                    {showCopyLinkPopup && (
                        <div
                            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[250]"
                            onClick={() => setShowCopyLinkPopup(false)}
                        >
                            <div
                                className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[320px] max-w-[90vw] overflow-hidden animate-scaleIn"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                                    <h3
                                        className="text-gray-900 dark:text-white"
                                        style={{
                                            fontFamily: '"Noto Sans Mono", monospace',
                                            fontWeight: 700,
                                            fontSize: '14px',
                                        }}
                                    >
                                        Copy Referral Link
                                    </h3>
                                    <button
                                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                        onClick={() => setShowCopyLinkPopup(false)}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M1 1L13 13M1 13L13 1" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Platform Options */}
                                <div className="px-5 pb-5 flex flex-col" style={{ gap: '8px' }}>
                                    {/* X (Twitter) */}
                                    <button
                                        onClick={() => handleCopyPlatformLink('x')}
                                        className="flex items-center w-full border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        style={{ padding: '12px 14px', gap: '12px' }}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                                            <XIcon size={14} color="#FFFFFF" />
                                        </div>
                                        <span
                                            className="flex-1 text-left text-gray-900 dark:text-white"
                                            style={{
                                                fontFamily: '"Noto Sans Mono", monospace',
                                                fontWeight: 600,
                                                fontSize: '13px',
                                            }}
                                        >
                                            X (Twitter)
                                        </span>
                                        {copiedPlatform === 'x' ? (
                                            <span className="flex items-center gap-1 text-green-500" style={{ fontFamily: '"Noto Sans Mono", monospace', fontSize: '11px', fontWeight: 600 }}>
                                                <Check size={14} /> Copied!
                                            </span>
                                        ) : (
                                            <Copy size={16} className="text-gray-400 dark:text-gray-500" />
                                        )}
                                    </button>

                                    {/* Farcaster */}
                                    <button
                                        onClick={() => handleCopyPlatformLink('farcaster')}
                                        className="flex items-center w-full border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        style={{ padding: '12px 14px', gap: '12px' }}
                                    >
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#8A63D2' }}>
                                            <WarpcastIcon size={16} color="#FFFFFF" />
                                        </div>
                                        <span
                                            className="flex-1 text-left text-gray-900 dark:text-white"
                                            style={{
                                                fontFamily: '"Noto Sans Mono", monospace',
                                                fontWeight: 600,
                                                fontSize: '13px',
                                            }}
                                        >
                                            Farcaster
                                        </span>
                                        {copiedPlatform === 'farcaster' ? (
                                            <span className="flex items-center gap-1 text-green-500" style={{ fontFamily: '"Noto Sans Mono", monospace', fontSize: '11px', fontWeight: 600 }}>
                                                <Check size={14} /> Copied!
                                            </span>
                                        ) : (
                                            <Copy size={16} className="text-gray-400 dark:text-gray-500" />
                                        )}
                                    </button>

                                    {/* Base App */}
                                    <button
                                        onClick={() => handleCopyPlatformLink('base')}
                                        className="flex items-center w-full border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        style={{ padding: '12px 14px', gap: '12px' }}
                                    >
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0052FF' }}>
                                            <BaseIcon size={18} color="#FFFFFF" />
                                        </div>
                                        <span
                                            className="flex-1 text-left text-gray-900 dark:text-white"
                                            style={{
                                                fontFamily: '"Noto Sans Mono", monospace',
                                                fontWeight: 600,
                                                fontSize: '13px',
                                            }}
                                        >
                                            Base App
                                        </span>
                                        {copiedPlatform === 'base' ? (
                                            <span className="flex items-center gap-1 text-green-500" style={{ fontFamily: '"Noto Sans Mono", monospace', fontSize: '11px', fontWeight: 600 }}>
                                                <Check size={14} /> Copied!
                                            </span>
                                        ) : (
                                            <Copy size={16} className="text-gray-400 dark:text-gray-500" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Referral Details Popup Modal */}
                    {showReferralDetails && (
                        <div
                            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[60]"
                            onClick={() => setShowReferralDetails(false)}
                        >
                            <div
                                className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[380px] max-w-[95vw] max-h-[80vh] overflow-hidden animate-scaleIn"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="px-6 pt-6 pb-4 text-center">
                                    <button
                                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                        onClick={() => setShowReferralDetails(false)}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M1 1L13 13M1 13L13 1" />
                                        </svg>
                                    </button>
                                    <h2
                                        className="text-gray-900 dark:text-white mb-4"
                                        style={{
                                            fontFamily: '"Noto Sans Mono", monospace',
                                            fontWeight: 700,
                                            fontSize: '18px',
                                        }}
                                    >
                                        Your Refferal Earnings
                                    </h2>

                                    {/* Stats Pills */}
                                    <div className="flex items-center justify-center gap-3 flex-wrap">
                                        {/* Persons pill */}
                                        <div
                                            className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full"
                                            style={{ padding: '8px 16px' }}
                                            title="Total referred users"
                                        >
                                            <Users size={14} className="text-gray-500 dark:text-gray-400" />
                                            <span
                                                className="text-gray-900 dark:text-white"
                                                style={{
                                                    fontFamily: '"Noto Sans Mono", monospace',
                                                    fontWeight: 500,
                                                    fontSize: '12px',
                                                }}
                                            >
                                                {referralStats?.totalReferrals ?? 0}
                                            </span>
                                        </div>
                                        {/* Earnings pill */}
                                        <div
                                            className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full"
                                            style={{ padding: '8px 16px' }}
                                            title="Total earnings from referrals"
                                        >
                                            <img src="/images/puzzle/partner/$SCAN.png" alt="SCAN" style={{ width: '14px', height: '14px' }} />
                                            <span
                                                className="text-gray-900 dark:text-white"
                                                style={{
                                                    fontFamily: '"Noto Sans Mono", monospace',
                                                    fontWeight: 500,
                                                    fontSize: '12px',
                                                }}
                                            >
                                                {formatNumber(referralStats?.totalEarnings ?? 0)}
                                            </span>
                                        </div>
                                        {/* Claimed pill */}
                                        <div
                                            className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-green-400 dark:border-green-600 rounded-full"
                                            style={{ padding: '8px 16px' }}
                                            title="Total claimed amount"
                                        >
                                            <img src="/images/puzzle/partner/$SCAN.png" alt="SCAN" style={{ width: '14px', height: '14px' }} />
                                            <span
                                                className="text-gray-900 dark:text-white"
                                                style={{
                                                    fontFamily: '"Noto Sans Mono", monospace',
                                                    fontWeight: 500,
                                                    fontSize: '12px',
                                                }}
                                            >
                                                {formatNumber(referralStats?.claimedAmount ?? 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Token Table - Same design as prizes page */}
                                <div className="overflow-x-auto rounded-xl shadow-md mx-4 mb-4">
                                    <table className="min-w-full text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800">
                                        <thead className="font-semibold bg-[#EFF5FF] dark:bg-gray-700 text-[#6B7280] dark:text-gray-300 text-xs">
                                            <tr>
                                                <th className="px-3 py-3 text-left" style={{ fontFamily: '"Noto Sans Mono", monospace' }}>Referred user</th>
                                                <th className="px-3 py-3 text-center" style={{ fontFamily: '"Noto Sans Mono", monospace' }}>Spent</th>
                                                <th className="px-3 py-3 text-right" style={{ fontFamily: '"Noto Sans Mono", monospace' }}>Earnings</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(!referralStats || referralStats.referredUsers.length === 0) ? (
                                                <tr>
                                                    <td colSpan={3} className="text-center text-gray-400 dark:text-gray-500 py-12" style={{ fontFamily: '"Noto Sans Mono", monospace' }}>
                                                        No referrals yet
                                                    </td>
                                                </tr>
                                            ) : (
                                                referralStats.referredUsers.map((user: ReferralDetail, index: number) => {
                                                    // Calculate earnings as 10% of spent (500 per attempt, so spent / 10)
                                                    const calculatedEarnings = Math.floor(user.totalSpent / 10);
                                                    return (
                                                        <tr
                                                            key={index}
                                                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                        >
                                                            {/* User Column */}
                                                            <td className="px-3 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 overflow-hidden border border-white dark:border-gray-600 shadow-sm flex-shrink-0 rounded-full bg-blue-100">
                                                                        <img
                                                                            src={user.profilePhoto || "/web-app-manifest-192x192.png"}
                                                                            alt=""
                                                                            className="w-full h-full object-cover"
                                                                            onError={(e) => { (e.target as HTMLImageElement).src = '/web-app-manifest-192x192.png'; }}
                                                                        />
                                                                    </div>
                                                                    <span
                                                                        className="font-bold dark:text-white text-sm truncate"
                                                                        style={{ fontFamily: '"Noto Sans Mono", monospace' }}
                                                                    >
                                                                        @{user.displayName?.slice(0, 5) || user.userId.slice(0, 5)}...
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            {/* Spent Column */}
                                                            <td className="px-3 py-3 text-center">
                                                                <span
                                                                    className="text-gray-600 dark:text-gray-300"
                                                                    style={{ fontFamily: '"Noto Sans Mono", monospace' }}
                                                                >
                                                                    {formatNumber(user.totalSpent)}
                                                                </span>
                                                            </td>

                                                            {/* Earnings Column */}
                                                            <td className="px-3 py-3 text-right">
                                                                <div
                                                                    className="text-xs px-2 py-1 rounded-full font-bold inline-block bg-[#EFF5FF] dark:bg-blue-900/30 text-blue-500"
                                                                    style={{ fontFamily: '"Noto Sans Mono", monospace' }}
                                                                >
                                                                    {formatNumber(calculatedEarnings)}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SCAN MODE CONTRIBUTIONS Section */}
                    <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-5">
                        <h4
                            className="text-center text-gray-900 dark:text-white mb-1"
                            style={{
                                fontFamily: '"Noto Sans Mono", monospace',
                                fontWeight: 700,
                                fontSize: '12px',
                                lineHeight: '24px',
                            }}
                        >
                            SCAN MODE CONTRIBUTIONS
                        </h4>
                        <p
                            className="text-center mb-4"
                            style={{
                                fontFamily: '"Noto Sans Mono", monospace',
                                fontWeight: 500,
                                fontSize: '10px',
                                lineHeight: '14px',
                                color: '#6B7280',
                            }}
                        >
                            List of your winning for each token
                        </p>

                        <div className="space-y-2">
                            {profile?.tokenWins && Object.keys(profile.tokenWins).length > 0 ? (
                                Object.entries(profile.tokenWins)
                                    .sort(([, a], [, b]) => b - a) // Sort by wins desc
                                    .map(([partnerName, wins]) => (
                                        <div
                                            key={partnerName}
                                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={getPartnerLogo(partnerName)}
                                                    alt=""
                                                    className="w-6 h-6 rounded-full"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = '/web-app-manifest-192x192.png'; }}
                                                />
                                                <span className="font-medium text-gray-900 dark:text-white text-xs">${partnerName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <img
                                                    src="/images/puzzle/smallPuzzle.svg"
                                                    alt=""
                                                    className="w-4 h-4"
                                                    style={{ filter: 'brightness(0) saturate(100%) invert(21%) sepia(96%) saturate(4847%) hue-rotate(221deg) brightness(99%) contrast(106%)' }}
                                                />
                                                <span
                                                    className="text-blue-600 dark:text-blue-400"
                                                    style={{
                                                        fontFamily: '"Noto Sans Mono", monospace',
                                                        fontWeight: 600,
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    {wins}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <div className="text-center text-gray-400 dark:text-gray-500 py-6 text-sm">
                                    No wins recorded yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-6 pb-6 space-y-2">
                        {!address && (
                            <button
                                onClick={onWalletConnect}
                                className="w-full h-[48px] bg-[#0052FF] hover:opacity-90 text-white rounded-xl font-medium transition-all"
                            >
                                Connect Wallet
                            </button>
                        )}
                        {!isFarcaster && (
                            <button
                                onClick={onLogout}
                                className="w-full h-[48px] bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
                            >
                                Sign out
                            </button>
                        )}
                    </div>

                    {/* Claim Warning Popup */}
                    {showClaimWarning && (
                        <div
                            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[300]"
                            onClick={() => setShowClaimWarning(false)}
                        >
                            <div
                                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-[320px] max-w-[90vw] animate-scaleIn text-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                                    <img src="/images/puzzle/Warning.svg" alt="Warning" className="w-7 h-7" />
                                </div>
                                <h3
                                    className="text-gray-900 dark:text-white mb-2"
                                    style={{
                                        fontFamily: '"Noto Sans Mono", monospace',
                                        fontWeight: 700,
                                        fontSize: '14px',
                                    }}
                                >
                                    Cannot Claim Yet
                                </h3>
                                <p
                                    className="text-gray-500 dark:text-gray-400 mb-4"
                                    style={{
                                        fontFamily: '"Noto Sans Mono", monospace',
                                        fontSize: '11px',
                                        lineHeight: '18px',
                                    }}
                                >
                                    You need at least <span style={{ color: '#0052FF', fontWeight: 700 }}>10,000 $SCAN</span> to claim.
                                    You currently have <span style={{ color: '#0052FF', fontWeight: 700 }}>{formatNumber(referralStats?.pendingEarnings ?? 0)} $SCAN</span> pending.
                                </p>
                                <button
                                    onClick={() => setShowClaimWarning(false)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        backgroundColor: '#0052FF',
                                        color: '#FFFFFF',
                                        fontFamily: '"Noto Sans Mono", monospace',
                                        fontWeight: 600,
                                        fontSize: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Claim Error Popup */}
                    {claimError && (
                        <div
                            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[300]"
                            onClick={() => setClaimError(null)}
                        >
                            <div
                                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-[320px] max-w-[90vw] animate-scaleIn text-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                                    <img src="/images/puzzle/Warning.svg" alt="Warning" className="w-7 h-7" />                                </div>
                                <h3
                                    className="text-gray-900 dark:text-white mb-2"
                                    style={{
                                        fontFamily: '"Noto Sans Mono", monospace',
                                        fontWeight: 700,
                                        fontSize: '14px',
                                    }}
                                >
                                    Claim Failed
                                </h3>
                                <p
                                    className="text-gray-500 dark:text-gray-400 mb-4"
                                    style={{
                                        fontFamily: '"Noto Sans Mono", monospace',
                                        fontSize: '11px',
                                        lineHeight: '18px',
                                    }}
                                >
                                    {claimError}
                                </p>
                                <button
                                    onClick={() => setClaimError(null)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        backgroundColor: '#0052FF',
                                        color: '#FFFFFF',
                                        fontFamily: '"Noto Sans Mono", monospace',
                                        fontWeight: 600,
                                        fontSize: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Claim Success Popup */}
                    {claimSuccess && (
                        <div
                            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[300]"
                            onClick={() => setClaimSuccess(null)}
                        >
                            <div
                                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-[320px] max-w-[90vw] animate-scaleIn text-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                                    <img src="/images/puzzle/boostConfirm.svg" alt="Confirmed" style={{ width: 40, height: 40 }} />
                                </div>

                                <h2
                                    className="text-center"
                                    style={{
                                        fontFamily: "'Noto Sans Mono', monospace",
                                        fontWeight: 700,
                                        fontSize: 18,
                                        lineHeight: '28px',
                                        color: '#111827',
                                    }}
                                >
                                    Claim Successful!
                                </h2>
                                <p
                                    className="text-gray-500 dark:text-gray-400 mb-2"
                                    style={{
                                        fontFamily: '"Noto Sans Mono", monospace',
                                        fontSize: '11px',
                                        lineHeight: '18px',
                                    }}
                                >
                                    <span style={{ color: '#0052FF', fontWeight: 700 }}>{formatNumber(claimSuccess.amount)} $SCAN</span> sent to your wallet.
                                </p>
                                <a
                                    href={`https://basescan.org/tx/${claimSuccess.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mb-4"
                                    style={{
                                        fontFamily: '"Noto Sans Mono", monospace',
                                        fontSize: '10px',
                                        color: '#0052FF',
                                        textDecoration: 'underline',
                                    }}
                                >
                                    View on BaseScan <ExternalLink size={10} />
                                </a>
                                <div className="flex gap-[15px]" style={{ marginTop: 8 }}>
                                    <button
                                        onClick={() => setClaimSuccess(null)}
                                        style={{
                                            flex: 1,
                                            height: 44,
                                            borderRadius: 8,
                                            paddingTop: 10,
                                            paddingBottom: 10,
                                            paddingLeft: 16,
                                            paddingRight: 16,
                                            backgroundColor: '#0052FF',
                                            color: '#fff',
                                            fontFamily: "'Noto Sans Mono', monospace",
                                            fontWeight: 700,
                                            fontSize: 14,
                                            border: 'none',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Got It
                                    </button>
                                    <button
                                        onClick={() => {
                                            const shareText = `I just claimed ${formatNumber(claimSuccess.amount)} $SCAN in referral rewards on @ScanQRBase! 🎉💰`;
                                            const shareUrl = typeof window !== 'undefined' ? window.location.origin + '/puzzle' : '';
                                            const twitterUrl = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                                            window.open(twitterUrl, '_blank');
                                        }}
                                        style={{
                                            flex: 1,
                                            height: 44,
                                            borderRadius: 8,
                                            paddingTop: 10,
                                            paddingBottom: 10,
                                            paddingLeft: 16,
                                            paddingRight: 16,
                                            backgroundColor: '#0052FF1A',
                                            color: '#0052FF',
                                            fontFamily: "'Noto Sans Mono', monospace",
                                            fontWeight: 700,
                                            fontSize: 14,
                                            border: 'none',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Share
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Animation Styles */}
                <style jsx>{`
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-scaleIn {
                    animation: scaleIn 0.25s ease-out forwards;
                }
                .animate-slideUp {
                    animation: slideUp 0.3s ease-out forwards;
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
            </div>
        </div>
    );
}
