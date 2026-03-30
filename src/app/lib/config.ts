/**
 * Central application config
 * Single source of truth for all env-driven values.
 * Import from here — never read process.env or hardcode values directly in feature files.
 */

// ─── Blockchain ──────────────────────────────────────────────────────────────

export const SCAN_TOKEN_ADDRESS = (
    process.env.NEXT_PUBLIC_SCAN_TOKEN_ADDRESS ||
    '0x20429F731096e359910921994A267d32ef576720'
) as `0x${string}`;

export const USDC_ADDRESS = (
    process.env.NEXT_PUBLIC_USDC_ADDRESS ||
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
) as `0x${string}`;

export const PRIZE_POOL_WALLET = (
    process.env.PRIZE_POOL_WALLET || ''
) as string;

// ERC-20 decimals multiplier (10^18)
export const TOKEN_DECIMALS = BigInt('1000000000000000000');

// ─── Worker / API ─────────────────────────────────────────────────────────────

export const GAME_WORKER_URL =
    process.env.GAME_WORKER_URL ||
    'https://puzzlegame-staging.bitgrass-crypto.workers.dev';

export const GAME_API_KEY = process.env.GAME_API_KEY || '';

// ─── Game Rules ───────────────────────────────────────────────────────────────

/** Default $SCAN prize per win (used when D1 partner prize_amount is unavailable) */
export const DEFAULT_PRIZE_AMOUNT = Number(
    process.env.DEFAULT_PRIZE_AMOUNT || 2000
);

/** Max wins before a Quick Round partner is auto-deactivated */
export const MAX_WINS_PER_PARTNER = Number(
    process.env.MAX_WINS_PER_PARTNER || 100
);

/** Free chances given to new users */
export const DEFAULT_FREE_CHANCES = Number(
    process.env.DEFAULT_FREE_CHANCES || 3
);

/** Referral commission rate (0.10 = 10%) */
export const REFERRAL_COMMISSION_RATE = Number(
    process.env.REFERRAL_COMMISSION_RATE || 0.10
);

/** Minimum $SCAN required to claim referral earnings */
export const MINIMUM_REFERRAL_CLAIM = Number(
    process.env.MINIMUM_REFERRAL_CLAIM || 10
);

/** $SCAN cost per bought attempt */
export const ATTEMPT_PRICE = Number(
    process.env.ATTEMPT_PRICE || 1000
);

// ─── Domain / URLs ────────────────────────────────────────────────────────────

export const BASE_URL =
    process.env.NEXT_PUBLIC_URL || 'https://www.qrbase.xyz';

export const REDIRECT_URL =
    process.env.NEXT_PUBLIC_URL || 'https://www.qrbase.xyz';
