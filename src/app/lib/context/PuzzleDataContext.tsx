/**
 * PuzzleDataContext
 * Single source of truth for shared platform data across all puzzle pages
 * Provides synchronized state for: globalStats, leaderboard, prizes, activeBoost
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRealtimeData } from '../realtime';
import { useAuth } from './AuthContext';

// ==================== Types ====================

export interface GlobalStats {
    totalUsers: number;
    totalPlays: number;
    totalWins: number;
    totalLosses: number;
    totalBoughtAttempts: number;
    avgMoves?: number;
    avgTimeMs?: number;
}

export interface LeaderboardEntry {
    userId: string;
    displayName: string;
    avatar: string;
    winsAllTime: number;
    totalPlays?: number;
}

export interface PrizeEntry {
    token: string;
    tokenAddress: string;
    icon: string;
    prize: number;
    usdValue: string;
    wins: number;
    maxWins: number;
    scanMode?: boolean;
    scanModePrizes?: string | null; // Scan Mode USDC prize pool (e.g. "$50 USDC")
}

export interface ActiveBoost {
    partnerName: string;
    partnerLogo: string;
    duration: number;
    endsAt: string;
    startsAt?: string;
    prize?: number;
}

export interface TodayStats {
    plays: number;
    wins: number;
    losses: number;
}

export interface Partner {
    name: string;
    logo: string;
    ca: string;
    scanMode?: boolean;
}

export interface BoostQueue {
    nextAvailableAt: string | null;
    queue: Array<{ partnerName: string; endsAt: string }>;
}

interface PuzzleDataState {
    // Core shared data
    globalStats: GlobalStats | null;
    todayStats: TodayStats | null;
    leaderboard: LeaderboardEntry[];
    prizes: PrizeEntry[];
    activeBoost: ActiveBoost | null;
    boostQueue: BoostQueue;
    partners: Partner[];

    // Farcaster wallet (shared across all puzzle pages)
    isFarcasterApp: boolean;
    sdkAddress: string | null;

    // Meta
    loading: boolean;
    pricesLoading: boolean;
    error: string | null;
    lastUpdated: number;
    realtimeConnected: boolean;

    // Actions
    refresh: () => Promise<void>;
    refreshLeaderboard: () => Promise<void>;
    refreshPrizes: () => Promise<void>;
}

const defaultState: PuzzleDataState = {
    globalStats: null,
    todayStats: null,
    leaderboard: [],
    prizes: [],
    activeBoost: null,
    boostQueue: { nextAvailableAt: null, queue: [] },
    partners: [],
    isFarcasterApp: false,
    sdkAddress: null,
    loading: true,
    pricesLoading: true,
    error: null,
    lastUpdated: 0,
    realtimeConnected: false,
    refresh: async () => { },
    refreshLeaderboard: async () => { },
    refreshPrizes: async () => { },
};

const PuzzleDataContext = createContext<PuzzleDataState>(defaultState);

// ==================== Provider ====================

interface PuzzleDataProviderProps {
    children: ReactNode;
}

export function PuzzleDataProvider({ children }: PuzzleDataProviderProps) {
    const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
    const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [prizes, setPrizes] = useState<PrizeEntry[]>([]);
    const [activeBoost, setActiveBoost] = useState<ActiveBoost | null>(null);
    const [boostQueue, setBoostQueue] = useState<BoostQueue>({ nextAvailableAt: null, queue: [] });
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [pricesLoading, setPricesLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState(0);

    // ==================== Auth (from shared AuthContext) ====================
    const { isFarcasterApp, sdkAddress } = useAuth();

    // Real-time subscription for all rooms
    const {
        connected: realtimeConnected,
        stats: realtimeStats,
        leaderboard: realtimeLeaderboard,
        boost: realtimeBoost,
        prizes: realtimePrizes,
    } = useRealtimeData({
        rooms: ['stats', 'leaderboard', 'boost', 'prizes'],
    });

    // ==================== Initial Fetch ====================

    const fetchPlatformData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all data in parallel from the unified endpoint
            const response = await fetch('/api/game/platform', { cache: 'no-store' });
            const data = await response.json();

            if (data.success && data.data) {
                const { globalStats: gs, todayStats: ts, leaderboard: lb, prizes: pz, activeBoost: ab, boostQueue: bq, partners: pt } = data.data;

                if (gs) setGlobalStats(gs);
                if (ts) setTodayStats(ts);
                if (lb) setLeaderboard(lb);
                if (pz) setPrizes([...pz].sort((a: PrizeEntry, b: PrizeEntry) => b.wins - a.wins));
                if (ab !== undefined) setActiveBoost(ab);
                if (bq) setBoostQueue(bq);
                if (pt) setPartners(pt);

                // Enrich prizes with real USD values from Moralis (non-blocking)
                // Computes total prize USD = prize_amount × token_usd_price
                if (pz && pz.length > 0) {
                    setPricesLoading(true);
                    fetch('/api/game/prizes', { cache: 'no-store' })
                        .then(r => r.json())
                        .then(prizeData => {
                            if (prizeData.success && prizeData.data?.prizes) {
                                const priceMap: Record<string, number> = {};
                                for (const p of prizeData.data.prizes) {
                                    priceMap[(p.tokenAddress || '').toLowerCase()] = p.usdPrice || 0;
                                }
                                setPrizes((prev: PrizeEntry[]) => prev.map(prize => {
                                    const tokenPrice = priceMap[(prize.tokenAddress || '').toLowerCase()] || 0;
                                    const totalUsd = prize.prize * tokenPrice;
                                    return {
                                        ...prize,
                                        usdValue: totalUsd > 0 ? `≈$${totalUsd >= 1000 ? `${(totalUsd / 1000).toFixed(1).replace(/\.0$/, '')}K` : totalUsd.toFixed(2)}` : '',
                                    };
                                }));
                            }
                        })
                        .catch(() => { /* USD enrichment is best-effort */ })
                        .finally(() => setPricesLoading(false));
                } else {
                    setPricesLoading(false);
                }

                setLastUpdated(Date.now());
            } else {
                throw new Error(data.error || 'Failed to fetch platform data');
            }
        } catch (err) {
            console.error('[PuzzleDataContext] Fetch error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');

            // Fallback: try individual endpoints
            await fetchFallback();
        } finally {
            setLoading(false);
        }
    }, []);

    // Fallback if unified endpoint fails
    const fetchFallback = async () => {
        try {
            const [leaderboardRes, prizesRes, boostRes] = await Promise.all([
                fetch('/api/game/leaderboard?limit=50'),
                fetch('/api/game/prizes'),
                fetch('/api/game/boost/active'),
            ]);

            const [leaderboardData, prizesData, boostData] = await Promise.all([
                leaderboardRes.json(),
                prizesRes.json(),
                boostRes.json(),
            ]);

            if (leaderboardData.success && leaderboardData.data) {
                setLeaderboard(leaderboardData.data.map((w: Record<string, unknown>) => ({
                    userId: w.userId as string || '',
                    displayName: (w.displayName as string) || (w.username as string) || 'Anonymous',
                    avatar: (w.avatar as string) || '/web-app-manifest-192x192.png',
                    winsAllTime: (w.wins as number) || (w.winsAllTime as number) || 0,
                })));
            }

            if (prizesData.success && prizesData.data?.partners) {
                const mapped = prizesData.data.partners.map((p: Record<string, unknown>) => ({
                    token: p.name as string,
                    tokenAddress: p.ca as string,
                    icon: p.logo as string,
                    prize: p.prize as number,
                    usdValue: `$${((p.prize as number) * ((p.usdPrice as number) || 0)).toFixed(2)}`,
                    wins: (p.wins as number) || 0,
                    maxWins: (p.maxWins as number) || 1000,
                }));
                setPrizes(mapped.sort((a: PrizeEntry, b: PrizeEntry) => b.wins - a.wins));
            }

            if (boostData.success && boostData.data) {
                setActiveBoost(boostData.data);
            }

            setLastUpdated(Date.now());
        } catch (err) {
            console.error('[PuzzleDataContext] Fallback fetch error:', err);
        }
    };

    const refreshLeaderboard = useCallback(async () => {
        try {
            const res = await fetch('/api/game/leaderboard?limit=50');
            const data = await res.json();
            if (data.success && data.data) {
                setLeaderboard(data.data.map((w: Record<string, unknown>) => ({
                    userId: w.userId as string || '',
                    displayName: (w.displayName as string) || (w.username as string) || 'Anonymous',
                    avatar: (w.avatar as string) || '/web-app-manifest-192x192.png',
                    winsAllTime: (w.wins as number) || (w.winsAllTime as number) || 0,
                })));
            }
        } catch (err) {
            console.error('[PuzzleDataContext] Refresh leaderboard error:', err);
        }
    }, []);

    const refreshPrizes = useCallback(async () => {
        try {
            const res = await fetch('/api/game/prizes');
            const data = await res.json();
            if (data.success && data.data?.partners) {
                const mapped = data.data.partners.map((p: Record<string, unknown>) => ({
                    token: p.name as string,
                    tokenAddress: p.ca as string,
                    icon: p.logo as string,
                    prize: p.prize as number,
                    usdValue: `$${((p.prize as number) * ((p.usdPrice as number) || 0)).toFixed(2)}`,
                    wins: (p.wins as number) || 0,
                    maxWins: (p.maxWins as number) || 1000,
                }));
                setPrizes(mapped.sort((a: PrizeEntry, b: PrizeEntry) => b.wins - a.wins));
            }
        } catch (err) {
            console.error('[PuzzleDataContext] Refresh prizes error:', err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchPlatformData();
    }, [fetchPlatformData]);

    // ==================== Real-time Updates ====================

    // Stats updates (global + today)
    useEffect(() => {
        const rtStats = realtimeStats as Record<string, unknown> | null;
        if (!rtStats) return;

        console.log('[PuzzleDataContext] Stats update:', rtStats);

        // Delta-based updates for global stats
        if (rtStats.delta && typeof rtStats.delta === 'object') {
            const delta = rtStats.delta as Record<string, number>;
            setGlobalStats(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    totalPlays: prev.totalPlays + (delta.totalPlays || 0),
                    totalWins: prev.totalWins + (delta.totalWins || 0),
                    totalLosses: prev.totalLosses + (delta.totalLosses || 0),
                    totalBoughtAttempts: prev.totalBoughtAttempts + (delta.totalBoughtAttempts || 0),
                };
            });
            setTodayStats(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    plays: prev.plays + (delta.todayPlays || 0),
                    wins: prev.wins + (delta.todayWins || 0),
                    losses: prev.losses + (delta.todayLosses || 0),
                };
            });
        }

        // Full replacement if provided
        if (rtStats.global && typeof rtStats.global === 'object') {
            setGlobalStats(rtStats.global as GlobalStats);
        }
        if (rtStats.today && typeof rtStats.today === 'object') {
            setTodayStats(rtStats.today as TodayStats);
        }
    }, [realtimeStats]);

    // Leaderboard updates
    useEffect(() => {
        if (!realtimeLeaderboard) return;

        console.log('[PuzzleDataContext] Leaderboard update:', realtimeLeaderboard);

        // Single player update
        const player = realtimeLeaderboard as LeaderboardEntry;
        if (player.userId) {
            setLeaderboard(prev => {
                const idx = prev.findIndex(p => p.userId === player.userId);
                let updated: LeaderboardEntry[];

                if (idx >= 0) {
                    // Update existing player
                    updated = [...prev];
                    updated[idx] = { ...updated[idx], ...player };
                } else {
                    // New player - add and re-sort
                    updated = [...prev, player];
                }

                // Sort by wins and limit to top 50
                return updated
                    .sort((a, b) => b.winsAllTime - a.winsAllTime)
                    .slice(0, 50);
            });
        }
    }, [realtimeLeaderboard]);

    // Boost updates
    useEffect(() => {
        if (!realtimeBoost) return;

        console.log('[PuzzleDataContext] Boost update:', realtimeBoost);

        const boost = realtimeBoost as { active?: ActiveBoost | null };
        if (boost.active !== undefined) {
            setActiveBoost(boost.active);
        }
    }, [realtimeBoost]);

    // Auto-clear expired boost client-side
    useEffect(() => {
        if (!activeBoost?.endsAt) return;

        const endsAt = new Date(activeBoost.endsAt).getTime();
        const now = Date.now();
        const remaining = endsAt - now;

        if (remaining <= 0) {
            // Already expired
            setActiveBoost(null);
            return;
        }

        const timer = setTimeout(() => {
            console.log('[PuzzleDataContext] Boost expired, clearing activeBoost');
            setActiveBoost(null);
            // Refresh to pick up the next boost in queue (if any)
            fetchPlatformData();
        }, remaining);

        return () => clearTimeout(timer);
    }, [activeBoost, fetchPlatformData]);

    // Prizes updates
    useEffect(() => {
        if (!realtimePrizes) return;

        console.log('[PuzzleDataContext] Prizes update:', realtimePrizes);

        const rp = realtimePrizes as {
            partnerName?: string;
            wins?: number | Record<string, number>;
            tokenWins?: Record<string, number>;
            prices?: Record<string, { usdPrice: number }>;
        };

        // Single partner win update
        if (rp.partnerName && typeof rp.wins === 'number') {
            setPrizes(prev => prev.map(prize => {
                if (prize.token.toLowerCase().includes(rp.partnerName!.toLowerCase())) {
                    return { ...prize, wins: rp.wins as number };
                }
                return prize;
            }));
        }

        // Batch wins update by token address
        if (rp.wins && typeof rp.wins === 'object' && !rp.partnerName) {
            const winsMap = rp.wins as Record<string, number>;
            setPrizes(prev => prev.map(prize => {
                const newWins = winsMap[prize.tokenAddress];
                if (newWins !== undefined) {
                    return { ...prize, wins: newWins };
                }
                return prize;
            }));
        }

        // Token wins from stats broadcast
        if (rp.tokenWins) {
            setPrizes(prev => prev.map(prize => {
                const newWins = rp.tokenWins![prize.tokenAddress];
                if (newWins !== undefined) {
                    return { ...prize, wins: newWins };
                }
                return prize;
            }));
        }

        // Price updates
        if (rp.prices) {
            setPrizes(prev => prev.map(prize => {
                const priceData = rp.prices![prize.tokenAddress];
                if (priceData?.usdPrice !== undefined) {
                    const usdValue = prize.prize * priceData.usdPrice;
                    return { ...prize, usdValue: `$${usdValue.toFixed(2)}` };
                }
                return prize;
            }));
        }
    }, [realtimePrizes]);

    // ==================== Context Value ====================

    const value: PuzzleDataState = {
        globalStats,
        todayStats,
        leaderboard,
        prizes,
        activeBoost,
        boostQueue,
        partners,
        isFarcasterApp,
        sdkAddress,
        loading,
        pricesLoading,
        error,
        lastUpdated,
        realtimeConnected,
        refresh: fetchPlatformData,
        refreshLeaderboard,
        refreshPrizes,
    };

    return (
        <PuzzleDataContext.Provider value={value}>
            {children}
        </PuzzleDataContext.Provider>
    );
}

// ==================== Hook ====================

export function usePuzzleData() {
    const context = useContext(PuzzleDataContext);
    if (!context) {
        throw new Error('usePuzzleData must be used within a PuzzleDataProvider');
    }
    return context;
}

export default PuzzleDataContext;
