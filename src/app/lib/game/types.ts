/**
 * Game Types
 * Core TypeScript interfaces for the puzzle game system.
 * 
 * USER ID FORMAT:
 * - Farcaster: fc:{FID}
 * - Twitter/X: x:{USERNAME}
 * 
 * KV KEY FORMAT:
 * - Single key per user: user:{USER_ID}
 */

// ============================================================================
// User Data (Stored in KV)
// ============================================================================

/**
 * User data stored in Cloudflare KV.
 * Key: user:{USER_ID}
 * 
 * Reset logic runs on every request:
 * - If lastResetAt is before today's UTC midnight, reset daily values
 */
export interface UserData {
    /** Free chances remaining (resets to 3 daily) */
    freeChances: number;
    /** Paid chances remaining (resets to 0 daily) */
    paidChances: number;
    /** Wins today (resets to 0 daily) */
    winsToday: number;
    /** Wins all time (NEVER resets) */
    winsAllTime: number;
    /** Last reset timestamp (UTC ISO string) */
    lastResetAt: string;
}

/** Default user data for new users */
export const DEFAULT_USER_DATA: UserData = {
    freeChances: 3,
    paidChances: 0,
    winsToday: 0,
    winsAllTime: 0,
    lastResetAt: new Date().toISOString(),
};

// ============================================================================
// API Response Types
// ============================================================================

export interface GameStatusResponse {
    success: boolean;
    data?: {
        userId: string;
        freeChances: number;
        paidChances: number;
        totalChances: number;
        canPlay: boolean;
        winsToday: number;
        winsAllTime: number;
        resetInSeconds: number;
        gameDay: string;
    };
    error?: string;
}

export interface PlayResponse {
    success: boolean;
    data?: {
        chancesRemaining: number;
        freeChances: number;
        paidChances: number;
    };
    error?: string;
}

export interface WinResponse {
    success: boolean;
    data?: {
        winsToday: number;
        winsAllTime: number;
    };
    error?: string;
}

export interface BuyResponse {
    success: boolean;
    data?: {
        paidChances: number;
        totalChances: number;
    };
    error?: string;
}

// ============================================================================
// KV Key Helpers
// ============================================================================

/**
 * Generates the KV key for a user.
 * Format: user:{USER_ID}
 */
export function getUserKey(userId: string): string {
    return `user:${userId}`;
}

// ============================================================================
// Date/Time Helpers
// ============================================================================

/**
 * Returns the current game day in YYYY-MM-DD format (UTC).
 */
export function getGameDay(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

/**
 * Returns today's UTC midnight as ISO string.
 */
export function getTodayMidnightUTC(): string {
    const now = new Date();
    const midnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0, 0, 0, 0
    ));
    return midnight.toISOString();
}

/**
 * Calculates seconds until next UTC midnight.
 */
export function getSecondsUntilMidnightUTC(): number {
    const now = new Date();
    const nextMidnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
    ));
    return Math.ceil((nextMidnight.getTime() - now.getTime()) / 1000);
}

/**
 * Checks if a timestamp is before today's UTC midnight.
 * Used to determine if user data needs daily reset.
 */
export function needsDailyReset(lastResetAt: string): boolean {
    const lastReset = new Date(lastResetAt);
    const todayMidnight = new Date(getTodayMidnightUTC());
    return lastReset < todayMidnight;
}

// ============================================================================
// User ID Validation
// ============================================================================

/**
 * Validates a user ID string.
 * 
 * Valid formats:
 * - fc:{FID} - Farcaster user
 * - x:{username} - Twitter/X user
 */
export function isValidUserId(userId: string): boolean {
    if (!userId || typeof userId !== 'string') {
        return false;
    }
    // Farcaster: fc:{number}
    if (/^fc:\d+$/.test(userId)) return true;
    // Twitter/X: x:{alphanumeric with underscores}
    if (/^x:[a-zA-Z0-9_]{1,50}$/.test(userId)) return true;
    return false;
}
