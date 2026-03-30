"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import { sdk } from '@farcaster/miniapp-sdk';
import { getCachedIsFarcaster } from '../../QrBaseProvidersLayout';
import { usePrivy } from "@privy-io/react-auth";
import { getUserIdFromPrivyUser } from "@/src/app/lib/game";
import PuzzleFooter from "@/src/app/components/puzzle/PuzzleFooter";
import { QrBaseBanner } from "@/src/app/components/puzzle/PuzzleBanner";
import QrBaseNavbar from "@/src/app/components/puzzle/PuzzleNavbar";
import { useRealtimeData } from "@/src/app/lib/realtime/useRealtimeData";
import XIcon from "@/src/app/images/svg/socialMedia/XIcon";
import WarpcastIcon from "@/src/app/images/svg/socialMedia/WarpcastIcon";

// ── Types ──────────────────────────────────────
interface ActiveTask {
    id: string;
    platform: 'x' | 'farcaster';
    taskType: string;
    label: string;
    actionsBundled: string; // comma-separated: "Like,Reply,Repost"
    targetLink: string;
    price: number;
    maxCompletions: number;
    completionsCount: number;
    durationHours: number;
    expiresAt: string;
    createdAt: string;
    promoterName: string | null;
    promoterPhoto: string | null;
    completedByUser: boolean;
}

// ── Task-type icon mapping ───────────────────
const getTaskIcon = (actionsBundled: string): string => {
    const actions = actionsBundled.split(',').map(a => a.trim().toLowerCase());
    if (actions.includes('follow')) return '/images/puzzle/task/follow.svg';
    if (actions.includes('open') || actions.includes('add') || actions.includes('notifications'))
        return '/images/puzzle/task/miniapp.svg';
    // Default: engage icon for Like, Reply, Repost, Comment, Recast
    return '/images/puzzle/task/engage.svg';
};

// ── Component ──────────────────────────────────
export default function TasksPage() {
    const { user } = usePrivy();
    const gameUserId = user ? getUserIdFromPrivyUser(user) : null;

    // State
    const [tasks, setTasks] = useState<ActiveTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [platformFilter, setPlatformFilter] = useState<'all' | 'x' | 'farcaster'>('all');

    // Confirmation modal state
    const [confirmingTask, setConfirmingTask] = useState<ActiveTask | null>(null);
    const [countdown, setCountdown] = useState(7);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Toast state
    const [toast, setToast] = useState<string | null>(null);

    // Verification error state (persistent in-modal notification)
    const [verificationError, setVerificationError] = useState<string | null>(null);

    // ── Real-time WebSocket subscription ─────────
    const { taskUpdate } = useRealtimeData({ rooms: ['tasks'] });

    // ── Fetch active tasks ──────────────────────
    const fetchTasks = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (platformFilter !== 'all') params.set('platform', platformFilter);
            if (gameUserId) params.set('userId', gameUserId);
            const qs = params.toString() ? `?${params.toString()}` : '';
            const res = await fetch(`/api/game/tasks/active${qs}`);
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
                setTasks(json.data);
            }
        } catch (err) {
            console.error('[Tasks] Failed to fetch:', err);
        } finally {
            setIsLoading(false);
        }
    }, [platformFilter, gameUserId]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // ── Handle real-time task updates ────────────
    useEffect(() => {
        if (!taskUpdate) return;

        if (taskUpdate.type === 'TASK_COMPLETED') {
            setTasks(prev => prev.map(task => {
                if (task.id !== taskUpdate.taskId) return task;
                return {
                    ...task,
                    completionsCount: taskUpdate.completionsCount ?? task.completionsCount + 1,
                    completedByUser: task.completedByUser || taskUpdate.completedByUserId === gameUserId,
                };
            }));
        } else if (taskUpdate.type === 'TASK_CREATED' && taskUpdate.task) {
            const newTask = taskUpdate.task;
            setTasks(prev => {
                if (prev.some(t => t.id === newTask.id)) return prev;
                return [{
                    id: newTask.id,
                    platform: newTask.platform as 'x' | 'farcaster',
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
                    completedByUser: false,
                }, ...prev];
            });
        } else if (taskUpdate.type === 'TASK_EXPIRED') {
            setTasks(prev => prev.filter(t => t.id !== taskUpdate.taskId));
        } else if (taskUpdate.type === 'TASK_RENEWED') {
            setTasks(prev => prev.map(task => {
                if (task.id !== taskUpdate.taskId) return task;
                return {
                    ...task,
                    maxCompletions: taskUpdate.maxCompletions ?? task.maxCompletions,
                    expiresAt: taskUpdate.expiresAt ?? task.expiresAt,
                };
            }));
        }
    }, [taskUpdate, gameUserId]);

    // ── Countdown timer for confirmation modal ──
    useEffect(() => {
        if (!confirmingTask) return;

        setCountdown(7);
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [confirmingTask]);

    // ── Show toast ──────────────────────────────
    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 4000);
    };

    // ── Attempt click → open link + show confirm modal ──
    const handleAttemptClick = (task: ActiveTask) => {
        window.open(
            task.targetLink.startsWith('http') ? task.targetLink : `https://${task.targetLink}`,
            '_blank'
        );
        setVerificationError(null);
        setConfirmingTask(task);
    };

    // ── Submit task completion ───────────────────
    const handleConfirm = async () => {
        if (!confirmingTask || !gameUserId || countdown > 0) return;

        setIsSubmitting(true);
        try {
            // ── For miniapp tasks, prompt user to add the mini app first ──
            let miniappAdded = false;
            if (confirmingTask.taskType === 'fc_miniapp_engage') {
                const isMiniApp = getCachedIsFarcaster();
                if (!isMiniApp) {
                    setVerificationError('Please open this task from within Farcaster to add the mini app.');
                    setIsSubmitting(false);
                    return;
                }
                try {
                    await sdk.actions.addMiniApp();
                    miniappAdded = true;
                } catch (addErr: any) {
                    console.warn('[Tasks] addMiniApp rejected:', addErr?.message ?? addErr);
                    setVerificationError('Please add the mini app to complete this task.');
                    setIsSubmitting(false);
                    return;
                }
            }

            const res = await fetch('/api/game/tasks/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: confirmingTask.id,
                    userId: gameUserId,
                    ...(miniappAdded ? { miniappAdded: true } : {}),
                }),
            });
            const data = await res.json();

            if (data.success) {
                showToast('Task Completed! You earned +1 Attempt');
                setVerificationError(null);
                setConfirmingTask(null);
                setTasks(prev => prev.map(t =>
                    t.id === confirmingTask.id
                        ? { ...t, completedByUser: true, completionsCount: t.completionsCount + 1 }
                        : t
                ));
            } else {
                const errorMsg = data.error || 'Failed to complete task';
                setVerificationError(errorMsg);
                showToast(errorMsg);
            }
        } catch (err) {
            console.error('[Tasks] Complete error:', err);
            showToast('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Remaining spots ─────────────────────────
    const getRemainingSpots = (task: ActiveTask) => {
        return task.maxCompletions - task.completionsCount;
    };

    // ── Expiry display ──────────────────────────
    const getExpiryDisplay = (expiresAt: string) => {
        const diff = new Date(expiresAt).getTime() - Date.now();
        if (diff <= 0) return 'Expired';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `Expires in ${days} Day${days > 1 ? 's' : ''}`;
        return `Expires in ${hours}h`;
    };

    return (
        <div className="flex min-h-screen flex-col font-sansMono bg-[#F7F8FD] dark:bg-gray-900 pb-44">
            <QrBaseBanner round="1" isCompleted={false} />
            <QrBaseNavbar />

            <main className="flex-1 pt-28 px-4 max-w-lg mx-auto w-full">
                {/* ── Header ── */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Image
                        src="/images/puzzle/navbar/CheckSquareOffset.svg"
                        alt="Tasks"
                        width={24}
                        height={24}
                        style={{
                            filter: 'brightness(0) saturate(100%) invert(34%) sepia(93%) saturate(3051%) hue-rotate(217deg) brightness(97%) contrast(102%)',
                        }}
                    />
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Task List</h1>
                </div>
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">
                    Complete a task bundle to get +1 Attempt
                </p>

                {/* ── Platform Filter Tabs ── */}
                <div
                    className="flex justify-between mb-6 mx-auto w-full"
                    style={{
                        maxWidth: 358,
                        height: 40,
                        borderRadius: 38,
                        padding: 4,
                        gap: 4,
                        background: '#FFFFFF',
                    }}
                >
                    {(['all', 'x', 'farcaster'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setPlatformFilter(tab)}
                            style={{
                                fontFamily: "'Noto Sans Mono', monospace",
                                fontWeight: 600,
                                fontSize: 12,
                                lineHeight: '20px',
                                letterSpacing: '0%',
                                textAlign: 'center',
                                borderRadius: 32,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                ...(platformFilter === tab
                                    ? {
                                        height: 32,
                                        paddingTop: 6,
                                        paddingRight: 12,
                                        paddingBottom: 6,
                                        paddingLeft: 12,
                                        color: '#0052FF',
                                        background: '#0052FF1A',
                                    }
                                    : {
                                        height: 32,
                                        paddingTop: 6,
                                        paddingRight: 12,
                                        paddingBottom: 6,
                                        paddingLeft: 12,
                                        color: '#6B7280',
                                        background: 'transparent',
                                    }),
                            }}
                        >
                            {tab === 'all' ? 'All Tasks' : tab === 'x' ? (
                                <><XIcon size={12} color={platformFilter === 'x' ? '#0052FF' : '#6B7280'} /> (twitter)</>
                            ) : (
                                <><WarpcastIcon size={14} color={platformFilter === 'farcaster' ? '#0052FF' : '#6B7280'} /> Farcaster</>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Loading / Empty / Task List ── */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4" />
                                        <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg w-1/2" />
                                    </div>
                                    <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">
                            📋
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No Active Tasks
                        </h3>
                        <p className="text-sm text-gray-500 text-center max-w-xs">
                            Check back later for new tasks and challenges!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {[...tasks].sort((a, b) => (a.completedByUser ? 1 : 0) - (b.completedByUser ? 1 : 0)).map(task => {
                            const isCompleted = task.completedByUser;
                            const remaining = getRemainingSpots(task);
                            const expiryText = getExpiryDisplay(task.expiresAt);
                            const taskIcon = getTaskIcon(task.actionsBundled);

                            return (
                                <div
                                    key={task.id}
                                    style={{
                                        background: '#FFFFFF',
                                        borderRadius: 16,
                                        border: isCompleted ? '1px solid #BBF7D0' : '1px solid #F3F4F6',
                                        padding: 10,
                                        opacity: isCompleted ? 0.7 : 1,
                                    }}
                                >
                                    {/* ── Top Row: Icon + Label + Badge + Arrow ── */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {/* Task type icon with platform badge */}
                                        <div
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 10,
                                                backgroundColor: isCompleted ? '#04B5411A' : '#F2F2F7',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                position: 'relative',
                                            }}
                                        >
                                            <Image
                                                src={taskIcon}
                                                alt="task"
                                                width={14}
                                                height={20}
                                            />
                                            {/* Platform badge */}
                                            <Image
                                                src={task.platform === 'x'
                                                    ? '/images/puzzle/task/X Task.svg'
                                                    : '/images/puzzle/task/Farcastr task.svg'}
                                                alt={task.platform === 'x' ? 'X' : 'Farcaster'}
                                                width={14}
                                                height={14}
                                                style={{
                                                    position: 'absolute',
                                                    top: -3,
                                                    right: -3,
                                                    borderRadius: 2,
                                                }}
                                            />
                                        </div>

                                        {/* Label + spots */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p
                                                className="task-card-title"
                                                style={{
                                                    fontFamily: "'Noto Sans Mono', monospace",
                                                    fontWeight: 600,
                                                    fontSize: 10,
                                                    lineHeight: '14px',
                                                    color: '#111827',
                                                    margin: 0,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {task.label}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                                                <Image
                                                    src="/images/puzzle/task/spots.svg"
                                                    alt="spots"
                                                    width={12}
                                                    height={12}
                                                />
                                                <span
                                                    className="task-card-text"
                                                    style={{
                                                        fontFamily: "'Noto Sans Mono', monospace",
                                                        fontWeight: 500,
                                                        fontSize: 10,
                                                        color: '#6B7280',
                                                    }}
                                                >
                                                    {remaining} Spots Left
                                                </span>
                                            </div>
                                        </div>

                                        {/* Attempt badge or completed check */}
                                        {isCompleted ? (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    padding: '3px 8px',
                                                    borderRadius: 20,
                                                    backgroundColor: '#ECFDF5',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Image
                                                    src="/images/puzzle/task/CheckCircle.svg"
                                                    alt="done"
                                                    width={14}
                                                    height={14}
                                                    style={{ filter: 'brightness(0) saturate(100%) invert(55%) sepia(60%) saturate(600%) hue-rotate(100deg) brightness(95%) contrast(90%)' }}
                                                />
                                                <span
                                                    className="task-card-text"
                                                    style={{
                                                        fontFamily: "'Noto Sans Mono', monospace",
                                                        fontWeight: 600,
                                                        fontSize: 10,
                                                        color: '#16A34A',
                                                    }}
                                                >
                                                    Done
                                                </span>
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    padding: '3px 8px',
                                                    borderRadius: 20,
                                                    backgroundColor: '#EFF6FF',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <span
                                                    className="task-card-text"
                                                    style={{
                                                        fontFamily: "'Noto Sans Mono', monospace",
                                                        fontWeight: 700,
                                                        fontSize: 10,
                                                        color: '#0052FF',
                                                    }}
                                                >
                                                    +1
                                                </span>
                                                <Image
                                                    src="/images/puzzle/task/heart.svg"
                                                    alt="heart"
                                                    width={12}
                                                    height={10}
                                                />
                                                <span
                                                    className="task-card-text"
                                                    style={{
                                                        fontFamily: "'Noto Sans Mono', monospace",
                                                        fontWeight: 600,
                                                        fontSize: 10,
                                                        color: '#0052FF',
                                                    }}
                                                >
                                                    Attempt
                                                </span>
                                            </div>
                                        )}

                                        {/* Arrow button */}
                                        {!isCompleted && (
                                            <button
                                                onClick={() => handleAttemptClick(task)}
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: 8,
                                                    backgroundColor: '#0052FF',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    flexShrink: 0,
                                                    transition: 'opacity 0.15s',
                                                }}
                                                onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
                                                onMouseOut={e => (e.currentTarget.style.opacity = '1')}
                                            >
                                                <Image
                                                    src="/images/puzzle/task/ArrowUpRight.svg"
                                                    alt="go"
                                                    width={14}
                                                    height={14}
                                                    style={{ filter: 'brightness(0) invert(1)' }}
                                                />
                                            </button>
                                        )}
                                    </div>

                                    {/* ── Bottom Row: Promoted By + Expiry ── */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginTop: 8,
                                            paddingTop: 8,
                                            borderTop: '1px solid #F3F4F6',
                                        }}
                                    >
                                        {/* Promoter */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span className="promoted-by-label task-card-text"
                                                style={{
                                                    fontFamily: "'Noto Sans Mono', monospace",
                                                    fontWeight: 500,
                                                    fontSize: 10,
                                                    color: '#9CA3AF',
                                                }}
                                            >
                                                <span className="promoted-by-full">Promoted By</span>
                                                <span className="promoted-by-short">By</span>
                                            </span>
                                            {task.promoterPhoto && (
                                                <Image
                                                    src={task.promoterPhoto}
                                                    alt="promoter"
                                                    width={16}
                                                    height={16}
                                                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                                                />
                                            )}
                                            <span
                                                className="task-card-text"
                                                style={{
                                                    fontFamily: "'Noto Sans Mono', monospace",
                                                    fontWeight: 600,
                                                    fontSize: 10,
                                                    color: '#374151',
                                                }}
                                            >
                                                @{task.promoterName || 'Unknown'}
                                            </span>
                                        </div>

                                        {/* Expiry */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Image
                                                src="/images/puzzle/task/expire.svg"
                                                alt="clock"
                                                width={12}
                                                height={12}
                                            />
                                            <span
                                                className="task-card-text"
                                                style={{
                                                    fontFamily: "'Noto Sans Mono', monospace",
                                                    fontWeight: 500,
                                                    fontSize: 10,
                                                    color: '#9CA3AF',
                                                }}
                                            >
                                                {expiryText}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Add Your Task Button ── */}
                <div className="fixed bottom-20 left-0 right-0 px-4 z-30">
                    <div className="max-w-lg mx-auto">
                        <a
                            href="/puzzle/tasks/create"
                            className="block w-full h-[48px] bg-[#0052FF] hover:opacity-90 text-white font-bold rounded-2xl text-center shadow-lg shadow-[#0052FF]/30 transition-all active:scale-[0.98] flex items-center justify-center"
                        >
                            Add Your Task
                        </a>
                    </div>
                </div>
            </main>

            <PuzzleFooter />

            {/* ── Toast Notification ── */}
            {toast && (
                <div className="fixed top-0 left-0 right-0 z-50 flex justify-center animate-slideDown">
                    <div
                        className="flex items-center gap-2 px-4 py-3 mx-4 mt-2 rounded-xl shadow-lg max-w-lg w-full"
                        style={{ backgroundColor: '#3B82F6' }}
                    >
                        <span className="text-lg">💙</span>
                        <span className="text-white font-semibold text-sm">{toast}</span>
                    </div>
                </div>
            )}

            {/* ── Confirm Task Completion Modal ── */}
            {confirmingTask && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div
                        className="relative bg-white dark:bg-gray-800 shadow-2xl mx-4 flex flex-col items-center p-6"
                        style={{
                            width: '100%',
                            maxWidth: 340,
                            borderRadius: 20,
                            fontFamily: "'Noto Sans Mono', monospace",
                        }}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => { setVerificationError(null); setConfirmingTask(null); }}
                            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            ✕
                        </button>

                        {/* Icon */}
                        <div className="w-14 h-14 mb-4 flex items-center justify-center">
                            {isSubmitting ? (
                                <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Image
                                    src="/images/puzzle/boostConfirm.svg"
                                    alt="confirm"
                                    width={56}
                                    height={56}
                                />
                            )}
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Confirm Task Completion
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                            Please confirm that you have completed the task
                        </p>

                        {/* Verification Error Notification */}
                        {verificationError && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 8,
                                    padding: '10px 12px',
                                    borderRadius: 12,
                                    backgroundColor: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    marginBottom: 16,
                                    width: '100%',
                                }}
                            >
                                <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                                <span
                                    style={{
                                        fontFamily: "'Noto Sans Mono', monospace",
                                        fontWeight: 500,
                                        fontSize: 11,
                                        lineHeight: '16px',
                                        color: '#DC2626',
                                    }}
                                >
                                    {verificationError}
                                </span>
                            </div>
                        )}

                        {/* Button */}
                        <button
                            onClick={handleConfirm}
                            disabled={countdown > 0 || isSubmitting}
                            className={`w-full h-[48px] rounded-xl font-bold text-sm transition-all ${countdown > 0
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                : isSubmitting
                                    ? 'bg-[#0052FF] text-white opacity-70 cursor-wait'
                                    : 'bg-[#0052FF] hover:opacity-90 text-white shadow-md'
                                }`}
                        >
                            {countdown > 0
                                ? `Wait ${countdown}s`
                                : isSubmitting
                                    ? 'Checking...'
                                    : '✓ Check'
                            }
                        </button>
                    </div>
                </div>
            )}

            {/* ── Slide-down animation for toast ── */}
            <style jsx>{`
                @keyframes slideDown {
                    from {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
                .promoted-by-full {
                    display: none;
                }
                .promoted-by-short {
                    display: inline;
                }
                @media (min-width: 640px) {
                    .promoted-by-full {
                        display: inline;
                    }
                    .promoted-by-short {
                        display: none;
                    }
                    .task-card-title {
                        font-size: 13px !important;
                        line-height: 18px !important;
                    }
                    .task-card-text {
                        font-size: 11px !important;
                    }
                }
            `}</style>
        </div>
    );
}
