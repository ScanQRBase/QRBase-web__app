/**
 * useUserProfile Hook
 * Fetches user profile data including level system info
 */

import { useState, useEffect, useCallback } from 'react';

export interface ReferralDetail {
    userId: string;
    displayName: string | null;
    profilePhoto: string | null;
    totalSpent: number;
    earnings: number;
}

export interface ReferrerStats {
    totalReferrals: number;
    totalEarnings: number;
    pendingEarnings: number;
    claimedAmount: number;
    referredUsers: ReferralDetail[];
}

export interface UserProfile {
    userId: string;
    freeChances: number;
    paidChances: number;
    totalChances: number;
    canPlay: boolean;
    winsToday: number;
    winsAllTime: number;
    totalPlays: number;
    totalLosses: number;
    totalBoughtAttempts: number;
    // Level System
    level: number;
    timerSeconds: number;
    winRate: number;
    progressToNextLevel: number;
    nextLevelRequirements: {
        level: number;
        minGamesPlayed: number;
        minWinRate: number;
        timerSeconds: number;
    } | null;
    // Referral Stats
    referralStats: ReferrerStats;
    // Token wins per partner
    tokenWins?: Record<string, number>;
    // Total $SCAN rewarded (computed from actual partner prize amounts)
    scanRewarded?: number;
}

export function useUserProfile(userId: string | null) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        if (!userId) {
            setProfile(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/game/status?userId=${encodeURIComponent(userId)}`);
            const data = await response.json();

            if (data.success) {
                setProfile(data.data);
            } else {
                setError(data.error || 'Failed to fetch profile');
            }
        } catch (err) {
            setError('Network error');
            console.error('useUserProfile error:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { profile, loading, error, refresh: fetchProfile };
}
