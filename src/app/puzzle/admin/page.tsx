"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRealtimeData } from "@/src/app/lib/realtime";
import { usePuzzleData } from "@/src/app/lib/context/PuzzleDataContext";
import {
    Users, Gamepad2, Trophy, HeartCrack, Coins, BarChart3,
    Timer, CalendarDays, TrendingUp, Handshake, Link2,
    Zap, Flame, Clock, CheckCircle2, DollarSign, CircleGauge,
    ClipboardList, Megaphone, Medal, Search, RefreshCw,
    CircleCheck, ArrowUpDown, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, Percent, Activity,
} from "lucide-react";
import XIcon from "@/src/app/images/svg/socialMedia/XIcon";
import WarpcastIcon from "@/src/app/images/svg/socialMedia/WarpcastIcon";
// ============================================================================
// Types
// ============================================================================

interface AdminStats {
    global: {
        totalUsers: number;
        totalPlays: number;
        totalWins: number;
        totalLosses: number;
        totalBoughtAttempts: number;
        avgMoves: number;
        avgTimeMs: number;
    };
    today: {
        plays: number;
        wins: number;
        losses: number;
    };
    last7Days: Array<{
        date: string;
        plays: number;
        wins: number;
        losses: number;
    }>;
    topPlayers: Array<{
        userId: string;
        displayName: string | null;
        winsAllTime: number;
        totalPlays: number;
    }>;
    partnerStats: Array<{
        partnerName: string;
        gamesPlayed: number;
        wins: number;
        losses: number;
    }>;
    recentGames: Array<GameRecord>;
}

interface GameRecord {
    id: string;
    odId?: string;
    userId?: string;
    displayName?: string;
    avatar?: string;
    profilePhoto?: string;
    partnerName: string | null;
    partnerLogo?: string;
    moves: number;
    timeMs: number;
    result: "win" | "loss" | "pending";
    createdAt: string;
    isNew?: boolean;
}

interface BoostStats {
    summary: {
        totalBoosts: number;
        activeBoosts: number;
        queuedBoosts: number;
        completedBoosts: number;
        totalRevenue: number;
        totalHours: number;
    };
    perToken: Array<{
        partnerName: string;
        count: number;
        revenue: number;
        hours: number;
    }>;
    perUser: Array<{
        odId: string;
        count: number;
        spent: number;
        hours: number;
    }>;
    perDate: Array<{
        date: string;
        count: number;
        revenue: number;
    }>;
    queue: Array<{
        id: string;
        partnerName: string;
        partnerLogo: string;
        duration: number;
        startsAt: string;
        endsAt: string;
        purchasedBy: string;
        amount: number;
        status: "active" | "queued" | "completed";
        createdAt: string;
    }>;
}

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning';
    icon: string;
}

interface ReferralData {
    referrerId: string;
    displayName: string | null;
    totalReferrals: number;
    totalEarnings: number;
    pendingEarnings: number;
    firstReferralAt: string | null;
    lastReferralAt: string | null;
    referredUsers: Array<{
        userId: string;
        displayName: string | null;
        profilePhoto: string | null;
        joinedAt: string;
        totalSpent: number;
        earnings: number;
    }>;
}

interface BoostPurchase {
    id: string;
    userId: string | null;
    userName: string | null;
    userImage: string | null;
    tokenName: string;
    tokenImage: string;
    durationHours: number;
    amount: number;
    status: string;
    startsAt: string;
    endsAt: string;
    purchasedAt: string;
}

interface AttemptPurchase {
    id: number;
    userId: string;
    userName: string;
    userImage: string | null;
    amount: number;
    purchasedAt: string;
}

interface TaskStatsData {
    summary: {
        totalTasks: number;
        activeTasks: number;
        totalCompletions: number;
        todayCompletions: number;
        totalRevenue: number;
        avgFillRate: number;
    };
    topPromoters: Array<{
        userId: string;
        displayName: string | null;
        profilePhoto: string | null;
        tasksCreated: number;
        totalSpent: number;
        avgFillRate: number;
    }>;
    topCompleters: Array<{
        userId: string;
        displayName: string | null;
        profilePhoto: string | null;
        tasksCompleted: number;
        lastActive: string;
    }>;
    activeTasks: Array<{
        id: string;
        platform: string;
        taskType: string;
        label: string;
        actionsBundled: string;
        targetLink: string;
        price: number;
        maxCompletions: number;
        completionsCount: number;
        durationHours: number;
        expiresAt: string;
        createdAt: string;
        promoterName: string | null;
        promoterPhoto: string | null;
    }>;
    platformComparison: Array<{
        platform: string;
        taskCount: number;
        totalCompletions: number;
        totalRevenue: number;
        avgFillRate: number;
    }>;
    recentCompletions: Array<{
        taskId: string;
        userId: string;
        completedAt: string;
        completerName: string | null;
        completerPhoto: string | null;
        targetLink: string;
        platform: string;
        taskLabel: string;
    }>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse display name from various formats like "x:username" or "twitter:name"
 * Returns just the name part after the colon, or the full string if no colon
 */
function parseDisplayName(name: string | undefined | null): string {
    if (!name) return '';
    // If format is "prefix:name", extract just the name
    if (name.includes(':')) {
        const parts = name.split(':');
        return parts[parts.length - 1].trim();
    }
    return name;
}

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Format ISO date string to UTC display format
 * Example: "2026-01-30 00:45 UTC"
 */
function formatDateTimeUTC(isoStr: string): string {
    const date = new Date(isoStr);
    return date.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

// ============================================================================
// UI Components
// ============================================================================

// Skeleton Loader Component
function SkeletonCard({ className = "" }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-2xl ${className}`}>
            <div className="p-4">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            </div>
        </div>
    );
}

// Animated Number Component with pulse on change
function AnimatedNumber({ value, className = "", pulseClass = "" }: { value: number | string; className?: string; pulseClass?: string }) {
    const [isPulsing, setIsPulsing] = useState(false);
    const prevValue = useRef(value);

    useEffect(() => {
        if (prevValue.current !== value) {
            setIsPulsing(true);
            const timer = setTimeout(() => setIsPulsing(false), 1000);
            prevValue.current = value;
            return () => clearTimeout(timer);
        }
    }, [value]);

    return (
        <span className={`transition-all duration-300 ${isPulsing ? `scale-110 ${pulseClass || 'text-green-500'}` : ''} ${className}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
    );
}

// Toast Notification Component
function ToastNotification({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm animate-slide-in
                        ${toast.type === 'success' ? 'bg-green-500/90 text-white' : ''}
                        ${toast.type === 'info' ? 'bg-blue-500/90 text-white' : ''}
                        ${toast.type === 'warning' ? 'bg-amber-500/90 text-white' : ''}
                    `}
                    onClick={() => onDismiss(toast.id)}
                >
                    <span className="text-xl">{toast.icon}</span>
                    <span className="font-medium">{toast.message}</span>
                </div>
            ))}
        </div>
    );
}

// Modern Stat Card with Gradient
function StatCard({
    title,
    value,
    icon,
    gradient = "from-blue-500 to-blue-600",
    trend,
    subtitle
}: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    gradient?: string;
    trend?: { value: number; label: string };
    subtitle?: string;
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white"></div>
                <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white"></div>
            </div>

            <div className="relative">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl text-white/90">{icon}</span>
                    {trend && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${trend.value >= 0 ? 'bg-white/20 text-white' : 'bg-red-500/30 text-red-100'}`}>
                            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)} {trend.label}
                        </span>
                    )}
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                    <AnimatedNumber value={value} pulseClass="text-yellow-300" />
                </div>
                <div className="text-white/80 text-sm font-medium">{title}</div>
                {subtitle && <div className="text-white/60 text-xs mt-1">{subtitle}</div>}
            </div>
        </div>
    );
}

// Live Badge Component
function LiveBadge({ connected }: { connected: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all ${connected
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
            {connected ? 'Live' : 'Connecting...'}
        </span>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [boostStats, setBoostStats] = useState<BoostStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Games with pagination
    const [games, setGames] = useState<GameRecord[]>([]);
    const [gamesLoading, setGamesLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
    const [filteredStats, setFilteredStats] = useState({ total: 0, wins: 0, losses: 0, avgMoves: 0 });

    // Filter states
    const [filterDate, setFilterDate] = useState<string>("");
    const [filterUser, setFilterUser] = useState<string>("");
    const [filterPartner, setFilterPartner] = useState<string>("all");
    const [filterResult, setFilterResult] = useState<string>("all");

    // Referral data
    const [referrals, setReferrals] = useState<ReferralData[]>([]);
    const [referralPage, setReferralPage] = useState(1);
    const REFERRALS_PER_PAGE = 10;

    // Boost purchases data
    const [boostPurchases, setBoostPurchases] = useState<BoostPurchase[]>([]);
    const [boostPurchasesLoading, setBoostPurchasesLoading] = useState(false);

    // Attempt purchases data (paginated)
    const [attemptPurchases, setAttemptPurchases] = useState<AttemptPurchase[]>([]);
    const [attemptPurchasesLoading, setAttemptPurchasesLoading] = useState(false);
    const [attemptPagination, setAttemptPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

    // Task Stats data
    const [taskStats, setTaskStats] = useState<TaskStatsData | null>(null);
    const [taskStatsLoading, setTaskStatsLoading] = useState(false);

    // Real-time updates
    const { connected, admin: realtimeAdmin, boost: realtimeBoost, taskUpdate: realtimeTaskUpdate } = useRealtimeData({
        rooms: ['admin', 'boost', 'tasks'],
    });

    // Get shared context data for synchronized core stats
    const { globalStats: sharedGlobalStats, todayStats: sharedTodayStats } = usePuzzleData();

    // Sync local stats with shared context if available (keeps them in sync across pages)
    useEffect(() => {
        if (sharedGlobalStats && stats) {
            setStats(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    global: {
                        ...prev.global,
                        totalUsers: sharedGlobalStats.totalUsers,
                        totalPlays: sharedGlobalStats.totalPlays,
                        totalWins: sharedGlobalStats.totalWins,
                        totalLosses: sharedGlobalStats.totalLosses,
                        totalBoughtAttempts: sharedGlobalStats.totalBoughtAttempts,
                    },
                    today: sharedTodayStats ? {
                        plays: sharedTodayStats.plays,
                        wins: sharedTodayStats.wins,
                        losses: sharedTodayStats.losses,
                    } : prev.today,
                };
            });
        }
    }, [sharedGlobalStats, sharedTodayStats]); // eslint-disable-line react-hooks/exhaustive-deps

    // Toast helper
    const addToast = useCallback((message: string, type: Toast['type'], icon: string) => {
        const id = `toast_${Date.now()}`;
        setToasts(prev => [...prev, { id, message, type, icon }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // ========================================================================
    // Real-time Event Handlers
    // ========================================================================

    useEffect(() => {
        if (!realtimeAdmin) return;

        const { type, delta, game, player, boost } = realtimeAdmin as {
            type: string;
            delta?: Record<string, number>;
            game?: GameRecord;
            player?: { odId: string; displayName: string; winsAllTime: number };
            boost?: { partnerName: string; amount: number; status: string };
        };

        console.log('[Admin] Real-time event:', type, realtimeAdmin);

        // Update stats based on event type
        if (delta) {
            setStats(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    global: {
                        ...prev.global,
                        totalPlays: prev.global.totalPlays + (delta.totalPlays || 0),
                        totalWins: prev.global.totalWins + (delta.totalWins || 0),
                        totalLosses: prev.global.totalLosses + (delta.totalLosses || 0),
                        totalBoughtAttempts: prev.global.totalBoughtAttempts + (delta.totalBoughtAttempts || 0),
                    },
                    today: {
                        ...prev.today,
                        plays: prev.today.plays + (delta.todayPlays || 0),
                        wins: prev.today.wins + (delta.todayWins || 0),
                        losses: prev.today.losses + (delta.todayLosses || 0),
                    },
                };
            });
        }

        switch (type) {
            case 'GAME_WIN':
                if (game) {
                    // Parse display name to clean format
                    const cleanDisplayName = parseDisplayName(player?.displayName);

                    // Add player info to game record
                    const enrichedGame = {
                        ...game,
                        displayName: cleanDisplayName,
                        isNew: true
                    };
                    setGames(prev => [enrichedGame, ...prev.slice(0, 99)]);
                    addToast(`New Win! 🎉 ${cleanDisplayName || 'Player'} won on ${game.partnerName || 'Unknown'}`, 'success', '🏆');

                    // Update Last 7 Days (today's entry)
                    setStats(prev => {
                        if (!prev) return prev;
                        const today = getTodayDate();
                        const newLast7Days = [...prev.last7Days];
                        const todayIdx = newLast7Days.findIndex(d => d.date === today);
                        if (todayIdx >= 0) {
                            newLast7Days[todayIdx] = {
                                ...newLast7Days[todayIdx],
                                plays: newLast7Days[todayIdx].plays + 1,
                                wins: newLast7Days[todayIdx].wins + 1,
                            };
                        }
                        return { ...prev, last7Days: newLast7Days };
                    });

                    // Update partner stats (increment wins and gamesPlayed)
                    if (game.partnerName) {
                        setStats(prev => {
                            if (!prev) return prev;
                            const partnerIdx = prev.partnerStats.findIndex(p =>
                                p.partnerName.toLowerCase() === game.partnerName?.toLowerCase()
                            );
                            let newPartnerStats = [...prev.partnerStats];
                            if (partnerIdx >= 0) {
                                newPartnerStats[partnerIdx] = {
                                    ...newPartnerStats[partnerIdx],
                                    gamesPlayed: newPartnerStats[partnerIdx].gamesPlayed + 1,
                                    wins: newPartnerStats[partnerIdx].wins + 1,
                                };
                            } else {
                                // New partner, add to stats
                                newPartnerStats.push({
                                    partnerName: game.partnerName!,
                                    gamesPlayed: 1,
                                    wins: 1,
                                    losses: 0,
                                });
                            }
                            return { ...prev, partnerStats: newPartnerStats };
                        });
                    }

                    // Update top players if needed
                    if (player) {
                        setStats(prev => {
                            if (!prev) return prev;
                            const existingIdx = prev.topPlayers.findIndex(p => p.userId === player.odId);
                            let newPlayers = [...prev.topPlayers];
                            if (existingIdx >= 0) {
                                newPlayers[existingIdx] = {
                                    ...newPlayers[existingIdx],
                                    winsAllTime: player.winsAllTime,
                                };
                            }
                            // Re-sort by wins
                            newPlayers.sort((a, b) => b.winsAllTime - a.winsAllTime);
                            return { ...prev, topPlayers: newPlayers.slice(0, 10) };
                        });
                    }
                }
                break;

            case 'GAME_LOSS':
                if (game) {
                    setGames(prev => [{ ...game, isNew: true }, ...prev.slice(0, 99)]);
                    addToast(`Game Lost 💔 ${parseDisplayName(game.displayName) || 'Player'} on ${game.partnerName || 'Unknown'}`, 'info', '⏱️');

                    // Update Last 7 Days (today's entry)
                    setStats(prev => {
                        if (!prev) return prev;
                        const today = getTodayDate();
                        const newLast7Days = [...prev.last7Days];
                        const todayIdx = newLast7Days.findIndex(d => d.date === today);
                        if (todayIdx >= 0) {
                            newLast7Days[todayIdx] = {
                                ...newLast7Days[todayIdx],
                                plays: newLast7Days[todayIdx].plays + 1,
                                losses: newLast7Days[todayIdx].losses + 1,
                            };
                        }
                        return { ...prev, last7Days: newLast7Days };
                    });

                    // Update partner stats (increment losses and gamesPlayed)
                    if (game.partnerName) {
                        setStats(prev => {
                            if (!prev) return prev;
                            const partnerIdx = prev.partnerStats.findIndex(p =>
                                p.partnerName.toLowerCase() === game.partnerName?.toLowerCase()
                            );
                            let newPartnerStats = [...prev.partnerStats];
                            if (partnerIdx >= 0) {
                                newPartnerStats[partnerIdx] = {
                                    ...newPartnerStats[partnerIdx],
                                    gamesPlayed: newPartnerStats[partnerIdx].gamesPlayed + 1,
                                    losses: newPartnerStats[partnerIdx].losses + 1,
                                };
                            } else {
                                // New partner, add to stats
                                newPartnerStats.push({
                                    partnerName: game.partnerName!,
                                    gamesPlayed: 1,
                                    wins: 0,
                                    losses: 1,
                                });
                            }
                            return { ...prev, partnerStats: newPartnerStats };
                        });
                    }
                }
                break;

            case 'ATTEMPT_PURCHASED':
                addToast('Attempts Purchased 💰', 'info', '🎮');
                // Stats delta already handled above via delta property
                // Refetch attempt purchases table
                fetchAttemptPurchases(attemptPagination.page);
                break;

            case 'BOOST_PURCHASED':
                // Always refetch boost stats on purchase
                console.log('[Admin] BOOST_PURCHASED event received:', boost);
                addToast(`Boost Purchased! ⚡ ${boost?.partnerName || 'Token'} - $${boost?.amount || ''}`, 'success', '⚡');
                fetch("/api/game/boost/stats", { cache: 'no-store' })
                    .then(res => res.json())
                    .then(data => {
                        console.log('[Admin] Boost stats refetched after BOOST_PURCHASED:', data.success);
                        if (data.success) setBoostStats(data.data);
                    })
                    .catch(err => console.error('[Admin] Fetch error after BOOST_PURCHASED:', err));
                // Also refetch boost purchases table
                fetch("/api/game/boost/purchases", { cache: 'no-store' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) setBoostPurchases(data.data);
                    })
                    .catch(err => console.error('[Admin] Boost purchases fetch error after BOOST_PURCHASED:', err));
                break;

            case 'BOOST_ACTIVATED':
                // A new boost became active (e.g., previous was skipped)
                console.log('[Admin] BOOST_ACTIVATED event received:', boost);
                addToast(`New Boost Active! ⚡ ${boost?.partnerName || 'Token'}`, 'info', '🔄');
                fetch("/api/game/boost/stats", { cache: 'no-store' })
                    .then(res => res.json())
                    .then(data => {
                        console.log('[Admin] Boost stats refetched after BOOST_ACTIVATED:', data.success);
                        if (data.success) setBoostStats(data.data);
                    })
                    .catch(err => console.error('[Admin] Fetch error after BOOST_ACTIVATED:', err));
                break;
        }
    }, [realtimeAdmin, addToast]);

    // Handle task room updates (real-time task stats)
    useEffect(() => {
        if (!realtimeTaskUpdate) return;

        const { type, taskId, completionsCount, completedByUserId, task: newTask } = realtimeTaskUpdate;
        console.log('[Admin] Task update:', type, realtimeTaskUpdate);

        setTaskStats(prev => {
            if (!prev) return prev;

            switch (type) {
                case 'TASK_COMPLETED': {
                    addToast(`Task Completed! ✅ by ${completedByUserId?.slice(0, 12) || 'user'}`, 'success', '📋');
                    return {
                        ...prev,
                        summary: {
                            ...prev.summary,
                            totalCompletions: prev.summary.totalCompletions + 1,
                            todayCompletions: prev.summary.todayCompletions + 1,
                        },
                        activeTasks: prev.activeTasks.map(t =>
                            t.id === taskId
                                ? { ...t, completionsCount: completionsCount ?? t.completionsCount + 1 }
                                : t
                        ),
                        recentCompletions: [
                            {
                                taskId: taskId,
                                userId: completedByUserId || '',
                                completedAt: new Date().toISOString(),
                                completerName: null,
                                completerPhoto: null,
                                targetLink: prev.activeTasks.find(t => t.id === taskId)?.targetLink || '',
                                platform: prev.activeTasks.find(t => t.id === taskId)?.platform || '',
                                taskLabel: prev.activeTasks.find(t => t.id === taskId)?.label || 'Task',
                            },
                            ...prev.recentCompletions.slice(0, 19),
                        ],
                    };
                }
                case 'TASK_CREATED': {
                    addToast(`New Task Created! 📋 ${newTask?.label || 'Task'}`, 'info', '➕');
                    const createdTask = newTask ? {
                        id: newTask.id,
                        platform: newTask.platform,
                        taskType: newTask.taskType,
                        label: newTask.label,
                        actionsBundled: newTask.actionsBundled,
                        targetLink: newTask.targetLink,
                        price: newTask.price,
                        maxCompletions: newTask.maxCompletions,
                        completionsCount: newTask.completionsCount || 0,
                        durationHours: newTask.durationHours,
                        expiresAt: newTask.expiresAt,
                        createdAt: newTask.createdAt,
                        promoterName: newTask.promoterName,
                        promoterPhoto: newTask.promoterPhoto,
                    } : null;
                    return {
                        ...prev,
                        summary: {
                            ...prev.summary,
                            totalTasks: prev.summary.totalTasks + 1,
                            activeTasks: prev.summary.activeTasks + 1,
                        },
                        activeTasks: createdTask
                            ? [createdTask, ...prev.activeTasks]
                            : prev.activeTasks,
                    };
                }
                case 'TASK_EXPIRED': {
                    return {
                        ...prev,
                        summary: {
                            ...prev.summary,
                            activeTasks: Math.max(0, prev.summary.activeTasks - 1),
                        },
                        activeTasks: prev.activeTasks.filter(t => t.id !== taskId),
                    };
                }
                case 'TASK_RENEWED': {
                    return {
                        ...prev,
                        activeTasks: prev.activeTasks.map(t =>
                            t.id === taskId
                                ? {
                                    ...t,
                                    maxCompletions: realtimeTaskUpdate.maxCompletions ?? t.maxCompletions,
                                    expiresAt: realtimeTaskUpdate.expiresAt ?? t.expiresAt,
                                }
                                : t
                        ),
                    };
                }
                default:
                    return prev;
            }
        });
    }, [realtimeTaskUpdate, addToast]);

    // Handle boost room updates (for active boost changes)
    useEffect(() => {
        if (realtimeBoost) {
            console.log('[Admin] Boost update received:', JSON.stringify(realtimeBoost));
            // Refetch boost stats when boost changes
            fetch("/api/game/boost/stats", { cache: 'no-store' })
                .then(res => res.json())
                .then(data => {
                    console.log('[Admin] Boost stats refetched:', data.success);
                    if (data.success) setBoostStats(data.data);
                })
                .catch(err => console.error('[Admin] Boost stats fetch error:', err));
        }
    }, [realtimeBoost]);

    // ========================================================================
    // Data Fetching
    // ========================================================================

    const fetchGames = useCallback(async (page = 1) => {
        setGamesLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', '50');
            if (filterDate) params.set('date', filterDate);
            if (filterUser) params.set('userId', filterUser);
            if (filterPartner !== 'all') params.set('partner', filterPartner);
            if (filterResult !== 'all') params.set('result', filterResult);

            const res = await fetch(`/api/game/admin/games?${params.toString()}`, { cache: 'no-store' });
            const data = await res.json();

            if (data.success) {
                setGames(data.data.games);
                setPagination(data.data.pagination);
                setFilteredStats(data.data.stats);
            }
        } catch (err) {
            console.error('Failed to fetch games:', err);
        } finally {
            setGamesLoading(false);
        }
    }, [filterDate, filterUser, filterPartner, filterResult]);

    useEffect(() => {
        const fetchStats = async (retries = 3) => {
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    setLoading(true);
                    const [statsRes, boostRes] = await Promise.all([
                        fetch("/api/game/admin/stats", { cache: 'no-store' }),
                        fetch("/api/game/boost/stats", { cache: 'no-store' })
                    ]);

                    const statsData = await statsRes.json();
                    const boostData = await boostRes.json();

                    if (statsData.success) {
                        setStats(statsData.data);
                        setError(null);
                    } else if (attempt === retries) {
                        setError(statsData.error || "Failed to load stats");
                    } else {
                        // Retry on failure
                        console.warn(`[Admin] Stats fetch attempt ${attempt} failed, retrying...`);
                        await new Promise(r => setTimeout(r, 1000 * attempt));
                        continue;
                    }

                    if (boostData.success) {
                        setBoostStats(boostData.data);
                    }

                    // Success — stop retrying
                    break;
                } catch (err) {
                    console.error(`[Admin] Fetch attempt ${attempt} error:`, err);
                    if (attempt === retries) {
                        setError("Failed to fetch admin stats");
                    } else {
                        await new Promise(r => setTimeout(r, 1000 * attempt));
                    }
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchStats();
    }, []);


    // Fetch boost purchases
    useEffect(() => {
        const fetchBoostPurchases = async () => {
            setBoostPurchasesLoading(true);
            try {
                const res = await fetch("/api/game/boost/purchases", { cache: 'no-store' });
                const data = await res.json();
                if (data.success) {
                    setBoostPurchases(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch boost purchases:", err);
            } finally {
                setBoostPurchasesLoading(false);
            }
        };
        fetchBoostPurchases();
    }, []);

    // Fetch attempt purchases (paginated)
    const fetchAttemptPurchases = useCallback(async (page: number = 1) => {
        setAttemptPurchasesLoading(true);
        try {
            const res = await fetch(`/api/game/admin/purchases?page=${page}&limit=10`, { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setAttemptPurchases(data.data);
                if (data.pagination) {
                    setAttemptPagination(data.pagination);
                }
            }
        } catch (err) {
            console.error('Failed to fetch attempt purchases:', err);
        } finally {
            setAttemptPurchasesLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAttemptPurchases(1);
    }, [fetchAttemptPurchases]);

    useEffect(() => {
        fetchGames(1);
    }, [fetchGames]);

    // Fetch task stats
    const fetchTaskStats = useCallback(async () => {
        setTaskStatsLoading(true);
        try {
            const res = await fetch('/api/game/admin/task-stats', { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setTaskStats(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch task stats:', err);
        } finally {
            setTaskStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTaskStats();
    }, [fetchTaskStats]);

    // Fetch referrals
    const fetchReferrals = useCallback(async () => {
        try {
            const res = await fetch('/api/game/stats/referrals', { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setReferrals(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch referrals:', err);
        }
    }, []);

    useEffect(() => {
        fetchReferrals();
        // Refresh every 30 seconds for real-time feel
        const interval = setInterval(fetchReferrals, 30000);
        return () => clearInterval(interval);
    }, [fetchReferrals]);

    // ========================================================================
    // Helpers
    // ========================================================================

    const uniquePartners = useMemo(() => {
        if (!stats) return [];
        return stats.partnerStats.map(p => p.partnerName);
    }, [stats]);

    const formatTime = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const formatDate = (dateStr: string): string => {
        // Format as UTC date (YYYY-MM-DD format)
        const date = new Date(dateStr);
        const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
        const day = date.getUTCDate();
        return `${month} ${day}`;
    };

    const clearFilters = () => {
        setFilterDate("");
        setFilterUser("");
        setFilterPartner("all");
        setFilterResult("all");
    };

    const hasFilters = filterDate || filterUser || filterPartner !== "all" || filterResult !== "all";

    const goToPage = (page: number) => {
        if (page >= 1 && page <= pagination.totalPages) {
            fetchGames(page);
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <div className="h-10 w-64 bg-gray-700 rounded-lg animate-pulse mb-2"></div>
                        <div className="h-4 w-48 bg-gray-700 rounded animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                        {[...Array(7)].map((_, i) => (
                            <SkeletonCard key={i} className="h-28" />
                        ))}
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <SkeletonCard className="h-64" />
                        <SkeletonCard className="h-64" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <div className="text-red-400 text-xl font-semibold">{error}</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    // Use shared context values when available for perfect synchronization with other pages
    // Fall back to local stats if shared context hasn't loaded yet
    const displayGlobal = {
        totalUsers: sharedGlobalStats?.totalUsers ?? stats.global.totalUsers,
        totalPlays: sharedGlobalStats?.totalPlays ?? stats.global.totalPlays,
        totalWins: sharedGlobalStats?.totalWins ?? stats.global.totalWins,
        totalLosses: sharedGlobalStats?.totalLosses ?? stats.global.totalLosses,
        totalBoughtAttempts: sharedGlobalStats?.totalBoughtAttempts ?? stats.global.totalBoughtAttempts,
        avgMoves: stats.global.avgMoves, // Admin-specific, not shared
        avgTimeMs: stats.global.avgTimeMs, // Admin-specific, not shared
    };

    const displayToday = {
        plays: sharedTodayStats?.plays ?? stats.today.plays,
        wins: sharedTodayStats?.wins ?? stats.today.wins,
        losses: sharedTodayStats?.losses ?? stats.today.losses,
    };

    const winRate = displayGlobal.totalPlays > 0
        ? ((displayGlobal.totalWins / displayGlobal.totalPlays) * 100).toFixed(1)
        : "0";

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6">
            <ToastNotification toasts={toasts} onDismiss={dismissToast} />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <Gamepad2 size={32} className="text-blue-500" /> Admin Dashboard
                            <LiveBadge connected={connected} />
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">Real-time game statistics and analytics</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">All times and statistics are calculated in UTC timezone</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-white text-sm transition-colors flex items-center gap-2"
                        >
                            <RefreshCw size={16} /> Refresh
                        </button>
                    </div>
                </div>

                {/* Global Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                    <StatCard
                        title="Total Users"
                        value={displayGlobal.totalUsers}
                        icon={<Users size={24} />}
                        gradient="from-violet-500 to-purple-600"
                    />
                    <StatCard
                        title="Total Plays"
                        value={displayGlobal.totalPlays}
                        icon={<Gamepad2 size={24} />}
                        gradient="from-blue-500 to-cyan-600"
                    />
                    <StatCard
                        title="Total Wins"
                        value={displayGlobal.totalWins}
                        icon={<Trophy size={24} />}
                        gradient="from-green-500 to-emerald-600"
                    />
                    <StatCard
                        title="Total Losses"
                        value={displayGlobal.totalLosses}
                        icon={<HeartCrack size={24} />}
                        gradient="from-red-500 to-rose-600"
                    />
                    <StatCard
                        title="Bought Attempts"
                        value={displayGlobal.totalBoughtAttempts}
                        icon={<Coins size={24} />}
                        gradient="from-amber-500 to-orange-600"
                    />
                    <StatCard
                        title="Win Rate"
                        value={`${winRate}%`}
                        icon={<Percent size={24} />}
                        gradient="from-indigo-500 to-blue-600"
                    />
                    <StatCard
                        title="Avg Moves"
                        value={displayGlobal.avgMoves}
                        icon={<ArrowUpDown size={24} />}
                        gradient="from-pink-500 to-rose-600"
                    />
                </div>

                {/* Today's Stats */}
                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700/50">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CalendarDays size={20} className="text-blue-500" /> Today&apos;s Stats ({getTodayDate()} UTC)
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <div className="text-3xl font-bold text-blue-400">
                                <AnimatedNumber value={displayToday.plays} />
                            </div>
                            <div className="text-gray-400 text-sm mt-1">Plays</div>
                        </div>
                        <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                            <div className="text-3xl font-bold text-green-400">
                                <AnimatedNumber value={displayToday.wins} />
                            </div>
                            <div className="text-gray-400 text-sm mt-1">Wins</div>
                        </div>
                        <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                            <div className="text-3xl font-bold text-red-400">
                                <AnimatedNumber value={displayToday.losses} />
                            </div>
                            <div className="text-gray-400 text-sm mt-1">Losses</div>
                        </div>
                    </div>
                </div>

                {/* Last 7 Days Chart */}
                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700/50">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-blue-500" /> Last 7 Days</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                    <th className="py-3 text-left">Date</th>
                                    <th className="py-3 text-right">Plays</th>
                                    <th className="py-3 text-right">Wins</th>
                                    <th className="py-3 text-right">Losses</th>
                                    <th className="py-3 text-right">Win Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.last7Days.map((day) => (
                                    <tr
                                        key={day.date}
                                        className="border-b border-gray-200 dark:border-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors"
                                        onClick={() => setFilterDate(day.date)}
                                    >
                                        <td className="py-3 text-gray-800 dark:text-white font-medium">{formatDate(day.date)}</td>
                                        <td className="py-3 text-right text-blue-600 dark:text-blue-400">{day.plays}</td>
                                        <td className="py-3 text-right text-green-600 dark:text-green-400">{day.wins}</td>
                                        <td className="py-3 text-right text-red-600 dark:text-red-400">{day.losses}</td>
                                        <td className="py-3 text-right text-gray-600 dark:text-gray-300">
                                            {day.plays > 0 ? ((day.wins / day.plays) * 100).toFixed(0) : 0}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Top Players */}
                    <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Trophy size={20} className="text-yellow-500" /> Top Players
                        </h2>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {stats.topPlayers.map((player, idx) => (
                                <div
                                    key={player.userId}
                                    className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700/30 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                                    onClick={() => setFilterUser(player.userId)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xl font-bold ${idx === 0 ? 'text-yellow-500 dark:text-yellow-400' :
                                            idx === 1 ? 'text-gray-400 dark:text-gray-300' :
                                                idx === 2 ? 'text-amber-700 dark:text-amber-600' : 'text-gray-500'
                                            }`}>
                                            #{idx + 1}
                                        </span>
                                        <div>
                                            <div className="font-medium text-gray-800 dark:text-white">
                                                {player.displayName || player.userId.slice(0, 15) + '...'}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{player.totalPlays} plays</div>
                                        </div>
                                    </div>
                                    <div className="text-green-600 dark:text-green-400 font-bold">
                                        <AnimatedNumber value={player.winsAllTime} /> wins
                                    </div>
                                </div>
                            ))}
                            {stats.topPlayers.length === 0 && (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    No players yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Partner Stats */}
                    <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Handshake size={20} className="text-blue-500" /> Partner Stats
                        </h2>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {stats.partnerStats.map((partner) => (
                                <div
                                    key={partner.partnerName}
                                    className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700/30 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                                    onClick={() => setFilterPartner(partner.partnerName)}
                                >
                                    <div>
                                        <div className="font-medium text-gray-800 dark:text-white">{partner.partnerName}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{partner.gamesPlayed} games</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-green-600 dark:text-green-400 text-sm font-medium">{partner.wins}W</span>
                                        <span className="text-red-600 dark:text-red-400 text-sm font-medium">{partner.losses}L</span>
                                    </div>
                                </div>
                            ))}
                            {stats.partnerStats.length === 0 && (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    No partner data yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Referral Stats Section */}
                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Link2 size={20} className="text-blue-500" /> Referral Stats
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                ({referrals.length} referrers)
                            </span>
                        </h2>
                        <button
                            onClick={fetchReferrals}
                            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>

                    {referrals.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                            <th className="py-3 text-left">#</th>
                                            <th className="py-3 text-left">Referrer</th>
                                            <th className="py-3 text-right">Referrals</th>
                                            <th className="py-3 text-right">Earnings</th>
                                            <th className="py-3 text-right">Pending</th>
                                            <th className="py-3 text-right">Last Referral</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {referrals
                                            .slice((referralPage - 1) * REFERRALS_PER_PAGE, referralPage * REFERRALS_PER_PAGE)
                                            .map((ref, idx) => (
                                                <tr
                                                    key={ref.referrerId}
                                                    className="border-b border-gray-200 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors"
                                                >
                                                    <td className="py-3 text-gray-500">
                                                        {(referralPage - 1) * REFERRALS_PER_PAGE + idx + 1}
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="font-medium text-gray-800 dark:text-white">
                                                            {parseDisplayName(ref.displayName) || ref.referrerId.slice(0, 12) + '...'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 truncate max-w-[150px]">
                                                            {ref.referrerId.slice(0, 20)}...
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                                            {ref.totalReferrals}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <span className="text-green-600 dark:text-green-400 font-medium">
                                                            {ref.totalEarnings.toLocaleString()} $SCAN
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <span className={`font-medium ${ref.pendingEarnings > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
                                                            {ref.pendingEarnings.toLocaleString()} $SCAN
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-right text-gray-500 text-xs">
                                                        {ref.lastReferralAt ? formatDateTimeUTC(ref.lastReferralAt) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {referrals.length > REFERRALS_PER_PAGE && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="text-sm text-gray-500">
                                        Showing {(referralPage - 1) * REFERRALS_PER_PAGE + 1}-{Math.min(referralPage * REFERRALS_PER_PAGE, referrals.length)} of {referrals.length}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setReferralPage(p => Math.max(1, p - 1))}
                                            disabled={referralPage === 1}
                                            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            ← Prev
                                        </button>
                                        <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300">
                                            Page {referralPage} of {Math.ceil(referrals.length / REFERRALS_PER_PAGE)}
                                        </span>
                                        <button
                                            onClick={() => setReferralPage(p => Math.min(Math.ceil(referrals.length / REFERRALS_PER_PAGE), p + 1))}
                                            disabled={referralPage >= Math.ceil(referrals.length / REFERRALS_PER_PAGE)}
                                            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            No referral data yet
                        </div>
                    )}
                </div>

                {/* Boost Stats Section */}
                {boostStats && (
                    <>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Zap size={22} className="text-yellow-500" /> Boost Statistics
                            </h2>
                        </div>

                        {/* Boost Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                            <StatCard
                                title="Total Boosts"
                                value={boostStats.summary.totalBoosts}
                                icon={<Zap size={24} />}
                                gradient="from-yellow-500 to-amber-600"
                            />
                            <StatCard
                                title="Active"
                                value={boostStats.summary.activeBoosts}
                                icon={<Flame size={24} />}
                                gradient="from-green-500 to-emerald-600"
                            />
                            <StatCard
                                title="Queued"
                                value={boostStats.summary.queuedBoosts}
                                icon={<Clock size={24} />}
                                gradient="from-blue-500 to-cyan-600"
                            />
                            <StatCard
                                title="Completed"
                                value={boostStats.summary.completedBoosts}
                                icon={<CheckCircle2 size={24} />}
                                gradient="from-gray-500 to-gray-600"
                            />
                            <StatCard
                                title="Revenue"
                                value={`$${parseFloat(String(boostStats.summary.totalRevenue)).toFixed(2)}`}
                                icon={<DollarSign size={24} />}
                                gradient="from-green-500 to-emerald-600"
                            />
                            <StatCard
                                title="Total Hours"
                                value={boostStats.summary.totalHours}
                                icon={<Timer size={24} />}
                                gradient="from-purple-500 to-violet-600"
                            />
                        </div>

                        {/* Boost Queue */}
                        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700/50">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><CalendarDays size={20} className="text-blue-500" /> Boost Queue</h3>
                            {boostStats.queue.length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    <div className="mb-2 flex justify-center"><Zap size={40} className="text-gray-400" /></div>
                                    No boosts scheduled
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                                <th className="py-3 text-left">Token</th>
                                                <th className="py-3 text-left">Status</th>
                                                <th className="py-3 text-left">Duration</th>
                                                <th className="py-3 text-left">Starts</th>
                                                <th className="py-3 text-left">Ends</th>
                                                <th className="py-3 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {boostStats.queue.map((boost) => (
                                                <tr key={boost.id} className="border-b border-gray-200 dark:border-gray-700/50">
                                                    <td className="py-3">
                                                        <div className="flex items-center gap-2">
                                                            <img src={boost.partnerLogo} alt="" className="w-6 h-6 rounded-full" />
                                                            <span className="text-gray-800 dark:text-white font-medium">{boost.partnerName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${boost.status === 'active' ? 'bg-green-500/20 text-green-600 dark:text-green-400 animate-pulse' :
                                                            boost.status === 'queued' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                                                'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                                                            }`}>
                                                            {boost.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-gray-600 dark:text-gray-300">{boost.duration}H</td>
                                                    <td className="py-3 text-gray-600 dark:text-gray-300 text-xs">
                                                        {new Date(boost.startsAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="py-3 text-gray-600 dark:text-gray-300 text-xs">
                                                        {new Date(boost.endsAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="py-3 text-right text-green-600 dark:text-green-400 font-bold">${parseFloat(String(boost.amount)).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Boost Purchases Table */}
                        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700/50">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">🛒 Boost Purchases</h3>
                                {boostPurchasesLoading && <div className="animate-spin h-5 w-5 border border-blue-500 border-t-transparent rounded-full" />}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                            <th className="py-3 text-left">Buyer</th>
                                            <th className="py-3 text-left">Token</th>
                                            <th className="py-3 text-right">Amount</th>
                                            <th className="py-3 text-right">Duration</th>
                                            <th className="py-3 text-center">Status</th>
                                            <th className="py-3 text-right">Purchased</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {boostPurchases.map((bp) => (
                                            <tr key={bp.id} className="border-b border-gray-200 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors">
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        {bp.userImage ? (
                                                            <img src={bp.userImage} alt="" className="w-7 h-7 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs">👤</div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-gray-800 dark:text-white text-xs">
                                                                {bp.userName || (bp.userId ? bp.userId.slice(0, 15) + '...' : 'System')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <img src={bp.tokenImage} alt="" className="w-6 h-6 rounded-full" />
                                                        <span className="font-medium text-gray-800 dark:text-white text-sm">{bp.tokenName}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right text-green-600 dark:text-green-400 font-bold">${parseFloat(String(bp.amount)).toFixed(2)}</td>
                                                <td className="py-3 text-right text-gray-600 dark:text-gray-300">{bp.durationHours}h</td>
                                                <td className="py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${bp.status === 'active' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                                                        bp.status === 'queued' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                                            'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                                                        }`}>
                                                        {bp.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right text-gray-500 dark:text-gray-400 text-xs">
                                                    {new Date(bp.purchasedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        ))}
                                        {boostPurchases.length === 0 && !boostPurchasesLoading && (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                                                    No boost purchases yet
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* 🎮 Attempt Purchases Table */}
                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            🎮 Attempt Purchases
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                ({attemptPagination.total} total)
                            </span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchAttemptPurchases(attemptPagination.page)}
                                className="px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
                            >
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="py-3 text-left text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Buyer</th>
                                    <th className="py-3 text-left text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Amount</th>
                                    <th className="py-3 text-right text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attemptPurchasesLoading && attemptPurchases.length === 0 ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={`skel-${i}`} className="border-b border-gray-100 dark:border-gray-700/50">
                                            <td className="py-3"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></td>
                                            <td className="py-3"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></td>
                                            <td className="py-3 text-right"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : attemptPurchases.length > 0 ? (
                                    attemptPurchases.map((ap) => (
                                        <tr key={ap.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={ap.userImage || '/web-app-manifest-192x192.png'}
                                                        alt=""
                                                        className="w-7 h-7 rounded-full object-cover"
                                                    />
                                                    <span className="text-gray-800 dark:text-white text-sm font-medium truncate max-w-[140px]">
                                                        {parseDisplayName(ap.userName)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                                                    {ap.amount} attempt{ap.amount !== 1 ? 's' : ''}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right text-gray-500 dark:text-gray-400 text-xs">
                                                {new Date(ap.purchasedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-gray-500 dark:text-gray-400">
                                            No attempt purchases yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {attemptPagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Page {attemptPagination.page} of {attemptPagination.totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fetchAttemptPurchases(attemptPagination.page - 1)}
                                    disabled={attemptPagination.page <= 1}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    ← Prev
                                </button>
                                <button
                                    onClick={() => fetchAttemptPurchases(attemptPagination.page + 1)}
                                    disabled={attemptPagination.page >= attemptPagination.totalPages}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Task Promotion Stats Section */}
                <div className="mb-6 mt-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ClipboardList size={22} className="text-blue-500" /> Task Promotion Stats
                        </h2>
                        <button
                            onClick={fetchTaskStats}
                            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>
                </div>

                {taskStatsLoading && !taskStats ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        {[...Array(6)].map((_, i) => (
                            <SkeletonCard key={i} className="h-28" />
                        ))}
                    </div>
                ) : taskStats ? (
                    <>
                        {/* Task Summary KPI Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                            <StatCard
                                title="Total Tasks"
                                value={taskStats.summary.totalTasks}
                                icon={<ClipboardList size={24} />}
                                gradient="from-blue-500 to-indigo-600"
                            />
                            <StatCard
                                title="Active Tasks"
                                value={taskStats.summary.activeTasks}
                                icon={<Flame size={24} />}
                                gradient="from-green-500 to-emerald-600"
                            />
                            <StatCard
                                title="Total Completions"
                                value={taskStats.summary.totalCompletions}
                                icon={<CheckCircle2 size={24} />}
                                gradient="from-violet-500 to-purple-600"
                            />
                            <StatCard
                                title="Today's Completions"
                                value={taskStats.summary.todayCompletions}
                                icon={<TrendingUp size={24} />}
                                gradient="from-cyan-500 to-blue-600"
                            />
                            <StatCard
                                title="Task Revenue"
                                value={`$${parseFloat(String(taskStats.summary.totalRevenue)).toFixed(2)}`}
                                icon={<DollarSign size={24} />}
                                gradient="from-amber-500 to-orange-600"
                            />
                            <StatCard
                                title="Avg Fill Rate"
                                value={`${taskStats.summary.avgFillRate}%`}
                                icon={<CircleGauge size={24} />}
                                gradient="from-pink-500 to-rose-600"
                            />
                        </div>

                        {/* Top Promoters & Top Completers */}
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            {/* Top Promoters */}
                            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Megaphone size={20} className="text-blue-500" /> Top Promoters
                                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                        ({taskStats.topPromoters.length})
                                    </span>
                                </h3>
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {taskStats.topPromoters.map((promoter, idx) => (
                                        <div
                                            key={promoter.userId}
                                            className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700/30 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xl font-bold ${
                                                    idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-500'
                                                }`}>
                                                    #{idx + 1}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {promoter.profilePhoto && (
                                                        <img src={promoter.profilePhoto} alt="" className="w-7 h-7 rounded-full object-cover" />
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-gray-800 dark:text-white text-sm">
                                                            {parseDisplayName(promoter.displayName) || promoter.userId.slice(0, 15) + '...'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {promoter.tasksCreated} tasks · ${parseFloat(String(promoter.totalSpent)).toFixed(2)} spent
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-green-600 dark:text-green-400 font-bold text-sm">
                                                    <AnimatedNumber value={promoter.tasksCreated} /> tasks
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {promoter.avgFillRate}% fill
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {taskStats.topPromoters.length === 0 && (
                                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                            No promoters yet
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Top Completers */}
                            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Medal size={20} className="text-yellow-500" /> Top Completers
                                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                        ({taskStats.topCompleters.length})
                                    </span>
                                </h3>
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {taskStats.topCompleters.map((completer, idx) => (
                                        <div
                                            key={completer.userId}
                                            className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700/30 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xl font-bold ${
                                                    idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-500'
                                                }`}>
                                                    #{idx + 1}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {completer.profilePhoto && (
                                                        <img src={completer.profilePhoto} alt="" className="w-7 h-7 rounded-full object-cover" />
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-gray-800 dark:text-white text-sm">
                                                            {parseDisplayName(completer.displayName) || completer.userId.slice(0, 15) + '...'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Last active: {completer.lastActive ? formatDateTimeUTC(completer.lastActive) : 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                                                <AnimatedNumber value={completer.tasksCompleted} /> done
                                            </div>
                                        </div>
                                    ))}
                                    {taskStats.topCompleters.length === 0 && (
                                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                            No completers yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Platform Comparison */}
                        {taskStats.platformComparison.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {taskStats.platformComparison.map((p) => (
                                    <div key={p.platform} className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 dark:border-gray-700/50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xl">{p.platform === 'x' ? <XIcon size={20} color="#000000" /> : <WarpcastIcon size={20} color="#7C3AED" />}</span>
                                            <h4 className="font-bold text-gray-900 dark:text-white">
                                                {p.platform === 'x' ? 'X (Twitter)' : 'Farcaster'}
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    <AnimatedNumber value={p.taskCount} />
                                                </div>
                                                <div className="text-xs text-gray-500">Tasks</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                    <AnimatedNumber value={p.totalCompletions} />
                                                </div>
                                                <div className="text-xs text-gray-500">Completions</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                                    ${parseFloat(String(p.totalRevenue)).toFixed(2)}
                                                </div>
                                                <div className="text-xs text-gray-500">Revenue</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                    {p.avgFillRate}%
                                                </div>
                                                <div className="text-xs text-gray-500">Fill Rate</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Active Tasks Table */}
                        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700/50">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Flame size={20} className="text-orange-500" /> Active Tasks
                                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                    ({taskStats.activeTasks.length})
                                </span>
                            </h3>
                            {taskStats.activeTasks.length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    <div className="mb-2 flex justify-center"><ClipboardList size={40} className="text-gray-400" /></div>
                                    No active tasks
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                                <th className="py-3 text-left">Task</th>
                                                <th className="py-3 text-left">Platform</th>
                                                <th className="py-3 text-left">Promoter</th>
                                                <th className="py-3 text-center">Progress</th>
                                                <th className="py-3 text-right">Price</th>
                                                <th className="py-3 text-right">Time Left</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {taskStats.activeTasks.map((task) => {
                                                const fillPercent = task.maxCompletions > 0
                                                    ? Math.round((task.completionsCount / task.maxCompletions) * 100)
                                                    : 0;
                                                const hoursLeft = Math.max(0, (new Date(task.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60));
                                                const timeLeftStr = hoursLeft >= 1
                                                    ? `${Math.floor(hoursLeft)}h ${Math.floor((hoursLeft % 1) * 60)}m`
                                                    : `${Math.max(1, Math.floor(hoursLeft * 60))}m`;
                                                return (
                                                    <tr key={task.id} className="border-b border-gray-200 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors">
                                                        <td className="py-3">
                                                            <div className="font-medium text-gray-800 dark:text-white text-sm">{task.label}</div>
                                                            <div className="text-xs text-gray-500 truncate max-w-[200px]">{task.targetLink}</div>
                                                        </td>
                                                        <td className="py-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                                task.platform === 'x'
                                                                    ? 'bg-gray-900/10 text-gray-900 dark:bg-gray-200/10 dark:text-gray-200'
                                                                    : 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                                                            }`}>
                                                                <span className="inline-flex items-center gap-1">{task.platform === 'x' ? <XIcon size={12} color="currentColor" /> : <WarpcastIcon size={12} color="currentColor" />} {task.platform === 'x' ? 'X' : 'FC'}</span>
                                                            </span>
                                                        </td>
                                                        <td className="py-3">
                                                            <div className="flex items-center gap-2">
                                                                {task.promoterPhoto && (
                                                                    <img src={task.promoterPhoto} alt="" className="w-5 h-5 rounded-full" />
                                                                )}
                                                                <span className="text-gray-700 dark:text-gray-300 text-sm truncate max-w-[100px]">
                                                                    {parseDisplayName(task.promoterName) || 'Unknown'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                                    <div
                                                                        className={`h-2 rounded-full transition-all ${
                                                                            fillPercent >= 80 ? 'bg-red-500' : fillPercent >= 50 ? 'bg-amber-500' : 'bg-green-500'
                                                                        }`}
                                                                        style={{ width: `${Math.min(100, fillPercent)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-gray-500">
                                                                    {task.completionsCount}/{task.maxCompletions} ({fillPercent}%)
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 text-right text-green-600 dark:text-green-400 font-medium">
                                                            ${parseFloat(String(task.price)).toFixed(2)}
                                                        </td>
                                                        <td className="py-3 text-right">
                                                            <span className={`text-xs font-medium ${
                                                                hoursLeft < 2 ? 'text-red-500' : hoursLeft < 6 ? 'text-amber-500' : 'text-gray-500'
                                                            }`}>
                                                                {timeLeftStr}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Recent Completions Feed */}
                        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700/50">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Activity size={20} className="text-green-500" /> Recent Completions
                                <LiveBadge connected={connected} />
                            </h3>
                            {taskStats.recentCompletions.length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    <div className="mb-2 flex justify-center"><ClipboardList size={40} className="text-gray-400" /></div>
                                    No completions yet
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {taskStats.recentCompletions.map((rc, idx) => (
                                        <div
                                            key={`${rc.taskId}-${rc.userId}-${idx}`}
                                            className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700/30 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
                                                <CircleCheck size={16} className="text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {rc.completerPhoto && (
                                                    <img src={rc.completerPhoto} alt="" className="w-6 h-6 rounded-full object-cover" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-medium text-gray-800 dark:text-white text-sm">
                                                        {parseDisplayName(rc.completerName) || rc.userId.slice(0, 12) + '...'}
                                                    </span>
                                                    <span className="text-gray-500 text-sm"> completed </span>
                                                    <span className="font-medium text-blue-600 dark:text-blue-400 text-sm">
                                                        {rc.taskLabel || 'Task'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                    rc.platform === 'x'
                                                        ? 'bg-gray-900/10 text-gray-700 dark:bg-gray-200/10 dark:text-gray-300'
                                                        : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                                                }`}>
                                                    {rc.platform === 'x' ? <XIcon size={12} color="currentColor" /> : <WarpcastIcon size={12} color="currentColor" />}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {rc.completedAt ? formatDateTimeUTC(rc.completedAt) : 'Just now'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : null}

                {/* Filters Section */}
                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700/50">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-gray-800 dark:text-white font-medium flex items-center gap-1"><Search size={16} /> Filters:</span>

                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />

                        <input
                            type="text"
                            placeholder="Search user..."
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white w-40 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />

                        <select
                            value={filterPartner}
                            onChange={(e) => setFilterPartner(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Partners</option>
                            {uniquePartners.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>

                        <select
                            value={filterResult}
                            onChange={(e) => setFilterResult(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Results</option>
                            <option value="win">Wins Only</option>
                            <option value="loss">Losses Only</option>
                        </select>

                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {hasFilters && (
                        <div className="mt-4 flex gap-4 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                                Showing <strong className="text-blue-600 dark:text-blue-400">{filteredStats.total}</strong> games
                            </span>
                            <span className="text-green-400">{filteredStats.wins} wins</span>
                            <span className="text-red-400">{filteredStats.losses} losses</span>
                            <span className="text-gray-400">Avg {filteredStats.avgMoves} moves</span>
                        </div>
                    )}
                </div>

                {/* Games Table */}
                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Gamepad2 size={20} className="text-blue-500" /> {hasFilters ? "Filtered Games" : "All Games"}
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({pagination.total} total)</span>
                        </h2>
                        {gamesLoading && (
                            <div className="animate-spin h-5 w-5 border border-blue-500 border-t-transparent rounded-full" />
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                    <th className="py-3 text-left">Time</th>
                                    <th className="py-3 text-left">User</th>
                                    <th className="py-3 text-left">Partner</th>
                                    <th className="py-3 text-right">Moves</th>
                                    <th className="py-3 text-right">Time</th>
                                    <th className="py-3 text-right">Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {games.map((game) => (
                                    <tr
                                        key={game.id}
                                        className={`border-b border-gray-200 dark:border-gray-700/50 transition-all ${game.isNew ? 'bg-green-500/10 animate-fade-in' : ''
                                            }`}
                                    >
                                        <td className="py-3 text-gray-600 dark:text-gray-400 text-xs">
                                            {game.isNew && (
                                                <span className="inline-block px-1.5 py-0.5 bg-green-500 text-white text-xs rounded mr-2 animate-pulse">
                                                    NEW
                                                </span>
                                            )}
                                            {formatDateTimeUTC(game.createdAt)}
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                {(game.profilePhoto || game.avatar) && (
                                                    <img src={game.profilePhoto || game.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                                                )}
                                                <span
                                                    className="text-gray-800 dark:text-white cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors truncate max-w-[150px]"
                                                    onClick={() => setFilterUser(game.odId || game.userId || '')}
                                                    title={game.odId || game.userId || ''}
                                                >
                                                    {parseDisplayName(game.displayName) || game.odId || game.userId || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                {game.partnerLogo && (
                                                    <img src={game.partnerLogo} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                                                )}
                                                <span
                                                    className="text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                                                    onClick={() => setFilterPartner(game.partnerName || "Unknown")}
                                                >
                                                    {game.partnerName || "-"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-right text-blue-600 dark:text-blue-400">{game.moves}</td>
                                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">{formatTime(game.timeMs)}</td>
                                        <td className="py-3 text-right">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-bold ${game.result === "win"
                                                    ? "bg-green-500/20 text-green-400"
                                                    : game.result === "loss"
                                                        ? "bg-red-500/20 text-red-400"
                                                        : "bg-yellow-500/20 text-yellow-400"
                                                    }`}
                                            >
                                                {game.result.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {games.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-gray-400">
                                            <div className="mb-2 flex justify-center"><Gamepad2 size={40} className="text-gray-400" /></div>
                                            No games match the current filters
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700">
                            <div className="text-sm text-gray-400">
                                Page {pagination.page} of {pagination.totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => goToPage(1)}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    First
                                </button>
                                <button
                                    onClick={() => goToPage(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={() => goToPage(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                                <button
                                    onClick={() => goToPage(pagination.totalPages)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom CSS for animations */}
            <style jsx>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        background-color: rgba(34, 197, 94, 0.3);
                    }
                    to {
                        opacity: 1;
                        background-color: transparent;
                    }
                }
                .animate-fade-in {
                    animation: fade-in 2s ease-out;
                }
            `}</style>
        </div>
    );
}
