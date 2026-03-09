/**
 * useGameChances Hook
 * React hook for managing game chances via Next.js Edge API.
 *
 * SECURITY: This hook calls local Edge API routes (NOT the worker directly).
 * The Edge API routes handle authentication with the worker server-side.
 * 
 * Flow: Browser → /api/game/* → Worker (with secret API key)
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

export interface GameStatus {
    userId: string;
    freeChances: number;
    paidChances: number;
    totalChances: number;
    canPlay: boolean;
    winsToday: number;
    winsAllTime: number;
    resetInSeconds: number;
    gameDay: string;
    // Game state - only currentImageUrl needed (null = no image, value = use saved)
    currentImageUrl: string | null;
    lastGeneratedAt: string | null;
    // Dynamic attempts display
    totalBoughtAttemptsDay?: number; // Bought attempts today (for dynamic denominator)
    // Level system
    level?: number;
    timerSeconds?: number;
    winRate?: number;
    progressToNextLevel?: number;
}

export interface UseGameChancesOptions {
    /** User ID (fc:{FID} or x:{username}) */
    userId: string | null;
    /** Auto-fetch on mount and when userId changes */
    autoFetch?: boolean;
    /** Callback when play succeeds */
    onPlaySuccess?: () => void;
    /** Callback when play fails */
    onPlayError?: (error: string) => void;
}

export interface UseGameChancesReturn {
    gameStatus: GameStatus | null;
    isLoading: boolean;
    error: string | null;
    canPlay: boolean;
    totalChances: number;
    freeChances: number;
    paidChances: number;
    winsToday: number;
    winsAllTime: number;
    resetInSeconds: number;
    countdownDisplay: string;
    currentImageUrl: string | null;
    refresh: () => Promise<void>;
    play: () => Promise<boolean>;
    recordWin: (moves?: number, timeMs?: number, walletAddress?: string) => Promise<{ success: boolean; txHash?: string }>;
    recordLoss: (moves?: number, timeMs?: number) => Promise<boolean>;
    generateImage: () => Promise<{ imageUrl: string; prize: number; logo: string | null } | null>;
    startGame: () => Promise<boolean>;
    buyChances: (amount: number, txHash?: string) => Promise<boolean>;
    isPlaying: boolean;
    isGeneratingQr: boolean;
    isBuying: boolean;
    currentPrize: number;
    currentPartnerLogo: string | null;
    totalBoughtAttemptsDay: number; // For dynamic attempts display
    // Level system
    level: number;
    timerSeconds: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useGameChances(options: UseGameChancesOptions): UseGameChancesReturn {
    const { userId, autoFetch = true, onPlaySuccess, onPlayError } = options;

    const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRecordingWin, setIsRecordingWin] = useState(false);
    const [isGeneratingQr, setIsGeneratingQr] = useState(false);
    const [currentPrize, setCurrentPrize] = useState(10000);
    const [currentPartnerLogo, setCurrentPartnerLogo] = useState<string | null>(null);
    const [isBuying, setIsBuying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resetInSeconds, setResetInSeconds] = useState(0);

    // ==========================================================================
    // Fetch Game Status - Calls LOCAL Edge API (not worker directly)
    // ==========================================================================

    const fetchStatus = useCallback(async () => {
        if (!userId) {
            setGameStatus(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/game/status?userId=${encodeURIComponent(userId)}`,
                { cache: 'no-store' }
            );
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to fetch game status");
            }

            setGameStatus(data.data);
            setResetInSeconds(data.data.resetInSeconds);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to fetch game status";
            setError(message);
            console.error("fetchStatus error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // ==========================================================================
    // Play/Consume Chance - Calls LOCAL Edge API
    // ==========================================================================

    const play = useCallback(async (): Promise<boolean> => {
        if (!userId) {
            setError("Not authenticated");
            onPlayError?.("Not authenticated");
            return false;
        }

        if (isPlaying) return false;

        setIsPlaying(true);
        setError(null);

        try {
            const response = await fetch(`/api/game/play`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to play");
            }

            if (gameStatus) {
                setGameStatus({
                    ...gameStatus,
                    freeChances: data.data.freeChances,
                    paidChances: data.data.paidChances,
                    totalChances: data.data.chancesRemaining,
                    canPlay: data.data.chancesRemaining > 0,
                });
            }

            onPlaySuccess?.();
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to play";
            setError(message);
            onPlayError?.(message);
            return false;
        } finally {
            setIsPlaying(false);
        }
    }, [userId, isPlaying, gameStatus, onPlaySuccess, onPlayError]);

    // ==========================================================================
    // Record Win - Calls LOCAL Edge API (with moves and time tracking)
    // ==========================================================================

    const recordWin = useCallback(async (moves?: number, timeMs?: number, walletAddress?: string): Promise<{ success: boolean; txHash?: string }> => {
        if (!userId) return { success: false };
        if (isRecordingWin) return { success: false }; // Prevent duplicate win calls

        setIsRecordingWin(true);
        try {
            const response = await fetch(`/api/game/win`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    moves: moves || null,
                    timeMs: timeMs || null,
                    walletAddress: walletAddress || null,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                console.error("recordWin error:", data.error);
                return { success: false };
            }

            // Refetch full status to get updated level, timerSeconds, etc.
            await fetchStatus();

            // Extract payout tx hash if available
            const txHash = data.data?.payout?.txHash;
            return { success: true, txHash };
        } catch (err) {
            console.error("recordWin error:", err);
            return { success: false };
        } finally {
            setIsRecordingWin(false);
        }
    }, [userId, isRecordingWin, fetchStatus]);

    // ==========================================================================
    // Record Loss - Calls LOCAL Edge API (with moves tracking)
    // ==========================================================================

    // BUG-8 FIX: Added timeMs parameter so actual game time is sent to backend
    const recordLoss = useCallback(async (moves?: number, timeMs?: number): Promise<boolean> => {
        if (!userId) return false;

        try {
            const response = await fetch(`/api/game/loss`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    moves: moves || null,
                    timeMs: timeMs || null,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                console.error("recordLoss error:", data.error);
                return false;
            }

            // BUG-6 FIX: Update local state after loss
            await fetchStatus();

            return true;
        } catch (err) {
            console.error("recordLoss error:", err);
            return false;
        }
    }, [userId, fetchStatus]);


    // ==========================================================================
    // Generate Image (Idempotent) - Calls /api/game/generate
    // ==========================================================================

    const generateImage = useCallback(async (): Promise<{ imageUrl: string; prize: number; logo: string | null } | null> => {
        if (!userId) {
            setError("Not authenticated");
            return null;
        }

        setIsGeneratingQr(true);
        setError(null);

        try {
            const response = await fetch(`/api/game/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to generate image");
            }

            // Update local state with new image
            if (gameStatus) {
                setGameStatus({
                    ...gameStatus,
                    currentImageUrl: data.data.imageUrl,
                });
            }

            // Set prize and logo from partner data
            const prize = data.data.partner?.prize || 10000;
            const logo = data.data.partner?.logo || null;
            setCurrentPrize(prize);
            setCurrentPartnerLogo(logo);

            return { imageUrl: data.data.imageUrl, prize, logo };
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to generate image";
            setError(message);
            console.error("generateImage error:", err);
            return null;
        } finally {
            setIsGeneratingQr(false);
        }
    }, [userId, gameStatus]);

    // ==========================================================================
    // Start Game - Calls /api/game/start-game
    // ==========================================================================

    const startGame = useCallback(async (): Promise<boolean> => {
        if (!userId) {
            setError("Not authenticated");
            return false;
        }

        try {
            const response = await fetch(`/api/game/start-game`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to start game");
            }

            // Update local state - clear image (game started)
            if (gameStatus) {
                setGameStatus({
                    ...gameStatus,
                    currentImageUrl: null,  // Cleared when game starts
                });
            }

            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to start game";
            setError(message);
            console.error("startGame error:", err);
            return false;
        }
    }, [userId, gameStatus]);

    // ==========================================================================
    // Buy Chances - Calls /api/game/buy
    // ==========================================================================

    const buyChances = useCallback(async (amount: number = 1, txHash?: string): Promise<boolean> => {
        if (!userId) {
            setError("Not authenticated");
            return false;
        }

        if (isBuying) return false;

        if (!txHash || !txHash.startsWith('0x')) {
            setError("Missing transaction hash — on-chain transfer required");
            return false;
        }

        setIsBuying(true);
        setError(null);

        try {
            const response = await fetch(`/api/game/buy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, amount, txHash }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to buy chances");
            }

            // Update local state with new chances
            if (gameStatus) {
                setGameStatus({
                    ...gameStatus,
                    paidChances: data.data.paidChances,
                    totalChances: data.data.totalChances,
                    canPlay: data.data.totalChances > 0,
                });
            }

            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to buy chances";
            setError(message);
            console.error("buyChances error:", err);
            return false;
        } finally {
            setIsBuying(false);
        }
    }, [userId, gameStatus, isBuying]);

    // ==========================================================================
    // Countdown Timer
    // ==========================================================================

    useEffect(() => {
        if (resetInSeconds <= 0) return;

        const interval = setInterval(() => {
            setResetInSeconds((prev) => {
                if (prev <= 1) {
                    fetchStatus();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [resetInSeconds, fetchStatus]);

    useEffect(() => {
        if (autoFetch && userId) {
            fetchStatus();
        }
    }, [autoFetch, userId, fetchStatus]);

    const formatCountdown = (seconds: number): string => {
        if (seconds <= 0) return "0h 0m 0s";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}h ${minutes}m ${secs}s`;
    };

    return {
        gameStatus,
        isLoading,
        error,
        canPlay: gameStatus?.canPlay ?? false,
        totalChances: gameStatus?.totalChances ?? 0,
        freeChances: gameStatus?.freeChances ?? 0,
        paidChances: gameStatus?.paidChances ?? 0,
        winsToday: gameStatus?.winsToday ?? 0,
        winsAllTime: gameStatus?.winsAllTime ?? 0,
        resetInSeconds,
        countdownDisplay: formatCountdown(resetInSeconds),
        currentImageUrl: gameStatus?.currentImageUrl ?? null,
        refresh: fetchStatus,
        play,
        recordWin,
        recordLoss,
        generateImage,
        startGame,
        buyChances,
        isPlaying,
        isGeneratingQr,
        isBuying,
        currentPrize,
        currentPartnerLogo,
        totalBoughtAttemptsDay: gameStatus?.totalBoughtAttemptsDay ?? 0,
        // Level system
        level: gameStatus?.level ?? 0,
        timerSeconds: gameStatus?.timerSeconds ?? 60,
    };
}

// ============================================================================
// Helper: Get User ID from Privy User
// ============================================================================

export function getUserIdFromPrivyUser(user: any): string | null {
    if (!user) return null;
    if (user.farcaster?.fid) return `fc:${user.farcaster.fid}`;
    if (user.twitter?.username) return `x:${user.twitter.username}`;
    return null;
}
