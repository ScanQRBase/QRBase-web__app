'use client';
import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import Image from 'next/image';
import { usePrivy } from '@privy-io/react-auth';
import { getUserIdFromPrivyUser } from '@/src/app/lib/game';
import PuzzleFooter from '@/src/app/components/puzzle/PuzzleFooter';
import { QrBaseBanner } from '@/src/app/components/puzzle/PuzzleBanner';
import QrBaseNavbar from '@/src/app/components/puzzle/PuzzleNavbar';
import {
    useLeaderboard,
    LeaderboardTab,
    SkilledRow,
    WinsRow,
    SpendersRow,
    ReferralRow,
    CurrentUserRank,
} from '../../hooks/useLeaderboard';
import { formatNumber } from '@/src/app/lib/formatNumber';

const TABS: { key: LeaderboardTab; label: string }[] = [
    { key: 'skilled', label: 'Skilled' },
    { key: 'wins', label: 'Wins' },
    { key: 'spenders', label: 'Spenders' },
    { key: 'referral', label: 'Referral' },
];



function UserAvatar({ src, name }: { src: string; name: string }) {
    return (
        <Image
            src={src || '/web-app-manifest-192x192.png'}
            alt={name}
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-cover border border-white shadow-sm flex-shrink-0"
            unoptimized
            onError={(e) => {
                (e.target as HTMLImageElement).src = '/web-app-manifest-192x192.png';
            }}
        />
    );
}

// ─── Summary Stats Cards ────────────────────────────────────────────
function AvatarStack({ avatars }: { avatars: string[] }) {
    if (avatars.length === 0) return null;
    return (
        <div className="flex items-center -space-x-2">
            {avatars.slice(0, 4).map((src, i) => (
                <Image
                    key={i}
                    src={src || '/web-app-manifest-192x192.png'}
                    alt=""
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full object-cover border border-white"
                    style={{ zIndex: avatars.length - i }}
                    unoptimized
                    onError={(e) => { (e.target as HTMLImageElement).src = '/web-app-manifest-192x192.png'; }}
                />
            ))}
        </div>
    );
}

function SummaryCards({ tab, stats, avatars }: { tab: LeaderboardTab; stats: Record<string, number>; avatars: string[] }) {
    if (tab === 'referral') return null;

    let left = { label: '', value: '' };
    let right = { label: '', value: '' };

    if (tab === 'skilled') {
        left = { label: 'Total Plays', value: formatNumber(stats.totalPlays || 0) };
        right = { label: 'Total Wins', value: formatNumber(stats.totalWins || 0) };
    } else if (tab === 'wins') {
        left = { label: 'Total Users', value: formatNumber(stats.totalUsers || 0) };
        right = { label: '$SCAN Rewarded', value: (stats.scanRewarded || 0).toLocaleString() };
    } else if (tab === 'spenders') {
        left = { label: 'Attempts Bought', value: formatNumber(stats.attemptsBought || 0) };
        right = { label: '$SCAN Spent', value: (stats.scanSpent || 0).toLocaleString() };
    }

    return (
        <div className="grid grid-cols-2 gap-3 mb-5">
            <div
                style={{
                    borderRadius: 6,
                    padding: 12,
                    background: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 4,
                    alignItems: 'center',
                }}
            >
                <span
                    style={{
                        fontFamily: "'Noto Sans Mono', monospace",
                        fontWeight: 500,
                        fontSize: 12,
                        lineHeight: '16px',
                        color: '#6B7280',
                    }}
                >
                    {left.label}
                </span>
                <div className="flex items-center gap-2">
                    <AvatarStack avatars={avatars} />
                    <span className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Noto Sans Mono', monospace" }}>
                        {left.value}
                    </span>
                </div>
            </div>
            <div
                style={{
                    borderRadius: 6,
                    padding: 12,
                    background: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 4,
                    alignItems: 'center',
                }}
            >
                <span
                    style={{
                        fontFamily: "'Noto Sans Mono', monospace",
                        fontWeight: 500,
                        fontSize: 12,
                        lineHeight: '16px',
                        color: '#6B7280',
                    }}
                >
                    {right.label}
                </span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400" style={{ fontFamily: "'Noto Sans Mono', monospace" }}>
                    {right.value}
                </span>
            </div>
        </div>
    );
}

// ─── Table Header ───────────────────────────────────────────────────
function TableHeader({ tab, referralSub }: { tab: LeaderboardTab; referralSub: string }) {
    if (tab === 'skilled')
        return (
            <thead className="font-semibold bg-[#EFF5FF] dark:bg-gray-700 text-[#6B7280] dark:text-gray-300 text-xs">
                <tr>
                    <th className="px-2 py-2 text-left">
                        <span className="flex items-center gap-1">
                            <Image src="/images/svg/winner.svg" alt="" width={15} height={12} />
                            USERS
                        </span>
                    </th>
                    <th className="px-2 py-2 text-center w-14">LvL</th>
                    <th className="px-2 py-2 text-right w-16">Win(%)</th>
                </tr>
            </thead>
        );

    let rightLabel = '';
    if (tab === 'wins') rightLabel = 'WIN(S)';
    else if (tab === 'spenders') rightLabel = 'ATTEMPT(S)';
    else if (tab === 'referral') rightLabel = referralSub === 'referral_earners' ? '$SCAN' : 'REFS';

    return (
        <thead className="font-semibold bg-[#EFF5FF] dark:bg-gray-700 text-[#6B7280] dark:text-gray-300 text-xs">
            <tr>
                <th className="px-2 py-2 text-left">
                    <span className="flex items-center gap-1">
                        <Image src="/images/svg/winner.svg" alt="" width={15} height={12} />
                        USERS
                    </span>
                </th>
                <th className="px-2 py-2 text-right whitespace-nowrap">{rightLabel}</th>
            </tr>
        </thead>
    );
}

// ─── Row Renderers ──────────────────────────────────────────────────
const medals = ['🥇', '🥈', '🥉'];

function SkilledRows({ rows, currentUserId, userRowRef }: { rows: SkilledRow[]; currentUserId?: string; userRowRef: React.Ref<HTMLTableRowElement> }) {
    return (
        <>
            {rows.map((r, i) => {
                const medal = i < 3 ? medals[i] : `${i + 1}.`;
                const isMe = currentUserId && r.userId === currentUserId;
                return (
                    <tr
                        key={r.userId}
                        ref={isMe ? userRowRef : undefined}
                        className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isMe ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                        <td className="px-2 py-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-sm font-bold w-5 flex-shrink-0">{medal}</span>
                                <UserAvatar src={r.avatar} name={r.username} />
                                <span className="font-bold dark:text-white text-xs truncate">{r.username}</span>
                                {isMe && <span className="text-[10px] text-blue-500 font-bold flex-shrink-0">You</span>}
                            </div>
                        </td>
                        <td className="px-2 py-2 text-center">
                            <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-[#EFF5FF] dark:bg-blue-900/30 text-blue-500 whitespace-nowrap">
                                Lvl {Math.min(r.level, 5)}
                            </span>
                        </td>
                        <td className="px-2 py-2 text-right">
                            <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold inline-block bg-[#EFF5FF] dark:bg-blue-900/30 text-blue-500 whitespace-nowrap">
                                {r.winRate}%
                            </span>
                        </td>
                    </tr>
                );
            })}
        </>
    );
}

function WinsRows({ rows, currentUserId, userRowRef }: { rows: WinsRow[]; currentUserId?: string; userRowRef: React.Ref<HTMLTableRowElement> }) {
    return (
        <>
            {rows.map((r, i) => {
                const medal = i < 3 ? medals[i] : `${i + 1}.`;
                const isMe = currentUserId && r.userId === currentUserId;
                return (
                    <tr
                        key={r.userId}
                        ref={isMe ? userRowRef : undefined}
                        className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isMe ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                        <td className="px-2 py-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-sm font-bold w-5 flex-shrink-0">{medal}</span>
                                <UserAvatar src={r.avatar} name={r.username} />
                                <span className="font-bold dark:text-white text-xs truncate">{r.username}</span>
                                {isMe && <span className="text-[10px] text-blue-500 font-bold flex-shrink-0">You</span>}
                            </div>
                        </td>
                        <td className="px-2 py-2 text-right">
                            <span className="text-xs px-2 py-1 rounded-full font-bold inline-block bg-[#EFF5FF] dark:bg-blue-900/30 text-blue-500">
                                {r.wins}
                            </span>
                        </td>
                    </tr>
                );
            })}
        </>
    );
}

function SpendersRows({ rows, currentUserId, userRowRef }: { rows: SpendersRow[]; currentUserId?: string; userRowRef: React.Ref<HTMLTableRowElement> }) {
    return (
        <>
            {rows.map((r, i) => {
                const medal = i < 3 ? medals[i] : `${i + 1}.`;
                const isMe = currentUserId && r.userId === currentUserId;
                return (
                    <tr
                        key={r.userId}
                        ref={isMe ? userRowRef : undefined}
                        className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isMe ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                        <td className="px-2 py-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-sm font-bold w-5 flex-shrink-0">{medal}</span>
                                <UserAvatar src={r.avatar} name={r.username} />
                                <span className="font-bold dark:text-white text-xs truncate">{r.username}</span>
                                {isMe && <span className="text-[10px] text-blue-500 font-bold flex-shrink-0">You</span>}
                            </div>
                        </td>
                        <td className="px-2 py-2 text-right">
                            <span className="text-xs px-2 py-1 rounded-full font-bold inline-block bg-[#EFF5FF] dark:bg-blue-900/30 text-blue-500">
                                {r.totalBoughtAttempts}
                            </span>
                        </td>
                    </tr>
                );
            })}
        </>
    );
}

function ReferralRows({ rows, subTab, currentUserId, userRowRef, scanPrice }: { rows: ReferralRow[]; subTab: string; currentUserId?: string; userRowRef: React.Ref<HTMLTableRowElement>; scanPrice: number }) {
    return (
        <>
            {rows.map((r, i) => {
                const medal = i < 3 ? medals[i] : `${i + 1}.`;
                const isMe = currentUserId && r.userId === currentUserId;
                const usdValue = scanPrice > 0 ? (r.totalEarnings * scanPrice) : 0;
                return (
                    <tr
                        key={r.userId}
                        ref={isMe ? userRowRef : undefined}
                        className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isMe ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                        <td className="px-2 py-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-sm font-bold w-5 flex-shrink-0">{medal}</span>
                                <UserAvatar src={r.avatar} name={r.username} />
                                <span className="font-bold dark:text-white text-xs truncate">{r.username}</span>
                                {isMe && <span className="text-[10px] text-blue-500 font-bold flex-shrink-0">You</span>}
                            </div>
                        </td>
                        <td className="px-2 py-2 text-right">
                            <span className="text-xs px-1.5 py-1 rounded-full font-bold inline-block bg-[#EFF5FF] dark:bg-blue-900/30 text-blue-500 whitespace-nowrap">
                                {subTab === 'referral_earners'
                                    ? `${formatNumber(r.totalEarnings)}${usdValue >= 0.01 ? ` (~$${usdValue.toFixed(2)})` : ''}`
                                    : r.totalReferrals}
                            </span>
                        </td>
                    </tr>
                );
            })}
        </>
    );
}

// ─── Skeleton Loader ────────────────────────────────────────────────
function SkeletonRow({ cols }: { cols: number }) {
    return (
        <tr className="border-b border-gray-200 dark:border-gray-700 animate-pulse">
            <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
            </td>
            {cols >= 3 && (
                <td className="px-3 py-3 text-center">
                    <div className="inline-block w-12 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </td>
            )}
            <td className="px-3 py-3 text-right">
                <div className="inline-block w-14 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </td>
        </tr>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function LeaderboardPage() {
    const { user } = usePrivy();
    const gameUserId = useMemo(() => user ? getUserIdFromPrivyUser(user) : undefined, [user]);

    // Live $SCAN price for USD conversion
    const [scanPrice, setScanPrice] = useState(0);
    useEffect(() => {
        fetch('/api/game/scan-price')
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data?.pricePerToken) {
                    setScanPrice(json.data.pricePerToken);
                }
            })
            .catch(() => { /* silent */ });
    }, []);

    const {
        tab,
        referralSub,
        loading,
        loadingMore,
        error,
        rows,
        summaryStats,
        currentUser,
        hasMore,
        switchTab,
        switchReferralSub,
        fetchMore,
    } = useLeaderboard(gameUserId ?? undefined);

    const cols = tab === 'skilled' ? 3 : 2;

    // ─── Infinite Scroll via IntersectionObserver ────────────────────
    const sentinelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    fetchMore();
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading, fetchMore]);

    // ─── Sticky Current User — hide when their row is in viewport ───
    const [showSticky, setShowSticky] = useState(true);
    const userRowRef = useRef<HTMLTableRowElement>(null);
    useEffect(() => {
        if (!userRowRef.current || !currentUser) return;
        const observer = new IntersectionObserver(
            ([entry]) => setShowSticky(!entry.isIntersecting),
            { threshold: 0.5 }
        );
        observer.observe(userRowRef.current);
        return () => observer.disconnect();
    }, [currentUser, rows]);

    return (
        <div className="flex flex-col font-sansMono bg-[#F7F8FD] dark:bg-gray-900 pb-28 overflow-x-hidden" style={{ minHeight: '100dvh' }}>
            <QrBaseBanner round="1" isCompleted={false} />
            <QrBaseNavbar />

            <main className="flex-1 pt-28 px-4 max-w-lg mx-auto w-full">
                {/* Title with Ranking icon */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <Image
                        src="/images/puzzle/navbar/Ranking.svg"
                        alt="Leaderboard"
                        width={24}
                        height={24}
                        className="flex-shrink-0"
                        style={{
                            filter: 'brightness(0) saturate(100%) invert(32%) sepia(93%) saturate(1730%) hue-rotate(213deg) brightness(96%) contrast(93%)',
                        }}
                    />
                    <h1
                        style={{
                            fontFamily: "'Noto Sans Mono', monospace",
                            fontWeight: 700,
                            fontSize: '20px',
                            lineHeight: '28px',
                            letterSpacing: '0%',
                            textAlign: 'center',
                        }}
                        className="text-gray-900 dark:text-white"
                    >
                        Leaderboard
                    </h1>
                </div>

                {/* Tab bar */}
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
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => switchTab(t.key)}
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
                                ...(tab === t.key
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
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Summary stats */}
                <SummaryCards
                    tab={tab}
                    stats={summaryStats}
                    avatars={[
                        ...(currentUser && tab === 'wins' ? [currentUser.avatar] : []),
                        ...rows
                            .filter((r: any) => !gameUserId || r.userId !== gameUserId)
                            .slice(0, currentUser && tab === 'wins' ? 3 : 4)
                            .map((r: any) => r.avatar),
                    ]}
                />

                {/* Referral sub-header */}
                {tab === 'referral' && (
                    <div className="mb-5">
                        <div className="flex items-center gap-2">
                            <h2
                                className="text-gray-900 dark:text-white"
                                style={{
                                    fontFamily: "'Noto Sans Mono', monospace",
                                    fontWeight: 700,
                                    fontSize: 16,
                                    lineHeight: '28px',
                                    letterSpacing: '0%',
                                    textAlign: 'center',
                                }}
                            >
                                {referralSub === 'referral_earners' ? 'Top Earners' : 'Top Referrers'}
                            </h2>
                            <button
                                onClick={switchReferralSub}
                                title="Switch view"
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    padding: 6,
                                    background: '#E6EEFF',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'opacity 0.2s',
                                }}
                                className="text-blue-600 dark:text-blue-400"
                            >
                                ⇄
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {referralSub === 'referral_earners'
                                ? 'Users ranked by total $SCAN Earned from Referrals'
                                : 'Users ranked by number of friends referred'}
                        </p>
                    </div>
                )}

                {/* Leaderboard Table */}
                <div className="rounded-2xl shadow-md overflow-hidden">
                    <table className="w-full text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 table-fixed">
                        <TableHeader tab={tab} referralSub={referralSub} />
                        <tbody>
                            {loading ? (
                                <>
                                    <SkeletonRow cols={cols} />
                                    <SkeletonRow cols={cols} />
                                    <SkeletonRow cols={cols} />
                                    <SkeletonRow cols={cols} />
                                    <SkeletonRow cols={cols} />
                                </>
                            ) : error ? (
                                <tr>
                                    <td colSpan={cols} className="text-center text-red-500 py-12 font-mono text-sm">
                                        ⚠ {error}
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={cols} className="text-center text-gray-500 py-12 font-mono">
                                        No data yet — be the first! 🚀
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {tab === 'skilled' && <SkilledRows rows={rows as SkilledRow[]} currentUserId={gameUserId ?? undefined} userRowRef={userRowRef} />}
                                    {tab === 'wins' && <WinsRows rows={rows as WinsRow[]} currentUserId={gameUserId ?? undefined} userRowRef={userRowRef} />}
                                    {tab === 'spenders' && <SpendersRows rows={rows as SpendersRow[]} currentUserId={gameUserId ?? undefined} userRowRef={userRowRef} />}
                                    {tab === 'referral' && <ReferralRows rows={rows as ReferralRow[]} subTab={referralSub} currentUserId={gameUserId ?? undefined} userRowRef={userRowRef} scanPrice={scanPrice} />}
                                    {loadingMore && (
                                        <tr>
                                            <td colSpan={cols} className="text-center py-4">
                                                <div className="inline-block w-5 h-5 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            </td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="h-1" />
                <div className="h-24" />
            </main>

            {/* Sticky current user bar */}
            {currentUser && showSticky && (
                <div
                    className="fixed bottom-28 left-0 right-0 z-50 flex justify-center px-4"
                    style={{ pointerEvents: 'none' }}
                >
                    <div
                        className="max-w-lg w-full flex items-center justify-between bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-2xl px-3 py-2.5 shadow-lg gap-2"
                        style={{ pointerEvents: 'auto' }}
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                                className="text-xs font-bold flex-shrink-0"
                                style={{ fontFamily: "'Noto Sans Mono', monospace", color: '#0052FF' }}
                            >
                                #{currentUser.rank}
                            </span>
                            <UserAvatar src={currentUser.avatar} name={currentUser.username} />
                            <span
                                className="text-xs font-semibold text-gray-900 dark:text-white truncate"
                                style={{ fontFamily: "'Noto Sans Mono', monospace" }}
                            >
                                {currentUser.username}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">You</span>
                        </div>
                        <StickyValue tab={tab} referralSub={referralSub} currentUser={currentUser} scanPrice={scanPrice} />
                    </div>
                </div>
            )}

            <PuzzleFooter />
        </div>
    );
}

// ─── Sticky value badge per tab ─────────────────────────────────────
function StickyValue({ tab, referralSub, currentUser, scanPrice }: { tab: LeaderboardTab; referralSub: string; currentUser: CurrentUserRank; scanPrice: number }) {
    let text = '';
    if (tab === 'skilled') text = `Lvl ${Math.min(currentUser.level ?? 0, 5)} · ${currentUser.winRate ?? 0}%`;
    else if (tab === 'wins') text = `${currentUser.wins ?? 0} Win(s)`;
    else if (tab === 'spenders') text = `${currentUser.totalBoughtAttempts ?? 0} Attempt(s)`;
    else if (referralSub === 'referral_earners') {
        const earnings = currentUser.totalEarnings ?? 0;
        const usd = scanPrice > 0 ? (earnings * scanPrice) : 0;
        text = `${formatNumber(earnings)} $SCAN${usd >= 0.01 ? ` (~$${usd.toFixed(2)})` : ''}`;
    }
    else text = `${currentUser.totalReferrals ?? 0} Refs`;

    return (
        <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
            style={{ background: '#0052FF1A', color: '#0052FF', fontFamily: "'Noto Sans Mono', monospace" }}
        >
            {text}
        </span>
    );
}
