'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Real-time event types
type RealtimeEventType =
    | 'CONNECTED'
    | 'SUBSCRIBED'
    | 'LEADERBOARD_UPDATE'
    | 'STATS_UPDATE'
    | 'BOOST_CHANGE'
    | 'PRIZES_UPDATE'
    | 'ADMIN_UPDATE'
    | 'TASK_UPDATE'
    | 'ERROR';

interface RealtimeEvent {
    type: RealtimeEventType;
    room?: string;
    data?: unknown;
    timestamp: string;
}

type RealtimeRoom = 'leaderboard' | 'boost' | 'prizes' | 'stats' | 'admin' | 'tasks';

interface LeaderboardPlayer {
    userId: string;
    displayName: string | null;
    winsAllTime: number;
    bestMoves: number | null;
    bestTimeMs: number | null;
}

interface BoostData {
    active: {
        partnerName: string;
        partnerLogo: string;
        duration: number;
        endsAt: string;
        prize?: number;
    } | null;
    queue?: unknown[];
}

interface PrizesData {
    balances: Record<string, number>;
}

interface StatsData {
    totalWins: number;
    totalPlays?: number;
    totalUsers?: number;
    tokenWins?: Record<string, number>;
}

interface TaskUpdateData {
    type: 'TASK_COMPLETED' | 'TASK_CREATED' | 'TASK_EXPIRED' | 'TASK_RENEWED';
    taskId: string;
    completionsCount?: number;
    maxCompletions?: number;
    completedByUserId?: string;
    expiresAt?: string;
    task?: {
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
    };
    timestamp: string;
}

interface AdminData {
    type: 'win' | 'loss' | 'buy';
    delta: {
        totalPlays?: number;
        totalWins?: number;
        totalLosses?: number;
        totalBoughtAttempts?: number;
        todayPlays?: number;
        todayWins?: number;
        todayLosses?: number;
        todayBoughtAttempts?: number;
    };
    partnerStats?: Array<{ name: string; wins: number }>;
    tokenWins?: Record<string, number>;
    lastWinBy?: string;
    lastWinToken?: string | null;
    timestamp: string;
}

interface RealtimeData {
    connected: boolean;
    leaderboard: LeaderboardPlayer[];
    boost: BoostData | null;
    prizes: PrizesData | null;
    stats: StatsData | null;
    admin: AdminData | null;
    taskUpdate: TaskUpdateData | null;
}

interface UseRealtimeDataOptions {
    rooms?: RealtimeRoom[];
    workerUrl?: string;
    reconnectDelay?: number;  // ms to wait before reconnecting
    maxReconnectAttempts?: number;
}

const DEFAULT_WORKER_URL = (process.env.NEXT_PUBLIC_GAME_WORKER_URL || 'https://puzzlegame.bitgrass-crypto.workers.dev')
    .replace('https://', 'wss://')
    .replace('http://', 'ws://');

/**
 * Hook for consuming real-time WebSocket updates
 * 
 * @example
 * ```tsx
 * const { connected, boost, leaderboard } = useRealtimeData({
 *   rooms: ['boost', 'leaderboard']
 * });
 * ```
 */
export function useRealtimeData(options: UseRealtimeDataOptions = {}): RealtimeData & {
    reconnect: () => void;
} {
    const {
        rooms = ['leaderboard', 'boost', 'prizes', 'stats'],
        workerUrl = DEFAULT_WORKER_URL,
        reconnectDelay = 3000,
        maxReconnectAttempts = 10,
    } = options;

    const [connected, setConnected] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
    const [boost, setBoost] = useState<BoostData | null>(null);
    const [prizes, setPrizes] = useState<PrizesData | null>(null);
    const [stats, setStats] = useState<StatsData | null>(null);
    const [admin, setAdmin] = useState<AdminData | null>(null);
    const [taskUpdate, setTaskUpdate] = useState<TaskUpdateData | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Use ref to avoid stale closure in WebSocket callbacks
    const handleEventRef = useRef<(event: RealtimeEvent) => void>();

    // Handle incoming events - update the ref on each render
    handleEventRef.current = (event: RealtimeEvent) => {
        switch (event.type) {
            case 'CONNECTED':
                console.log('[Realtime] Connected');
                setConnected(true);
                break;

            case 'SUBSCRIBED':
                console.log('[Realtime] Subscribed to rooms:', (event.data as { rooms: string[] })?.rooms);
                break;

            case 'LEADERBOARD_UPDATE':
                console.log('[Realtime] Leaderboard update:', event.data);
                const player = event.data as LeaderboardPlayer;
                setLeaderboard(prev => {
                    // Update or add player
                    const existing = prev.findIndex(p => p.userId === player.userId);
                    const updated = [...prev];
                    if (existing >= 0) {
                        updated[existing] = { ...updated[existing], ...player };
                    } else {
                        updated.push(player);
                    }
                    // Sort by winsAllTime descending
                    return updated.sort((a, b) => b.winsAllTime - a.winsAllTime).slice(0, 50);
                });
                break;

            case 'STATS_UPDATE':
                console.log('[Realtime] Stats update:', event.data);
                setStats(prev => ({ ...prev, ...(event.data as StatsData) }));
                break;

            case 'BOOST_CHANGE':
                console.log('[Realtime] Boost change:', event.data);
                setBoost(event.data as BoostData);
                break;

            case 'PRIZES_UPDATE':
                console.log('[Realtime] Prizes update:', event.data);
                setPrizes(event.data as PrizesData);
                break;

            case 'ADMIN_UPDATE':
                console.log('[Realtime] Admin update:', event.data);
                setAdmin(event.data as AdminData);
                break;

            case 'TASK_UPDATE':
                console.log('[Realtime] Task update:', event.data);
                setTaskUpdate(event.data as TaskUpdateData);
                break;

            case 'ERROR':
                console.error('[Realtime] Error:', event.data);
                break;
        }
    };

    // Manual reconnect function
    const reconnect = useCallback(() => {
        reconnectAttemptsRef.current = 0;
        // Close existing connection
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        // Trigger reconnect via state
        setConnected(false);
    }, []);

    // Store options in refs to avoid recreating connect callback
    const optionsRef = useRef({ workerUrl, rooms, reconnectDelay, maxReconnectAttempts });
    optionsRef.current = { workerUrl, rooms, reconnectDelay, maxReconnectAttempts };

    // Connect on mount, cleanup on unmount - no dependencies to avoid reconnection loops
    useEffect(() => {
        let isMounted = true;
        let ws: WebSocket | null = null;
        let reconnectTimeout: NodeJS.Timeout | null = null;

        const connect = () => {
            if (!isMounted) return;

            const { workerUrl, rooms, reconnectDelay, maxReconnectAttempts } = optionsRef.current;

            try {
                const wsUrl = workerUrl.replace('https://', 'wss://').replace('http://', 'ws://');
                ws = new WebSocket(`${wsUrl}/ws`);

                ws.onopen = () => {
                    if (!isMounted) return;
                    console.log('[Realtime] WebSocket opened');
                    reconnectAttemptsRef.current = 0;
                    ws?.send(JSON.stringify({ type: 'SUBSCRIBE', rooms }));
                };

                ws.onmessage = (event) => {
                    if (!isMounted) return;
                    try {
                        const data = JSON.parse(event.data);
                        handleEventRef.current?.(data);
                    } catch (error) {
                        console.error('[Realtime] Failed to parse message:', error);
                    }
                };

                ws.onclose = (event) => {
                    console.log('[Realtime] WebSocket closed:', event.code, event.reason);
                    if (!isMounted) return;
                    setConnected(false);
                    wsRef.current = null;

                    // Attempt reconnection
                    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                        reconnectAttemptsRef.current++;
                        const delay = reconnectDelay * Math.min(reconnectAttemptsRef.current, 5);
                        console.log(`[Realtime] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
                        reconnectTimeout = setTimeout(connect, delay);
                        reconnectTimeoutRef.current = reconnectTimeout;
                    }
                };

                ws.onerror = (error) => {
                    console.error('[Realtime] WebSocket error:', error);
                };

                wsRef.current = ws;
            } catch (error) {
                console.error('[Realtime] Failed to create WebSocket:', error);
            }
        };

        connect();

        return () => {
            isMounted = false;
            if (ws) {
                ws.close();
            }
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
    }, []); // Empty deps - connect once on mount

    return {
        connected,
        leaderboard,
        boost,
        prizes,
        stats,
        admin,
        taskUpdate,
        reconnect,
    };
}

export type { RealtimeEvent, RealtimeData, LeaderboardPlayer, BoostData, PrizesData, StatsData, AdminData, TaskUpdateData, RealtimeRoom };
