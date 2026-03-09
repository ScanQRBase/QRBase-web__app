/**
 * Game Module Index
 * Re-exports all game-related modules for convenient imports.
 *
 * @example
 * import { getUserIdFromPrivyUser } from '@/src/app/lib/game';
 */

// Types
export type {
    UserData,
    GameStatusResponse,
    PlayResponse,
    WinResponse,
    BuyResponse,
} from './types';

export {
    DEFAULT_USER_DATA,
    getUserKey,
    getGameDay,
    getSecondsUntilMidnightUTC,
    getTodayMidnightUTC,
    needsDailyReset,
    isValidUserId,
} from './types';

// Game Service removed — GameService KV class deleted (D1 is the single source of truth)

// React Hooks (client-side)
export { useGameChances, getUserIdFromPrivyUser } from './use-game-chances';
export type { UseGameChancesOptions, UseGameChancesReturn } from './use-game-chances';
