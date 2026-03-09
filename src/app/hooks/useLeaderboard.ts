'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type LeaderboardTab = 'skilled' | 'wins' | 'spenders' | 'referral';
export type ReferralSubTab = 'referral_earners' | 'referral_refs';

// Row shapes per tab
export interface SkilledRow {
    userId: string;
    username: string;
    avatar: string;
    level: number;
    winRate: number;
    totalPlays: number;
    winsAllTime: number;
}
export interface WinsRow {
    userId: string;
    username: string;
    avatar: string;
    wins: number;
    totalPlays: number;
}
export interface SpendersRow {
    userId: string;
    username: string;
    avatar: string;
    totalBoughtAttempts: number;
}
export interface ReferralRow {
    userId: string;
    username: string;
    avatar: string;
    totalReferrals: number;
    totalEarnings: number;
}

export interface CurrentUserRank {
    userId: string;
    username: string;
    avatar: string;
    rank: number;
    // Tab-specific
    level?: number;
    winRate?: number;
    wins?: number;
    totalBoughtAttempts?: number;
    totalReferrals?: number;
    totalEarnings?: number;
}

const PAGE_SIZE = 20;

export function useLeaderboard(userId?: string) {
    const [tab, setTab] = useState<LeaderboardTab>('skilled');
    const [referralSub, setReferralSub] = useState<ReferralSubTab>('referral_earners');
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [rows, setRows] = useState<any[]>([]);
    const [summaryStats, setSummaryStats] = useState<Record<string, number>>({});
    const [currentUser, setCurrentUser] = useState<CurrentUserRank | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const offsetRef = useRef(0);

    const fetchPage = useCallback(async (
        activeTab: LeaderboardTab,
        subTab: ReferralSubTab,
        offset: number,
        append: boolean,
        uid?: string
    ) => {
        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }
        setError(null);
        try {
            const apiTab = activeTab === 'referral' ? subTab : activeTab;
            let url = `/api/game/leaderboard?tab=${apiTab}&limit=${PAGE_SIZE}&offset=${offset}`;
            if (uid) url += `&userId=${encodeURIComponent(uid)}`;

            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Failed');

            if (append) {
                setRows(prev => [...prev, ...(json.data || [])]);
            } else {
                setRows(json.data || []);
                setSummaryStats(json.summaryStats || {});
                setCurrentUser(json.currentUser || null);
            }
            setHasMore(json.hasMore === true);
            offsetRef.current = offset + (json.data?.length || 0);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to load leaderboard');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    // Fetch on mount and whenever tab/sub changes
    useEffect(() => {
        offsetRef.current = 0;
        fetchPage(tab, referralSub, 0, false, userId);
    }, [tab, referralSub, fetchPage, userId]);

    // Auto-refresh every 30s for real-time updates (silent, no loading spinner)
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const apiTab = tab === 'referral' ? referralSub : tab;
                // Fetch all currently loaded rows (up to current offset)
                const total = offsetRef.current || PAGE_SIZE;
                let url = `/api/game/leaderboard?tab=${apiTab}&limit=${total}&offset=0`;
                if (userId) url += `&userId=${encodeURIComponent(userId)}`;

                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) return;
                const json = await res.json();
                if (!json.success) return;

                setRows(json.data || []);
                setSummaryStats(json.summaryStats || {});
                setCurrentUser(json.currentUser || null);
                setHasMore(json.hasMore === true);
                offsetRef.current = json.data?.length || 0;
            } catch {
                // Silent fail — don't disrupt UX
            }
        }, 10_000);
        return () => clearInterval(interval);
    }, [tab, referralSub, userId]);

    const fetchMore = useCallback(() => {
        if (loadingMore || !hasMore) return;
        fetchPage(tab, referralSub, offsetRef.current, true, userId);
    }, [tab, referralSub, loadingMore, hasMore, fetchPage, userId]);

    const switchTab = useCallback((newTab: LeaderboardTab) => {
        setTab(newTab);
    }, []);

    const switchReferralSub = useCallback(() => {
        setReferralSub((prev) =>
            prev === 'referral_earners' ? 'referral_refs' : 'referral_earners'
        );
    }, []);

    return {
        tab,
        referralSub,
        loading,
        loadingMore,
        error,
        rows: rows as SkilledRow[] | WinsRow[] | SpendersRow[] | ReferralRow[],
        summaryStats,
        currentUser,
        hasMore,
        switchTab,
        switchReferralSub,
        fetchMore,
        refetch: () => {
            offsetRef.current = 0;
            fetchPage(tab, referralSub, 0, false, userId);
        },
    };
}
