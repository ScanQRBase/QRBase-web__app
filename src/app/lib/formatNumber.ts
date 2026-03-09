/**
 * Format large numbers with K, M, B suffixes.
 * Examples: 1500 → "1.5K", 2000000 → "2M", 3000000000 → "3B"
 */
export function formatNumber(num: number | undefined | null): string {
    if (num == null) return '0';
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return num.toLocaleString();
}
