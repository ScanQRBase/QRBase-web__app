'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HowItWorksModal } from '../puzzle/PuzzleModals';
import { QrBaseProvider } from '../providers/QrBaseProvider';
import { PuzzleDataProvider } from '../../lib/context/PuzzleDataContext';
import { QrBaseBanner } from '../shared/Banner';
import QrBaseNavbar from '../shared/Navbar';
import { useScanModeViewers } from '../../utils/useScanModeViewers';
import { usePrivy } from '@privy-io/react-auth';
import { getUserIdFromPrivyUser } from '../../lib/game/use-game-chances';
import { PieceState } from '../../types';
import { lockedImages, unlockedImages } from '../../types/imageAssets';
import Confetti from 'react-confetti-boom';
import PuzzleLogo from '../../images/puzzle/navbar/Puzzle.svg';
import ScanModeQrcodeItems from './ScanModeQrcodeItems';
import ScanModeCoinInfo from './ScanModeCoinInfo';
import ScanModePartnerInfo from './ScanModePartnerInfo';
import ScanModeFooter from './ScanModeFooter';
import ScanModePartnerList from './ScanModePartnerList';
import ScanModePageSkeleton from './ScanModePageSkeleton';

import TokenIcon from '../../images/svg/tab/TokenIcon';
import QrIcon from '../../images/svg/tab/QrIcon';
import ProgressIcon from '../../images/svg/tab/ProgressIcon';
import { useRealtimeData } from '../../lib/realtime';
import { useAuth } from '../../lib/context/AuthContext';
import { useMobileDetect } from '../../hooks/useMobileDetect';


interface ScanModeProgress {
    partnerName: string;
    totalWins: number;
    milestones: number[];
    piecesUnlocked: number;
    totalPieces: number;
    fakeImages: string[];
    realImage?: string;
    minPuzzleWins: number;
    reward: number;
    round: string;
    prizes: string | null;
    link: string | null;
    primaryColor: string;
    gradientStart: string;
    gradientEnd: string;
    xLink: string | null;
    telegramLink: string | null;
    warpcastLink: string | null;
    discordLink?: string | null;
    zoraLink?: string | null;
    seoCard: string | null;
    description: string | null;
    partnerLogo: string;
    scanModePartnerLogo?: string;
    firstImage: string | null;
    contractAddress: string | null;
    minScanBalance: number;
    minPartnerPuzzles: number;
    rewardTiers: { place: number; label: string; amount: number }[] | null;
    shareImages: string | null;
    usefulLinks: { label: string; url: string }[] | null;
}

const ONBOARDING_KEY = 'qrbase_onboarding_seen';

export default function ScanModeMain({ partnerAddress }: { partnerAddress: string }) {
    const [progress, setProgress] = useState<ScanModeProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'token' | 'qr' | 'progress' | null>(
        typeof window !== 'undefined' && window.innerWidth < 768 ? 'qr' : null
    );
    const [partnersList, setPartnersList] = useState([]); // State for scan mode partners
    const [scanBalance, setScanBalance] = useState<number | null>(null);
    const [userPartnerWins, setUserPartnerWins] = useState<number | null>(null);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [showHowItWorks, setShowHowItWorks] = useState(false);
    const { authenticated, user } = usePrivy();

    // Auto-show How It Works on first visit
    useEffect(() => {
        const hasSeen = localStorage.getItem(ONBOARDING_KEY);
        if (!hasSeen) {
            setShowHowItWorks(true);
        }
    }, []);

    // ── Auth from shared AuthContext ──
    const { isFarcasterApp, address, needsWalletConnection, handleLinkWallet } = useAuth();
    const isMobile = useMobileDetect();

    // userId for DB queries (fc:FID or x:username) — NOT the wallet address
    const userId = getUserIdFromPrivyUser(user);

    // Unique viewer count + real-time progress via WebSocket
    const { viewerCount, liveWins } = useScanModeViewers(`scanMode-${partnerAddress}`);

    // Global real-time WebSocket — receives STATS_UPDATE on every win
    const { stats: realtimeStats } = useRealtimeData({
        rooms: ['stats'],
    });

    // Fetch partner progress data
    const fetchProgress = useCallback(async (isRefresh = false) => {
        try {
            // First fetch all scan mode partners, find the match
            const partnersRes = await fetch('/api/game/scanMode/partners');
            const partnersData = await partnersRes.json();

            if (!partnersData.success) {
                if (!isRefresh) setError('Failed to load partners');
                return;
            }

            // Map and set partners list for the ticker
            const mappedPartners = partnersData.data.map((p: any) => ({
                id: p.contractAddress,
                title: p.name,
                logo: p.logo,
                scan_mode_partner_logo: p.pLogo, // Explicitly pass scan mode logo
                prizes: p.prizes, // Added prizes mapping
                reward: p.reward,
                pool: p.contractAddress,
                piecesUnlocked: p.piecesUnlocked ?? 0,
                totalPieces: p.totalPieces ?? 9,
                MILESTONES: typeof p.milestones === 'string' ? JSON.parse(p.milestones) : (p.milestones || []),
            }));
            setPartnersList(mappedPartners);

            // Find partner by contract address or id
            const partner = partnersData.data.find(
                (p: any) => p.id === partnerAddress || p.contractAddress === partnerAddress
            );

            if (!partner) {
                if (!isRefresh) setError('Partner not found');
                return;
            }

            // Fetch full progress for this partner
            // Pass userId (fc:FID or x:username) for DB wins query — NOT wallet address
            const userIdParam = userId ? `&userId=${encodeURIComponent(userId)}` : '';
            const progressRes = await fetch(`/api/game/scanMode/progress?partnerName=${encodeURIComponent(partner.name)}${userIdParam}`);
            const progressData = await progressRes.json();

            if (progressData.success) {
                setProgress(progressData.data);
                // Update user partner wins from response
                if (progressData.data.userPartnerWins !== undefined) {
                    setUserPartnerWins(progressData.data.userPartnerWins);
                } else {
                    setUserPartnerWins(0);
                }
            } else {
                if (!isRefresh) setError('Failed to load progress');
            }
        } catch (err) {
            console.error('[ScanMode] Error fetching progress:', err);
            if (!isRefresh) setError('Failed to load scan mode data');
        } finally {
            if (!isRefresh) setLoading(false);
        }
    }, [partnerAddress, userId]);

    useEffect(() => {
        fetchProgress();
        const interval = setInterval(() => fetchProgress(true), 10000);
        return () => clearInterval(interval);
    }, [fetchProgress]);

    // Handle real-time win updates from scan-mode WebSocket
    useEffect(() => {
        if (liveWins !== null && progress && liveWins !== progress.totalWins) {
            // Optimistic update for totalWins + piecesUnlocked
            const newPiecesUnlocked = progress.milestones.filter(m => liveWins >= m).length;
            setProgress(prev => prev ? ({
                ...prev,
                totalWins: liveWins,
                piecesUnlocked: newPiecesUnlocked
            }) : null);
            // Also refetch full data to update userPartnerWins, etc.
            fetchProgress(true);
        }
    }, [liveWins]);

    // Handle real-time stats from global WebSocket (STATS_UPDATE)
    // This fires on EVERY puzzle win across the platform — refetch to get latest data
    const prevStatsRef = useRef(realtimeStats);
    useEffect(() => {
        if (realtimeStats && realtimeStats !== prevStatsRef.current && progress) {
            prevStatsRef.current = realtimeStats;
            fetchProgress(true);
        }
    }, [realtimeStats]);



    // X user wallet popup — show when wallet not yet linked
    useEffect(() => {
        if (needsWalletConnection) setShowWalletModal(true);
        else setShowWalletModal(false);
    }, [needsWalletConnection]);

    // Fetch user's $SCAN token balance — reactive to address changes
    useEffect(() => {
        if (!address || !authenticated) {
            setScanBalance(null);
            setUserPartnerWins(0);
            return;
        }
        let cancelled = false;
        const cacheKey = `scan_balance_${address.toLowerCase()}`;

        async function fetchBalance() {
            try {
                const res = await fetch(`/api/game/scanMode/userBalance?address=${encodeURIComponent(address!)}&t=${Date.now()}`);
                const data = await res.json();
                if (!cancelled && data.success) {
                    setScanBalance(data.balance);
                    try { sessionStorage.setItem(cacheKey, String(data.balance)); } catch { }
                }
            } catch (err) {
                console.error('[ScanMode] Error fetching user balance:', err);
                if (!cancelled) setScanBalance(null);
            }
        }

        // On mount: use cached value if available (survives route changes), else fetch (hard refresh)
        const cached = sessionStorage.getItem(cacheKey);
        if (cached !== null) {
            setScanBalance(Number(cached));
        } else {
            fetchBalance();
        }

        // Listen for balance-refresh events (win, buy, referral claim) — always fetch fresh
        const handleBalanceRefresh = () => {
            console.log('[ScanMode] balance-refresh event received, re-fetching...');
            fetchBalance();
        };
        window.addEventListener('balance-refresh', handleBalanceRefresh);

        return () => {
            cancelled = true;
            window.removeEventListener('balance-refresh', handleBalanceRefresh);
        };
    }, [address, authenticated]);

    // Mobile: auto-select QR tab
    useEffect(() => {
        if (isMobile && activeSection === null) {
            setActiveSection('qr');
        } else if (!isMobile) {
            setActiveSection(null);
        }
    }, [isMobile]);

    const primaryColor = progress?.primaryColor || '#0052FF';
    const isCompleted = progress ? progress.piecesUnlocked === progress.totalPieces : false;

    // Determine if user has access requirements met
    const hasAccess = authenticated && address &&
        scanBalance !== null && scanBalance >= (progress?.minScanBalance || 0) &&
        (userPartnerWins ?? 0) >= (progress?.minPartnerPuzzles || 0);

    // Build piecesState — use static lockedImages/unlockedImages from frontend (matched by contractAddress)
    const piecesState = useMemo<PieceState[]>(() => {
        if (!progress) return [];

        const poolId = progress.contractAddress || '';
        const filteredLockedImages = lockedImages.filter((item: any) => item.id.toLowerCase() === poolId.toLowerCase());
        const filteredUnlockedImages = unlockedImages.filter((item: any) => item.id.toLowerCase() === poolId.toLowerCase());

        // Start with locked images
        const updatedPieces: PieceState[] = Array(9)
            .fill(null)
            .map((_, i) => ({ image: filteredLockedImages[0]?.images[i]?.src || '' }));

        // Unlock pieces in reverse order [8,7,6,5,4,3,2,1,0]
        // Slot 8 (grid 9) unlocks first, slot 0 (grid 1) unlocks last
        const placementOrder = [8, 7, 6, 5, 4, 3, 2, 1, 0];
        for (let i = 0; i < Math.min(progress.piecesUnlocked, placementOrder.length); i++) {
            const index = placementOrder[i];
            if (index === 8 && hasAccess) {
                // Slot 8 uses fake image from DB — ONLY if user has access
                const slot8Image = (progress.fakeImages && progress.fakeImages[0])
                    ? progress.fakeImages[0]
                    : (progress.firstImage || '');
                updatedPieces[8] = { image: slot8Image, reached: true };
            } else {
                // All other slots (or slot 8 without access) use local unlocked images
                updatedPieces[index] = {
                    image: filteredUnlockedImages[0]?.images[index]?.src || '',
                    reached: true
                };
            }
        }

        return updatedPieces;
    }, [progress?.piecesUnlocked, progress?.contractAddress, progress?.firstImage, progress?.fakeImages, hasAccess]);

    // Build partnerData shape for grid component
    const gridPartnerData = useMemo(() => {
        if (!progress) return null;
        return {
            primaryColor: progress.primaryColor,
            title: progress.partnerName,
            round: progress.round || 'Round 1',
            prizes: progress.prizes || '$0',
            link: progress.link || '',
            MIN_TOKEN_BALANCE: progress.minScanBalance,
            MILESTONES: progress.milestones,
        };
    }, [progress]);

    // Build coinsBoughtDisplay for navbar: 1st tag = $SCAN balance, 2nd tag = puzzle wins
    const SCAN_LOGO_URL = 'https://ik.imagekit.io/cafu/$SCAN/scan.png?updatedAt=1746620925756&ik-s=83f8422add9570195a66cd510d3f1c5e884a50d1';
    const navbarCoins = useMemo(() => {
        if (!authenticated || !address) return [];
        const items: { logo: string; balance: number | string | null }[] = [];
        // Tag 1: $SCAN balance
        items.push({ logo: SCAN_LOGO_URL, balance: scanBalance });
        // Tag 2: Solved puzzles count
        items.push({ logo: PuzzleLogo.src || PuzzleLogo, balance: userPartnerWins });
        return items;
    }, [authenticated, address, scanBalance, userPartnerWins]);

    if (loading) {
        return (
            <QrBaseProvider>
                <PuzzleDataProvider>
                    <div className="flex min-h-screen flex-col font-sansMono bg-[#F7F8FD] dark:bg-gray-900">
                        <QrBaseBanner round="Scan Mode" isCompleted={false} />
                        <QrBaseNavbar coinsBoughtDisplay={navbarCoins} address={address} loading={true} scanModeAddress={partnerAddress} />
                        <ScanModePageSkeleton />
                    </div>
                </PuzzleDataProvider>
            </QrBaseProvider>
        );
    }

    if (error || !progress) {
        return (
            <QrBaseProvider>
                <PuzzleDataProvider>
                    <div className="flex min-h-screen flex-col font-sansMono bg-[#F7F8FD] dark:bg-gray-900">
                        <QrBaseBanner round="Scan Mode" isCompleted={false} />
                        <QrBaseNavbar coinsBoughtDisplay={navbarCoins} address={address} loading={false} scanModeAddress={partnerAddress} />
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center p-8">
                                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    {error || 'Partner not found'}
                                </h2>
                                <p className="text-gray-500">Make sure the partner address is correct and has scan mode enabled.</p>
                            </div>
                        </div>
                    </div>
                </PuzzleDataProvider>
            </QrBaseProvider>
        );
    }

    return (
        <QrBaseProvider>
            <PuzzleDataProvider>
                <div className="relative flex min-h-screen max-w-full flex-col font-sansMono bg-[#F7F8FD] dark:bg-gray-900">
                    <QrBaseBanner round={progress.round || 'Scan Mode'} isCompleted={isCompleted} />
                    <QrBaseNavbar coinsBoughtDisplay={navbarCoins} address={address} loading={false} scanModeAddress={partnerAddress} />
                    <HowItWorksModal isOpen={showHowItWorks} onClose={() => { setShowHowItWorks(false); localStorage.setItem(ONBOARDING_KEY, 'true'); }} />

                    {/* Celebration Confetti */}
                    {isCompleted && (
                        <>
                            <Confetti
                                style={{ zIndex: 51 }}
                                mode="fall"
                                particleCount={500}
                                colors={[primaryColor, progress.gradientEnd, progress.gradientStart, '#E5E7EB']}
                            />
                            <Confetti
                                style={{ zIndex: 51 }}
                                mode="boom"
                                effectInterval={10000}
                                particleCount={100}
                                colors={[primaryColor, progress.gradientEnd, progress.gradientStart, '#E5E7EB']}
                                effectCount={2}
                            />
                        </>
                    )}

                    <ScanModePartnerList
                        partners={partnersList.length > 0 ? partnersList : undefined}
                    />

                    {/* Desktop layout */}
                    {activeSection === null && (
                        <main className="mx-auto flex max-w-7xl grow flex-col">
                            <div className="flex grow flex-col md:flex-row containQrBase">
                                <div className="flex grow flex-col md:flex-row">
                                    <ScanModePartnerInfo
                                        progress={{
                                            ...progress,
                                            partnerLogo: progress.scanModePartnerLogo || progress.partnerLogo
                                        }}
                                        address={address}
                                        authenticated={authenticated}
                                        scanBalance={scanBalance}
                                        userPartnerWins={userPartnerWins ?? undefined}
                                        piecesUnlocked={progress.piecesUnlocked}
                                        totalPieces={progress.totalPieces}
                                        totalWins={progress.totalWins}
                                    />
                                    <ScanModeQrcodeItems
                                        partnerData={gridPartnerData!}
                                        piecesState={piecesState}
                                        isCompleted={isCompleted}
                                        viewerCount={viewerCount}
                                    />
                                    <ScanModeCoinInfo
                                        progress={progress}
                                        isCompleted={isCompleted}
                                    />
                                </div>
                            </div>
                        </main>
                    )}

                    {/* Mobile layout with tab navigation */}
                    {activeSection !== null && (
                        <main className="mx-auto flex max-w-7xl grow flex-col">
                            <div className="flex grow flex-col md:flex-row containQrBase">
                                <div className="flex grow flex-col md:flex-row">
                                    {activeSection === 'token' && (
                                        <div className="mt-40 w-full">
                                            <ScanModePartnerInfo
                                                progress={{
                                                    ...progress,
                                                    partnerLogo: progress.scanModePartnerLogo || progress.partnerLogo
                                                }}
                                                address={address}
                                                authenticated={authenticated}
                                                scanBalance={scanBalance}
                                                userPartnerWins={userPartnerWins ?? undefined}
                                                piecesUnlocked={progress.piecesUnlocked}
                                                totalPieces={progress.totalPieces}
                                                totalWins={progress.totalWins}
                                            />
                                        </div>
                                    )}
                                    {activeSection === 'qr' && (
                                        <div className="mt-48 w-full">
                                            <ScanModeQrcodeItems
                                                partnerData={gridPartnerData!}
                                                piecesState={piecesState}
                                                isCompleted={isCompleted}
                                                viewerCount={viewerCount}
                                            />
                                        </div>
                                    )}
                                    {activeSection === 'progress' && (
                                        <div className="mt-40 w-screen md:w-full px-2">
                                            <ScanModeCoinInfo
                                                progress={progress}
                                                isCompleted={isCompleted}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </main>
                    )}

                    {/* Footer — scrolls with page on mobile, fixed on desktop */}
                    <ScanModeFooter
                        progress={progress}
                        address={address}
                        authenticated={authenticated}
                        hasAccess={!!hasAccess}
                        scanBalance={scanBalance}
                        userPartnerWins={userPartnerWins ?? 0}
                    />

                    {/* Mobile tab bar — scrolls with page on mobile */}
                    <div className="w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden flex justify-around items-center p-2 transition-colors duration-200">
                        <button className="flex flex-col items-center" onClick={() => setActiveSection('token')}>
                            <span className="text-blue-500">
                                <TokenIcon size={20} color={activeSection === 'token' ? primaryColor : '#6B7280'} />
                            </span>
                            <span className="tabTitle" style={{ color: activeSection === 'token' ? primaryColor : '#6B7280' }}>Token Info</span>
                        </button>
                        <button className="flex flex-col items-center" onClick={() => setActiveSection('qr')}>
                            <span>
                                <QrIcon size={20} color={activeSection === 'qr' ? primaryColor : '#6B7280'} />
                            </span>
                            <span style={{ color: activeSection === 'qr' ? primaryColor : '#6B7280' }} className="tabTitle">Qrcode</span>
                        </button>
                        <button className="flex flex-col items-center" onClick={() => setActiveSection('progress')}>
                            <span>
                                <ProgressIcon size={20} color={activeSection === 'progress' ? primaryColor : '#6B7280'} />
                            </span>
                            <span style={{ color: activeSection === 'progress' ? primaryColor : '#6B7280' }} className="tabTitle">Progress</span>
                        </button>
                    </div>
                </div>
            </PuzzleDataProvider>
        </QrBaseProvider>
    );
}
