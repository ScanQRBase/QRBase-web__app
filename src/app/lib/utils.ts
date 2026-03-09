/**
 * Shared utility functions used across puzzle and scanMode components.
 * Consolidates previously duplicated logic from:
 * - QrBaseCoinInfo, QrBasePartnerInfo, QrBaseQrcodeItems
 * - ScanModeCoinInfo, ScanModePartnerInfo, ScanModeQrcodeItems
 */

/**
 * Format a large number into a compact human-readable string.
 *
 * Handles billions (B), millions (M), and thousands (K).
 * For values < 1000, returns the integer string.
 *
 * @param value — the number to format
 * @param precision — decimal places for compact units (default: 1)
 *
 * @example
 * formatLargeValue(1_500_000_000) // "1.5B"
 * formatLargeValue(2_300_000)     // "2.3M"
 * formatLargeValue(45_000)        // "45K"
 * formatLargeValue(800)           // "800"
 * formatLargeValue(0)             // "0"
 */
export function formatLargeValue(value: number, precision = 1): string {
    if (!value && value !== 0) return '0';
    if (value >= 1_000_000_000) {
        const num = Math.round(value / (10 ** (9 - precision))) / (10 ** precision);
        return `${Number.isInteger(num) ? num.toFixed(0) : num}B`;
    }
    if (value >= 1_000_000) {
        const num = Math.round(value / (10 ** (6 - precision))) / (10 ** precision);
        return `${Number.isInteger(num) ? num.toFixed(0) : num}M`;
    }
    if (value >= 1_000) {
        const num = Math.round(value / (10 ** (3 - precision))) / (10 ** precision);
        return `${Number.isInteger(num) ? num.toFixed(0) : num}K`;
    }
    return Math.round(value).toString();
}

/**
 * Determine an access-requirement status from a balance and a required minimum.
 *
 * @returns 'unknown' if balance is null (not connected),
 *          'accepted' if balance >= min,
 *          'rejected' otherwise.
 */
export function getAccessStatus(
    balance: number | null,
    min: number,
): 'unknown' | 'rejected' | 'accepted' {
    if (balance === null) return 'unknown';
    return balance >= min ? 'accepted' : 'rejected';
}

/**
 * Format a timer value (seconds) into mm:ss string.
 *
 * @example formatTimer(65) // "01:05"
 */
export function formatTimer(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
