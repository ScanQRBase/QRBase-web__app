"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Lightbulb, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useSendTransaction, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { useNextStep } from 'nextstepjs';
import { parseUnits, encodeFunctionData, type Address, createPublicClient, http, fallback, formatUnits } from "viem";
import { base } from "viem/chains";
import { appendBuilderSuffix } from "@/src/app/lib/builder-code";
import { QrBaseProvider } from "../components/providers/QrBaseProvider";
import { QrBaseBanner } from "../components/puzzle/PuzzleBanner";
import QrBaseNavbar from "../components/puzzle/PuzzleNavbar";
import PuzzleFooter from "../components/puzzle/PuzzleFooter";
import PuzzleGame from "../components/puzzle/PuzzleGame";
import DataFieldSpinner from "../components/shared/DataFieldSpinner";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAuth } from "../lib/context/AuthContext";
import { sdk } from "@farcaster/miniapp-sdk";
import { useRealtimeData } from "../lib/realtime";
import partnerData from "@/src/app/data/partnerData.json";
import { useGameChances, getUserIdFromPrivyUser } from "../lib/game/use-game-chances";
import { useSoundEffects } from "../lib/game/useSoundEffects";
import PuzzlePageSkeleton from "./components/PuzzlePageSkeleton";
import {
    HowItWorksModal,
    ReferenceImageModal,
    WinnersLeaderboardModal,
    PrizesPoolModal,
    TimesUpModal,
    GameOverModal,
    BuyAttemptModal,
    PurchaseSuccessfulModal,
    YouWonModal,
    ResetOverlay,
    BoostTokenModal,
    TokenBoostedModal,
    LeavePuzzleModal,
} from "../components/puzzle/PuzzleModals";
import { usePuzzleData } from "../lib/context/PuzzleDataContext";

// Dynamic import for Confetti to avoid SSR issues
const Confetti = dynamic(() => import("react-confetti-boom").then(mod => mod.default), {
    ssr: false,
    loading: () => null
});

// Game timer duration - now dynamic based on level (default 120 sec for level 1)
const DEFAULT_TIMER_SECONDS = 120;
const TOTAL_CHANCES = 3;

// Payment constants
const SCAN_TOKEN_ADDRESS = '0x20429F731096e359910921994A267d32ef576720' as Address;
const ADMIN_WALLET = (process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT_GAME_ADDRESS || '') as Address;
const ERC20_TRANSFER_ABI = [
    {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
] as const;

const ERC20_BALANCE_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
] as const;

const basePublicClient = createPublicClient({
    chain: base,
    transport: fallback([
        http(process.env.NEXT_PUBLIC_RPC_SITE1_URL),
        http(process.env.NEXT_PUBLIC_RPC_SITE2_URL),
    ]),
});

async function getTokenBalance(tokenAddress: Address, walletAddress: string): Promise<bigint> {
    try {
        const balance = await basePublicClient.readContract({
            address: tokenAddress,
            abi: ERC20_BALANCE_ABI,
            functionName: 'balanceOf',
            args: [walletAddress as Address],
        });
        return balance;
    } catch (err) {
        console.error('[QrBase] Failed to read token balance:', err);
        return BigInt(0);
    }
}

// Prize type for dynamic fetching
interface Prize {
    token: string;
    icon: string;
    remaining: number;
    usdValue: string;
}

export default function QrBasePuzzle() {
    const { ready, user, authenticated, login, linkWallet } = usePrivy();
    const { wallets } = useWallets();
    const { sendTransactionAsync } = useSendTransaction();
    const { switchChainAsync } = useSwitchChain();
    const [buyTxHash, setBuyTxHash] = useState<`0x${string}` | undefined>(undefined);
    const { data: buyTxReceipt, isLoading: isBuyTxPending } = useWaitForTransactionReceipt({ hash: buyTxHash });
    const router = useRouter();

    // NextStepJS onboarding tour — desktop (12 steps) vs mobile (6 steps)
    const { startNextStep } = useNextStep();
    const hasTriggeredOnboarding = useRef(false);
    const getTourName = () =>
        typeof window !== 'undefined' && window.innerWidth >= 768
            ? 'qrbase-puzzle-desktop'
            : 'qrbase-puzzle-mobile';

    useEffect(() => {
        if (ready && !hasTriggeredOnboarding.current) {
            const hasSeen = localStorage.getItem('qrbase_puzzle_onboarding_seen');
            if (!hasSeen) {
                hasTriggeredOnboarding.current = true;
                const timer = setTimeout(() => {
                    startNextStep(getTourName());
                    localStorage.setItem('qrbase_puzzle_onboarding_seen', 'true');
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [ready, startNextStep]);

    // ── Auth from shared AuthContext (Farcaster detection, address, wallet prompt) ──
    const { isFarcasterApp, address, isAddressResolved, needsWalletConnection, handleLinkWallet } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [moves, setMoves] = useState(0);
    const [isSolved, setIsSolved] = useState(false);
    const isSolvedRef = useRef(false); // Ref to track solved state inside closures (timer)
    const [shuffleKey, setShuffleKey] = useState(0);
    const [showWalletModal, setShowWalletModal] = useState(false);

    // Game state
    const [gameStarted, setGameStarted] = useState(false);
    const [gameTimer, setGameTimer] = useState(DEFAULT_TIMER_SECONDS);
    const [isGameOver, setIsGameOver] = useState(false);
    const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);

    // Dynamic timer duration based on level (set when game starts)
    const [timerDuration, setTimerDuration] = useState(DEFAULT_TIMER_SECONDS);
    // Store the timer duration at game start for accurate timeSpent calculation
    const [gameStartTimerDuration, setGameStartTimerDuration] = useState(DEFAULT_TIMER_SECONDS);

    // Game phase: 'idle' | 'generating' | 'ready' | 'playing'
    const [gamePhase, setGamePhase] = useState<'idle' | 'generating' | 'ready' | 'playing'>('idle');

    // Modal states
    const [showHowItWorks, setShowHowItWorks] = useState(false);
    const [showReferenceImage, setShowReferenceImage] = useState(false);
    const [showWinners, setShowWinners] = useState(false);
    const [showPrizes, setShowPrizes] = useState(false);
    const [showTimesUp, setShowTimesUp] = useState(false);
    const [showGameOver, setShowGameOver] = useState(false);
    const [showBuyAttempt, setShowBuyAttempt] = useState(false);
    const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
    const [showYouWon, setShowYouWon] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [fadeConfetti, setFadeConfetti] = useState(false);
    const [winTimeSpent, setWinTimeSpent] = useState(0); // Captured elapsed time for win popup
    const [winTxHash, setWinTxHash] = useState<string | null>(null); // Payout tx hash for win popup
    const [isBuyingAttempt, setIsBuyingAttempt] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false); // Flag to prevent useEffect from reopening popups
    const [isProcessingResult, setIsProcessingResult] = useState(false); // Spinner while win/loss API processes
    const [lastBuyTxHash, setLastBuyTxHash] = useState<string | null>(null); // Last buy-attempt tx hash for display
    const [lastBuyQuantity, setLastBuyQuantity] = useState(1); // Last buy quantity for success modal
    const [isVerifyingPurchase, setIsVerifyingPurchase] = useState(false); // Spinner while buy API verifies

    // Boost state from shared context (eliminates waterfall fetches)
    const { activeBoost: contextActiveBoost, boostQueue, partners: contextPartners } = usePuzzleData();
    const { playMove, playWin, playLoss, playClaim, playBgMusic, stopBgMusic, dimBgMusic, restoreBgMusic, playCountdownBeep } = useSoundEffects();

    // Start background music on first user interaction (autoplay policy)
    useEffect(() => {
        let started = false;
        const startMusic = () => {
            if (!started) {
                started = true;
                console.log('[BgMusic] First interaction detected, calling playBgMusic');
                playBgMusic();
                document.removeEventListener('click', startMusic);
                document.removeEventListener('touchstart', startMusic);
            }
        };
        document.addEventListener('click', startMusic);
        document.addEventListener('touchstart', startMusic);
        return () => {
            document.removeEventListener('click', startMusic);
            document.removeEventListener('touchstart', startMusic);
            stopBgMusic();
        };
    }, [playBgMusic, stopBgMusic]);

    const [showBoostModal, setShowBoostModal] = useState(false);
    const [showTokenBoosted, setShowTokenBoosted] = useState(false);
    const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
    const [showLeavePuzzle, setShowLeavePuzzle] = useState(false);
    const pendingLeaveHref = useRef<string | null>(null);
    const pendingRefresh = useRef(false);
    const [insufficientBalanceInfo, setInsufficientBalanceInfo] = useState<{
        tokenSymbol: string;
        required: string;
        balance: string;
        walletAddress: string;
    } | null>(null);
    const [localActiveBoost, setLocalActiveBoost] = useState<{ partnerName: string; partnerLogo: string; duration: number; endsAt: string; prize: number } | null>(null);
    const [isBoostLoading, setIsBoostLoading] = useState(false);

    // Use context data with local override for real-time updates
    const activeBoost = localActiveBoost ?? (contextActiveBoost ? { ...contextActiveBoost, prize: contextActiveBoost.prize ?? 0 } : null);
    const partners = contextPartners;
    const nextBoostAvailableAt = boostQueue.nextAvailableAt;

    // Helper function to close all game-related popups
    const closeAllGamePopups = () => {
        setShowTimesUp(false);
        setShowGameOver(false);
        setShowBuyAttempt(false);
        setShowPurchaseSuccess(false);
        setShowYouWon(false);
    };

    // Winners data (can be fetched from API)
    const [winners, setWinners] = useState<Array<{ username: string; avatar: string; wins: number }>>([]);
    const [isLoadingWinners, setIsLoadingWinners] = useState(false);

    // Prizes data (fetched from Moralis API)
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [isLoadingPrizes, setIsLoadingPrizes] = useState(false);

    // Always unlocked for now
    const [isUnlocked] = useState(true);

    // Get user ID for game API
    const gameUserId = useMemo(() => getUserIdFromPrivyUser(user), [user]);

    // Game chances hook
    const gameChances = useGameChances({
        userId: gameUserId,
        autoFetch: true,
        onPlaySuccess: () => console.log("Play consumed a chance successfully"),
        onPlayError: (error) => console.error("Play error:", error),
    });



    // Check if user is fully connected (social + wallet address)
    // Required to play the game and get +1 attempt
    const isFullyConnected = useMemo(() => {
        // Farcaster users have address embedded
        if (user?.farcaster && address) return true;
        // X users need both twitter and wallet connected
        if (user?.twitter && user?.wallet && address) return true;
        return false;
    }, [user?.farcaster, user?.twitter, user?.wallet, address]);

    // Auto-trigger Privy wallet connection for X users without wallet
    const hasAutoTriggeredWallet = useRef(false);
    useEffect(() => {
        // Check both needsWalletConnection AND direct Privy state for robustness
        const shouldPromptWallet = needsWalletConnection || (authenticated && !!user?.twitter && !user?.wallet);
        if (shouldPromptWallet && ready && !hasAutoTriggeredWallet.current) {
            hasAutoTriggeredWallet.current = true;
            setShowWalletModal(true);
            console.log('[QrBasePuzzle] X user without wallet detected — auto-opening linkWallet');
            // Small delay to ensure Privy SDK is fully initialized
            const timer = setTimeout(() => {
                try {
                    linkWallet();
                } catch (err) {
                    console.error('[QrBasePuzzle] Auto linkWallet failed:', err);
                }
            }, 500);
            return () => clearTimeout(timer);
        } else if (!shouldPromptWallet) {
            hasAutoTriggeredWallet.current = false;
            setShowWalletModal(false);
        }
    }, [needsWalletConnection, authenticated, user?.twitter, user?.wallet, ready, linkWallet]);



    // Sync local qrCodeImage with gameChances.currentImageUrl
    useEffect(() => {
        if (gameChances.currentImageUrl && gameChances.currentImageUrl !== qrCodeImage) {
            setQrCodeImage(gameChances.currentImageUrl);
            if (gamePhase === 'idle') {
                setGamePhase('ready');
            }
        }
    }, [gameChances.currentImageUrl, qrCodeImage, gamePhase]);

    // Sync timer duration with user's level-based timer (show correct timer when not playing)
    useEffect(() => {
        // Only sync when idle (not in active game or generating)
        if (gameChances.timerSeconds && gamePhase === 'idle') {
            setTimerDuration(gameChances.timerSeconds);
            setGameTimer(gameChances.timerSeconds);
        }
    }, [gameChances.timerSeconds, gamePhase]);

    // Save user profile (photo, name) when fully connected
    useEffect(() => {
        async function saveProfile() {
            if (!isFullyConnected || !gameUserId) return;

            // Get profile info based on login type
            let profilePhoto: string | null = null;
            let displayName: string | null = null;

            if (user?.farcaster) {
                profilePhoto = user.farcaster.pfp || null;
                displayName = user.farcaster.displayName || user.farcaster.username || null;
            } else if (user?.twitter) {
                // Remove '_normal' from Twitter profile picture URL for higher resolution
                profilePhoto = user.twitter.profilePictureUrl?.replace('_normal', '') || null;
                displayName = user.twitter.name || user.twitter.username || null;
            }

            // Save to KV via API
            if (profilePhoto || displayName) {
                try {
                    await fetch('/api/game/profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: gameUserId,
                            profilePhoto,
                            displayName,
                        }),
                    });
                    console.log('Profile saved:', { displayName, profilePhoto: profilePhoto ? '✓' : null });
                } catch (error) {
                    console.error('Error saving profile:', error);
                }
            }
        }
        saveProfile();
    }, [isFullyConnected, gameUserId, user?.farcaster, user?.twitter]);

    // Real-time WebSocket connection for boost and prizes updates
    const { connected: realtimeConnected, boost: realtimeBoost } = useRealtimeData({
        rooms: ['boost', 'prizes'],
    });

    // Update localActiveBoost from real-time WebSocket data (overrides context)
    useEffect(() => {
        if (realtimeBoost?.active) {
            setLocalActiveBoost(realtimeBoost.active as typeof localActiveBoost);
        } else if (realtimeBoost && !realtimeBoost.active) {
            setLocalActiveBoost(null);
        }
    }, [realtimeBoost]);

    // NOTE: fetchInitialData removed - data now comes from usePuzzleData context
    // This eliminates the waterfall of 3 sequential fetches on mount

    // Confetti effect tied to You Won popup
    useEffect(() => {
        if (showYouWon) {
            setShowConfetti(true);
            setFadeConfetti(false);
            const fadeTimeout = setTimeout(() => setFadeConfetti(true), 8000);
            const hideTimeout = setTimeout(() => setShowConfetti(false), 10000);
            return () => {
                clearTimeout(fadeTimeout);
                clearTimeout(hideTimeout);
                // Immediately hide confetti when modal closes (prevents lingering particles)
                setShowConfetti(false);
                setFadeConfetti(false);
            };
        }
    }, [showYouWon]);



    // =========================================================================
    // Game Abandonment Detection
    // Show confirmation popup + call loss API if user leaves during game
    // =========================================================================

    // Track if game is in progress for click handler
    const isGameInProgress = gamePhase === 'playing' && !isSolved && !isGameOver;
    const isGameInProgressRef = useRef(isGameInProgress);
    isGameInProgressRef.current = isGameInProgress;

    // Store refs for click handler
    const gameUserIdRef = useRef(gameUserId);
    const movesRef = useRef(moves);
    const gameTimerRef = useRef(gameTimer); // Track remaining time for elapsed calculation
    gameUserIdRef.current = gameUserId;
    movesRef.current = moves;
    gameTimerRef.current = gameTimer;

    useEffect(() => {
        // beforeunload: Show warning for tab close / external navigation
        // (F5/Ctrl+R are intercepted by keydown below, so this only fires for tab close)
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isGameInProgressRef.current) {
                console.log('[QrBasePuzzle] Showing leave warning');
                e.preventDefault();
                const message = 'You are in the middle of a game! Are you sure you want to leave?';
                e.returnValue = message;
                return message;
            }
        };

        // pagehide: Fires ONLY when page actually unloads (user confirmed leave)
        const handlePageHide = () => {
            if (isGameInProgressRef.current && gameUserIdRef.current) {
                console.log('[QrBasePuzzle] Page hiding - sending loss beacon');
                const elapsedTimeMs = (timerDuration - gameTimerRef.current) * 1000;
                const lossData = JSON.stringify({
                    userId: gameUserIdRef.current,
                    moves: movesRef.current,
                    timeMs: elapsedTimeMs,
                    abandoned: true,
                });
                navigator.sendBeacon('/api/game/loss', new Blob([lossData], { type: 'application/json' }));
            }
        };

        // Intercept F5 / Ctrl+R to show custom modal instead of native refresh
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isGameInProgressRef.current) return;

            const isRefresh = e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r');
            if (isRefresh) {
                e.preventDefault();
                e.stopPropagation();
                pendingRefresh.current = true;
                pendingLeaveHref.current = null;
                setShowLeavePuzzle(true);
            }
        };

        // Handler for in-app link clicks (Next.js client-side navigation)
        const handleLinkClick = (e: MouseEvent) => {
            if (!isGameInProgressRef.current) return;

            const target = e.target as HTMLElement;
            const anchor = target.closest('a');

            if (anchor && anchor.href) {
                const href = anchor.getAttribute('href');
                if (!href || href.startsWith('#') || href.startsWith('http')) return;

                e.preventDefault();
                e.stopPropagation();

                pendingRefresh.current = false;
                pendingLeaveHref.current = href;
                setShowLeavePuzzle(true);
            }
        };

        // Add listeners
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);
        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('click', handleLinkClick, true);

        // Cleanup
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('click', handleLinkClick, true);
        };
    }, [router]);

    // Handle user confirming leave via the LeavePuzzleModal
    const handleConfirmLeave = useCallback(() => {
        setShowLeavePuzzle(false);
        const href = pendingLeaveHref.current;
        const isRefresh = pendingRefresh.current;
        pendingLeaveHref.current = null;
        pendingRefresh.current = false;

        console.log('[QrBasePuzzle] User confirmed leaving during game', isRefresh ? '(refresh)' : `(navigate: ${href})`);


        // Record the loss, then navigate or refresh
        if (gameUserIdRef.current) {
            const elapsedTimeMs = (timerDuration - gameTimerRef.current) * 1000;
            fetch('/api/game/loss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: gameUserIdRef.current,
                    moves: movesRef.current,
                    timeMs: elapsedTimeMs,
                    abandoned: true,
                }),
            }).then(() => {
                if (isRefresh) {
                    window.location.reload();
                } else if (href) {
                    router.push(href);
                }
            }).catch(() => {
                if (isRefresh) {
                    window.location.reload();
                } else if (href) {
                    router.push(href);
                }
            });
        } else if (isRefresh) {
            window.location.reload();
        } else if (href) {
            router.push(href);
        }
    }, [router, timerDuration]);

    // Handle user canceling the leave modal
    const handleCancelLeave = useCallback(() => {
        setShowLeavePuzzle(false);
        pendingLeaveHref.current = null;
        pendingRefresh.current = false;
    }, []);

    // Handle Play button click
    const handlePlayClick = useCallback(async () => {
        if (!gameUserId) return;
        if (!gameChances.canPlay) return;
        if (gamePhase !== 'idle' && gamePhase !== 'ready') return;

        // Reset game state
        setIsSolved(false);
        setIsGameOver(false);
        setShowTimesUp(false);
        setShowGameOver(false);
        setShowYouWon(false);
        setMoves(0);
        // Set timer duration based on user's level
        const currentTimerDuration = gameChances.timerSeconds;
        setTimerDuration(currentTimerDuration);
        setGameTimer(currentTimerDuration);
        setGameStartTimerDuration(currentTimerDuration); // Store for accurate timeSpent calculation
        // Reset loss recording flag for new game
        hasRecordedLoss.current = false;
        // Generate new session ID
        gameSessionId.current = crypto.randomUUID();


        setGamePhase('generating');

        try {
            const result = await gameChances.generateImage();
            if (result) {
                setQrCodeImage(result.imageUrl);
                const success = await gameChances.play();
                if (success) {
                    await gameChances.refresh();
                    await gameChances.startGame();
                    setGamePhase('playing');
                    setGameStarted(true);
                    dimBgMusic();
                } else {
                    setGamePhase('idle');
                }
            } else {
                setGamePhase('idle');
            }
        } catch (error) {
            console.error('Play click error:', error);
            setGamePhase('idle');
        }
    }, [gameUserId, gameChances, gamePhase]);

    // Puzzle callbacks
    const handleMove = useCallback(() => {
        if (gameStarted) {
            setMoves((m) => m + 1);
            playMove();
        }
    }, [gameStarted, playMove]);

    // Track win recording
    const isRecordingWin = useRef(false);
    // Track loss recording to prevent duplicate API calls
    const hasRecordedLoss = useRef(false);
    // Track unique game session to prevent race conditions
    const gameSessionId = useRef<string | null>(null);

    const handleSolved = useCallback(async () => {
        if (isSolved || isRecordingWin.current) return;

        isRecordingWin.current = true;
        try {
            // CRITICAL: Block the loss effect IMMEDIATELY before any async work.
            // Without this, the timer can fire isGameOver=true, the loss effect runs,
            // and the worker clears current_game_id before our win call arrives.
            hasRecordedLoss.current = true; // Prevent loss effect from firing
            setIsSolved(true);
            isSolvedRef.current = true; // Update ref immediately to prevent timer race
            playWin();
            setIsGameOver(false); // Clear any pending game-over state
            setGameStarted(false);

            if (gamePhase === 'playing') {
                // Capture elapsed time BEFORE any async calls that might reset gameTimer
                const capturedTimeSpent = gameStartTimerDuration - gameTimer;
                setWinTimeSpent(capturedTimeSpent);
                setShowYouWon(true);
                setIsProcessingResult(true); // Show spinner
                // Calculate elapsed time in milliseconds using stored start timer
                const elapsedTimeMs = capturedTimeSpent * 1000;
                // Pass moves, time, and connected wallet to recordWin for statistics and payout
                const winResult = await gameChances.recordWin(moves, elapsedTimeMs, address ?? undefined);
                if (winResult.txHash) {
                    setWinTxHash(winResult.txHash);
                    playClaim(); // Play claim sound when reward is transferred
                }
                // Refresh status to update platform with latest win data
                await gameChances.refresh();
                // Optimistic balance update: add 10K $SCAN prize instantly (no RPC dependency)
                window.dispatchEvent(new CustomEvent('balance-refresh', { detail: { delta: 2000 } })); // QUICK ROUND (was 10000)
                setIsProcessingResult(false); // Hide spinner
            }

            setGamePhase('idle');
        } finally {
            setIsProcessingResult(false);
            isRecordingWin.current = false;
        }
    }, [gameChances, isSolved, gamePhase, moves, gameTimer]);

    // Close popup and reset
    const handleClosePopup = useCallback(() => {
        setShowTimesUp(false);
        setShowGameOver(false);
        setShowYouWon(false);
        setIsGameOver(false);
        setIsSolved(false);
        isSolvedRef.current = false; // Reset ref for next game
        setWinTimeSpent(0);
        setWinTxHash(null);
        setGameTimer(timerDuration);
        setGamePhase('idle');
        restoreBgMusic();
        setQrCodeImage(null);
        setShuffleKey(prev => prev + 1);
        // Refresh status when closing popups
        gameChances.refresh();
    }, [gameChances]);

    // Game timer countdown
    useEffect(() => {
        if (!gameStarted || isSolved) {
            return;
        }

        const interval = setInterval(() => {
            setGameTimer((prev) => {
                if (prev <= 1) {
                    // Don't trigger game over if puzzle was already solved (race condition fix)
                    if (isSolvedRef.current) return 0;
                    // Timer expired - end the game
                    setGameStarted(false);
                    setIsGameOver(true);
                    setGamePhase('idle');
                    // Don't show modal here - let the separate effect handle it after fetching fresh data
                    return 0;
                }
                // Countdown beep when 10 seconds or less remain
                if (prev - 1 <= 10 && prev - 1 > 0) {
                    playCountdownBeep(prev - 1);
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [gameStarted, isSolved]);

    // Effect to fetch fresh data when game ends and show correct modal
    useEffect(() => {
        // Don't show game over modals if we're in the middle of a purchase or if loss already recorded
        // Check session ID to ensure we're recording for the current game
        if (isGameOver && !gameStarted && !isSolved && !isSolvedRef.current && gameUserId && !isPurchasing && !hasRecordedLoss.current && !isRecordingWin.current && gameSessionId.current) {
            // Mark loss as recorded immediately to prevent duplicate calls
            hasRecordedLoss.current = true;
            const currentSessionId = gameSessionId.current;

            const fetchAndShowModal = async () => {
                try {
                    // Double check session ID hasn't changed (user clicked play again?)
                    if (gameSessionId.current !== currentSessionId) return;

                    setIsProcessingResult(true); // Show spinner while processing loss
                    playLoss();
                    // Record the loss first (with current moves from ref to avoid stale closure)
                    await gameChances.recordLoss(movesRef.current);

                    // Fetch fresh data FIRST
                    const response = await fetch(
                        `/api/game/status?userId=${encodeURIComponent(gameUserId)}`,
                        { cache: 'no-store' }
                    );
                    const data = await response.json();

                    // Refresh hook state (don't include gameChances.refresh in deps to avoid loop)
                    gameChances.refresh();

                    setIsProcessingResult(false); // Hide spinner

                    // Check session ID again before showing modals
                    if (gameSessionId.current !== currentSessionId) return;

                    // Now show the correct modal based on fresh data
                    if (data.success && data.data) {
                        const remainingChances = data.data.totalChances;
                        if (remainingChances > 0) {
                            setShowTimesUp(true);
                        } else {
                            setShowGameOver(true);
                        }
                    } else {
                        // Fallback: show TimesUp modal
                        setShowTimesUp(true);
                    }
                } catch (error) {
                    console.error('Error fetching game status:', error);
                    setIsProcessingResult(false);
                    // Fallback: show TimesUp modal
                    if (gameSessionId.current === currentSessionId) {
                        setShowTimesUp(true);
                    }
                }
            };
            fetchAndShowModal();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isGameOver, gameStarted, isSolved, gameUserId, isPurchasing, moves]);

    // Format timer (mm:ss)
    const formatTimer = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // ═══════════════════════════════════════════════════════════
    // Pending Tx Recovery: retry orphaned purchases on mount
    // (user's token left wallet but API call failed/timed out)
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        // Retry pending buy attempts (< 5 min old)
        try {
            const pendingBuy = localStorage.getItem('pendingBuyTx');
            if (pendingBuy) {
                const { txHash, quantity, ts } = JSON.parse(pendingBuy);
                if (Date.now() - ts < 5 * 60 * 1000 && gameUserId) {
                    console.log('[QrBase] Retrying pending buy tx:', txHash);
                    gameChances.buyChances(quantity, txHash)
                        .then((success) => {
                            if (success) {
                                localStorage.removeItem('pendingBuyTx');
                                console.log('[QrBase] Pending buy tx recovered successfully');
                                gameChances.refresh();
                                window.dispatchEvent(new CustomEvent('balance-refresh'));
                            }
                        })
                        .catch(() => { });
                } else {
                    localStorage.removeItem('pendingBuyTx');
                }
            }
        } catch { /* ignore parse errors */ }

        // Retry pending boost purchases (< 5 min old)
        try {
            const pendingBoost = localStorage.getItem('pendingBoostTx');
            if (pendingBoost) {
                const parsed = JSON.parse(pendingBoost);
                if (Date.now() - parsed.ts < 5 * 60 * 1000) {
                    console.log('[QrBase] Retrying pending boost tx:', parsed.txHash);
                    fetch('/api/game/boost/purchase', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(parsed.body),
                    })
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                localStorage.removeItem('pendingBoostTx');
                                console.log('[QrBase] Pending boost tx recovered successfully');
                            }
                        })
                        .catch(() => { });
                } else {
                    localStorage.removeItem('pendingBoostTx');
                }
            }
        } catch { /* ignore parse errors */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameUserId]);

    // Handle Buy Attempt — on-chain $SCAN transfer → API verification → add chances
    // Uses wagmi writeContractAsync for ALL environments (Farcaster + regular browser)
    // The farcasterFrame() wagmi connector handles Farcaster wallet interaction
    const isBuyingRef = useRef(false);  // Synchronous double-click lock
    const isBoostBuyingRef = useRef(false);  // Synchronous double-click lock for boost
    const handleBuyAttempt = async (quantity: number = 1) => {
        console.log('[QrBase Buy] Entry:', { isFarcasterApp, address });

        // Synchronous double-click guard (ref updates immediately, unlike state)
        if (isBuyingRef.current) return;
        isBuyingRef.current = true;

        // Use safe address from AuthContext (filters out unlinked browser wallets)
        const buyerAddress = address;

        if (!address) {
            if (needsWalletConnection) {
                handleLinkWallet();
            } else {
                alert('Please connect your wallet first to buy attempts.');
            }
            return;
        }

        // Set purchasing flag to prevent useEffect from reopening popups
        setIsPurchasing(true);

        // Keep modals open with spinner while balance check + wallet confirmation runs
        setIsBuyingAttempt(true);
        try {
            const attemptPriceScan = gameChances.attemptPrice;
            const totalScanAmount = parseUnits(String(attemptPriceScan * quantity), 18);

            // Encode ERC-20 transfer call data
            const data = encodeFunctionData({
                abi: ERC20_TRANSFER_ABI,
                functionName: 'transfer',
                args: [ADMIN_WALLET, totalScanAmount],
            });

            let txHash: string;

            // Pre-check: verify token balance before submitting transaction
            // Prevents ugly native "Transaction failure" error in Farcaster/Base app
            const buyerBalance = await getTokenBalance(SCAN_TOKEN_ADDRESS, buyerAddress!);
            if (buyerBalance < totalScanAmount) {
                setIsBuyingAttempt(false);
                setIsPurchasing(false);
                setInsufficientBalanceInfo({
                    tokenSymbol: '$SCAN',
                    required: formatUnits(totalScanAmount, 18),
                    balance: formatUnits(buyerBalance, 18),
                    walletAddress: buyerAddress!,
                });
                setShowInsufficientBalance(true);
                return;
            }

            if (isFarcasterApp) {
                // ═══════════════════════════════════════════════════════════
                // FARCASTER: Use SDK provider directly for transactions.
                // wagmi's sendTransactionAsync uses the WRONG wallet (MetaMask)
                // because the farcasterFrame connector picks up the browser
                // extension instead of the Farcaster wallet.
                // ═══════════════════════════════════════════════════════════
                console.log('[QrBase Buy] Sending transaction via SDK provider (Farcaster)...');
                const provider = await sdk.wallet.getEthereumProvider();
                if (!provider) {
                    throw new Error('Farcaster wallet provider not available');
                }
                txHash = await (provider as any).request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from: buyerAddress,
                        to: SCAN_TOKEN_ADDRESS,
                        data: appendBuilderSuffix(data),
                        value: '0x0',
                    }],
                });
            } else {
                // ═══════════════════════════════════════════════════════════
                // WEB: Use wagmi's sendTransactionAsync (MetaMask/RainbowKit)
                // ═══════════════════════════════════════════════════════════
                await switchChainAsync({ chainId: base.id });
                console.log('[QrBase Buy] Sending transaction via wagmi (Web)...');
                txHash = await sendTransactionAsync({
                    chainId: base.id,
                    to: SCAN_TOKEN_ADDRESS,
                    data: appendBuilderSuffix(data),
                    value: BigInt(0),
                });
            }

            console.log('[QrBase Buy] Transaction result:', { txHash, type: typeof txHash });

            if (!txHash) {
                throw new Error('Transaction was rejected or failed');
            }

            // Pass txHash to API for verification + add chances
            console.log('[QrBase Buy] Calling buyChances with txHash:', txHash);
            // Close buy/game-over modals now that transaction is submitted
            closeAllGamePopups();

            // Store txHash and quantity for display and show verification spinner
            setLastBuyTxHash(txHash);
            setLastBuyQuantity(quantity);
            setIsVerifyingPurchase(true);

            // Save pending tx to localStorage for recovery if API call fails
            localStorage.setItem('pendingBuyTx', JSON.stringify({ txHash, quantity, ts: Date.now() }));

            const success = await gameChances.buyChances(quantity, txHash);
            setIsVerifyingPurchase(false);
            if (success) {
                // Clear pending tx — purchase completed successfully
                localStorage.removeItem('pendingBuyTx');
                // Show Purchase Successful popup
                setShowPurchaseSuccess(true);
                await gameChances.refresh();
                // Optimistic balance update: subtract cost instantly
                const totalCost = gameChances.attemptPrice * quantity;
                console.log('[QrBase Buy] Optimistic delta:', -totalCost, '(price:', gameChances.attemptPrice, '× qty:', quantity, ')');
                window.dispatchEvent(new CustomEvent('balance-refresh', { detail: { delta: -totalCost } }));
            }
        } catch (error: any) {
            console.error('[QrBase Buy] Error:', error);
            const msg = error?.message || '';
            if (msg.includes('rejected') || msg.includes('denied') || msg.includes('rejected_by_user')) {
                alert('Transaction cancelled.');
            } else if (msg.includes('exceeds balance') || msg.includes('insufficient') || msg.includes('Insufficient')) {
                alert('Insufficient $SCAN balance. You need ' + (gameChances.attemptPrice * quantity).toLocaleString() + ' $SCAN to buy ' + quantity + ' attempt(s).');
            } else if (msg.includes('reverted') || msg.includes('Simulation failed')) {
                alert('Transaction failed. Please check your $SCAN balance.');
            } else if (msg.includes('network') || msg.includes('timeout') || msg.includes('RPC')) {
                alert('Network error. Please try again.');
            } else {
                alert(`Transaction failed: ${msg || 'Unknown error'}`);
            }
        } finally {
            isBuyingRef.current = false;  // Release double-click lock
            setIsBuyingAttempt(false);
            setIsVerifyingPurchase(false);
            // Close any remaining modals on error
            setShowGameOver(false);
            setShowBuyAttempt(false);
            // Reset purchasing flag after a short delay to allow Purchase Successful to show
            setTimeout(() => setIsPurchasing(false), 1000);
        }
    };



    // Share handlers
    const formatTimeForShare = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleShareFarcaster = () => {
        // Use captured winTimeSpent (not live gameTimer which gets reset)
        const timeStr = formatTimeForShare(winTimeSpent);
        const currentUserId = gameChances.gameStatus?.userId;
        const referralLink = currentUserId
            ? `https://farcaster.xyz/miniapps/pSTSE9GDxQA7/qrbase?path=/puzzle&ref=${currentUserId}`
            : 'https://farcaster.xyz/miniapps/pSTSE9GDxQA7/qrbase?path=/puzzle';
        const text = encodeURIComponent(
            `I just won the QR Puzzle on @scanqrbase.eth! 🧩🎉\n\n🎮 Solved in ${timeStr} with ${moves} moves!`
            + `\n\nJoin the game 👇\n${referralLink}`
        );
        // Attach Win Share image as embed
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.qrbase.xyz';
        const winShareImage = `${baseUrl}/images/puzzle/share/Win%20share%203.jpg`;
        window.open(`https://farcaster.xyz/~/compose?text=${text}&embeds[]=${encodeURIComponent(referralLink)}&embeds[]=${encodeURIComponent(winShareImage)}`, '_blank');
    };

    const handleShareX = () => {
        // Use captured winTimeSpent (not live gameTimer which gets reset)
        const timeStr = formatTimeForShare(winTimeSpent);
        const currentUserId = gameChances.gameStatus?.userId;
        const referralLink = currentUserId
            ? `https://www.qrbase.xyz/puzzle?ref=${currentUserId}`
            : 'https://www.qrbase.xyz/puzzle';
        const text = encodeURIComponent(
            `I just won the QR Puzzle on @ScanQRBase! 🧩🎉\n\n🎮 Solved in ${timeStr} with ${moves} moves!`
            + `\n\nJoin the game 👇\n${referralLink}`
        );
        window.open(`https://x.com/intent/post?text=${text}`, '_blank');
    };

    // Check if should show reset overlay (show when not connected OR when no chances left)
    const showResetOverlay = (!isFullyConnected && !gameStarted && gamePhase === 'idle') || (isFullyConnected && gameChances.totalChances <= 0 && !gameStarted && gamePhase === 'idle');

    const coinsBoughtDisplay = useMemo(() => [], []);

    // Loading state
    if (!ready) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#F7F8FD] dark:bg-gray-900">
                <img
                    src="/images/gif/QRbase-claim-links-work.gif"
                    alt="Loading..."
                    className="w-64 h-64 object-contain"
                />
            </div>
        );
    }

    // Skeleton while address resolves (only for authenticated users)
    if (authenticated && !isAddressResolved) {
        return (
            <QrBaseProvider>
                <div className="flex min-h-screen flex-col font-sansMono bg-[#F7F8FD] dark:bg-gray-900">
                    <QrBaseBanner round={partnerData[0].round} isCompleted={false} />
                    <QrBaseNavbar coinsBoughtDisplay={coinsBoughtDisplay} address={null} loading={true} />
                    <PuzzlePageSkeleton />
                </div>
            </QrBaseProvider>
        );
    }

    return (
        <QrBaseProvider>
            <div className="flex min-h-screen flex-col font-sansMono bg-[#F7F8FD] dark:bg-gray-900">
                {/* Confetti overlay for win celebration */}
                {showConfetti && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        zIndex: 201,
                        pointerEvents: 'none',
                        opacity: fadeConfetti ? 0 : 1,
                        transition: 'opacity 0.7s',
                    }}>
                        <Confetti
                            mode="fall"
                            particleCount={typeof window !== 'undefined' && window.innerWidth <= 768 ? 30 : 100}
                            colors={["#0052FF", "#D1D5DB"]}
                        />
                        <Confetti
                            mode="boom"
                            particleCount={typeof window !== 'undefined' && window.innerWidth <= 768 ? 15 : 50}
                            effectCount={typeof window !== 'undefined' && window.innerWidth <= 768 ? 2 : 3}
                            effectInterval={500}
                            colors={["#0052FF", "#D1D5DB"]}
                        />
                    </div>
                )}
                <QrBaseBanner round={partnerData[0].round} isCompleted={isSolved} />
                <QrBaseNavbar coinsBoughtDisplay={coinsBoughtDisplay} address={address} loading={loading} />

                {/* Loading overlay while processing win/loss */}
                {isProcessingResult && !showYouWon && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center gap-3 shadow-xl">
                            <svg className="w-8 h-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
                            </svg>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">Processing...</span>
                        </div>
                    </div>
                )}

                {/* Loading overlay while verifying purchase on-chain */}
                {isVerifyingPurchase && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center gap-3 shadow-xl">
                            <svg className="w-8 h-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
                            </svg>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">Verifying purchase...</span>
                            {lastBuyTxHash && (
                                <a
                                    href={`https://basescan.org/tx/${lastBuyTxHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:text-blue-600 font-mono underline"
                                >
                                    Tx: {lastBuyTxHash.slice(0, 6)}...{lastBuyTxHash.slice(-4)}
                                </a>
                            )}
                        </div>
                    </div>
                )}
                {/* All Modals */}
                <HowItWorksModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
                <ReferenceImageModal
                    isOpen={showReferenceImage}
                    onClose={() => setShowReferenceImage(false)}
                    imageSrc={qrCodeImage || "/images/puzzle/game.webp"}
                />

                <PuzzleFooter />

                <WinnersLeaderboardModal
                    isOpen={showWinners}
                    onClose={() => setShowWinners(false)}
                    winners={winners}
                    isLoading={isLoadingWinners}
                />
                <PrizesPoolModal
                    isOpen={showPrizes}
                    onClose={() => setShowPrizes(false)}
                    prizes={prizes}
                    isLoading={isLoadingPrizes}
                    activeBoost={activeBoost}
                    onBoostClick={() => {
                        setShowPrizes(false);
                        setShowBoostModal(true);
                    }}
                />
                <BoostTokenModal
                    isOpen={showBoostModal}
                    onClose={() => setShowBoostModal(false)}
                    partners={partners}
                    onPurchase={async (partnerAddress, duration) => {
                        // Synchronous double-click guard for boost
                        if (isBoostBuyingRef.current) return;
                        isBoostBuyingRef.current = true;
                        try {
                            if (!address) {
                                if (needsWalletConnection) {
                                    handleLinkWallet();
                                } else {
                                    alert('Please connect your wallet first.');
                                }
                                return;
                            }
                            setIsBoostLoading(true);

                            // USDC tier prices (6 decimals)
                            const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as Address;
                            const boostPrices: Record<number, bigint> = {
                                1: BigInt('9000000'),
                                3: BigInt('19000000'),
                                6: BigInt('49000000'),
                                12: BigInt('99000000'),
                                24: BigInt('199000000'),
                            };
                            const usdcAmount = boostPrices[duration] || BigInt('9000000');

                            // Pre-check: verify USDC balance before submitting
                            // Prevents ugly native "Transaction failure" error in Farcaster/Base app
                            const boostBuyerAddress = address;
                            if (boostBuyerAddress) {
                                const usdcBalance = await getTokenBalance(USDC_ADDRESS, boostBuyerAddress);
                                if (usdcBalance < usdcAmount) {
                                    setIsBoostLoading(false);
                                    setInsufficientBalanceInfo({
                                        tokenSymbol: 'USDC',
                                        required: formatUnits(usdcAmount, 6),
                                        balance: formatUnits(usdcBalance, 6),
                                        walletAddress: boostBuyerAddress,
                                    });
                                    setShowInsufficientBalance(true);
                                    return;
                                }
                            }

                            // Encode ERC-20 transfer call data
                            const boostData = encodeFunctionData({
                                abi: ERC20_TRANSFER_ABI,
                                functionName: 'transfer',
                                args: [ADMIN_WALLET, usdcAmount],
                            });

                            let txHash: string;

                            if (isFarcasterApp) {
                                // FARCASTER: Use SDK provider directly
                                const provider = await sdk.wallet.getEthereumProvider();
                                if (!provider) throw new Error('Farcaster wallet provider not available');
                                txHash = await (provider as any).request({
                                    method: 'eth_sendTransaction',
                                    params: [{
                                        from: address,
                                        to: USDC_ADDRESS,
                                        data: appendBuilderSuffix(boostData),
                                        value: '0x0',
                                    }],
                                });
                            } else {
                                // WEB: Use wagmi
                                await switchChainAsync({ chainId: base.id });
                                txHash = await sendTransactionAsync({
                                    chainId: base.id,
                                    to: USDC_ADDRESS,
                                    data: appendBuilderSuffix(boostData),
                                    value: BigInt(0),
                                });
                            }

                            if (!txHash) throw new Error('Transaction was rejected');

                            // Save pending boost tx for recovery if API call fails
                            const boostApiBody = {
                                userId: getUserIdFromPrivyUser(user),
                                partnerAddress,
                                duration,
                                durationHours: duration,
                                txHash,
                            };
                            localStorage.setItem('pendingBoostTx', JSON.stringify({ body: boostApiBody, ts: Date.now(), txHash }));

                            const res = await fetch('/api/game/boost/purchase', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(boostApiBody),
                            });
                            const data = await res.json();
                            if (data.success) {
                                // Clear pending boost tx — completed successfully
                                localStorage.removeItem('pendingBoostTx');
                                // Refresh active boost
                                const boostRes = await fetch('/api/game/boost/active');
                                const boostData = await boostRes.json();
                                if (boostData.success && boostData.data) {
                                    setLocalActiveBoost(boostData.data);
                                }
                                setShowBoostModal(false);
                            }
                        } catch (err: any) {
                            console.error('Boost purchase error:', err);
                            const msg = err?.message || '';
                            if (msg.includes('rejected') || msg.includes('denied') || msg.includes('rejected_by_user')) {
                                alert('Transaction cancelled.');
                            } else if (msg.includes('exceeds balance') || msg.includes('insufficient') || msg.includes('Insufficient')) {
                                alert('Insufficient USDC balance. Please add USDC to your wallet.');
                            } else if (msg.includes('reverted') || msg.includes('Simulation failed')) {
                                alert('Transaction failed. Please check your USDC balance.');
                            } else if (msg.includes('network') || msg.includes('timeout') || msg.includes('RPC')) {
                                alert('Network error. Please try again.');
                            } else {
                                alert(`Boost purchase failed: ${msg || 'Unknown error'}`);
                            }
                        } finally {
                            isBoostBuyingRef.current = false;  // Release double-click lock
                            setIsBoostLoading(false);
                        }
                    }}
                    isLoading={isBoostLoading}
                    nextAvailableAt={nextBoostAvailableAt || undefined}
                />
                <TokenBoostedModal
                    isOpen={showTokenBoosted}
                    onClose={() => setShowTokenBoosted(false)}
                    onBoostToken={() => setShowBoostModal(true)}
                    boostDuration={activeBoost?.duration}
                    partnerName={activeBoost?.partnerName}
                />

                {/* Leave Puzzle Confirmation Modal */}
                <LeavePuzzleModal
                    isOpen={showLeavePuzzle}
                    onLeave={handleConfirmLeave}
                    onContinue={handleCancelLeave}
                />

                {/* Insufficient Balance Modal */}
                {showInsufficientBalance && insufficientBalanceInfo && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative bg-white dark:bg-gray-800 shadow-xl p-6 w-[340px] rounded-2xl mx-4"
                        >
                            <button
                                onClick={() => setShowInsufficientBalance(false)}
                                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            >
                                ✕
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-mono">Your wallet</div>
                                <div className="text-xs text-gray-700 dark:text-gray-300 mb-3 font-mono break-all">
                                    {insufficientBalanceInfo.walletAddress.slice(0, 6)}...{insufficientBalanceInfo.walletAddress.slice(-4)}
                                </div>

                                <div className="flex items-center justify-between w-full mb-3">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Balance</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                                        {parseFloat(insufficientBalanceInfo.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} {insufficientBalanceInfo.tokenSymbol}
                                    </span>
                                </div>

                                <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 mb-4">
                                    <p className="text-red-600 dark:text-red-400 font-bold text-sm mb-1">Insufficient balance</p>
                                    <p className="text-red-500 dark:text-red-400 text-xs">
                                        You don&apos;t have enough {insufficientBalanceInfo.tokenSymbol} in your wallet for this transaction.
                                    </p>
                                    <p className="text-red-400 dark:text-red-500 text-xs mt-1 font-mono">
                                        Required: {parseFloat(insufficientBalanceInfo.required).toLocaleString()} {insufficientBalanceInfo.tokenSymbol}
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(insufficientBalanceInfo.walletAddress);
                                        const btn = document.getElementById('copy-address-btn');
                                        if (btn) {
                                            btn.textContent = 'Copied!';
                                            setTimeout(() => { btn.textContent = 'Copy address to fund'; }, 2000);
                                        }
                                    }}
                                    id="copy-address-btn"
                                    className="w-full h-[48px] bg-[#0052FF] text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-sm"
                                >
                                    Copy address to fund
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                <TimesUpModal
                    isOpen={showTimesUp}
                    onClose={handleClosePopup}
                    chancesLeft={gameChances.totalChances}
                    totalChances={TOTAL_CHANCES + gameChances.totalBoughtAttemptsDay}
                    onPlayAgain={handleClosePopup}
                    moves={moves}
                />
                <GameOverModal
                    isOpen={showGameOver}
                    onClose={handleClosePopup}
                    totalChances={TOTAL_CHANCES + gameChances.totalBoughtAttemptsDay}
                    onBuyAttempt={() => setShowBuyAttempt(true)}
                    isLoading={isBuyingAttempt}
                    moves={moves}
                    attemptPrice={gameChances.attemptPrice}
                />
                <BuyAttemptModal
                    isOpen={showBuyAttempt}
                    onClose={() => setShowBuyAttempt(false)}
                    onBuy={(qty) => handleBuyAttempt(qty)}
                    isLoading={isBuyingAttempt}
                    attemptPrice={gameChances.attemptPrice}
                />
                <PurchaseSuccessfulModal
                    isOpen={showPurchaseSuccess}
                    onClose={() => setShowPurchaseSuccess(false)}
                    onContinue={handleClosePopup}
                    txHash={lastBuyTxHash || undefined}
                    quantity={lastBuyQuantity}
                />
                <YouWonModal
                    isOpen={showYouWon}
                    onClose={handleClosePopup}
                    qrImageSrc={qrCodeImage || undefined}
                    onShareFarcaster={handleShareFarcaster}
                    onShareX={handleShareX}
                    isProcessing={isProcessingResult}
                    moves={moves}
                    timeSpent={winTimeSpent}
                    txHash={winTxHash || undefined}
                    prizeAmount={gameChances.currentPrize}
                />

                {/* Desktop-only: Leaderboard Modal */}
                <WinnersLeaderboardModal
                    isOpen={showWinners}
                    onClose={() => setShowWinners(false)}
                    winners={winners}
                    isLoading={isLoadingWinners}
                />

                {/* Desktop-only: Prize Pool Modal */}
                <PrizesPoolModal
                    isOpen={showPrizes}
                    onClose={() => setShowPrizes(false)}
                    prizes={prizes}
                    isLoading={isLoadingPrizes}
                    activeBoost={activeBoost}
                    onBoostClick={() => {
                        setShowPrizes(false);
                        setShowBoostModal(true);
                    }}
                />

                {/* Wallet Connection Modal — mandatory, non-dismissable */}
                {showWalletModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative bg-white dark:bg-gray-800 shadow-xl p-6 w-[340px] rounded-2xl mx-4"
                        >
                            <div className="flex flex-col items-center text-center">
                                <img
                                    src={user?.twitter?.profilePictureUrl?.replace('_normal', '') || "/web-app-manifest-192x192.png"}
                                    className="w-16 h-16 rounded-full object-cover mb-3 border-2 border-[#0052FF]"
                                    alt="Profile"
                                />
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    @{user?.twitter?.username || user?.twitter?.name}
                                </h2>
                                <div className="w-10 h-1 bg-gradient-to-r from-[#50DEF5] via-[#0052FF] to-[#AE80FF] rounded-full mt-3 mb-3" />
                                <h3 className="text-md font-bold text-gray-900 dark:text-white">
                                    Wallet Required
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                    You need to connect a wallet to play the puzzle and receive rewards.
                                </p>
                                <div className="mt-5 flex flex-col gap-2 w-full">
                                    <button
                                        onClick={handleLinkWallet}
                                        className="h-[48px] text-white font-bold rounded-xl w-full hover:opacity-90 transition-opacity"
                                        style={{ background: 'linear-gradient(to right, #50DEF5, #0052FF, #AE80FF)' }}
                                    >
                                        Connect Wallet
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                <main className="mx-auto flex max-w-lg flex-1 flex-col items-center px-4 py-6 w-full pt-28 pb-32 min-h-[calc(100vh-80px)]">
                    {/* Timer Bar */}
                    <div id="onboarding-timer" className="w-full max-w-[400px] flex justify-between items-center mb-4 px-2">
                        {/* Timer */}
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: gameTimer <= 10 ? '#EF4444' : '#0052FF' }}>
                            <img src="/images/puzzle/Timer.svg" alt="" className="w-5 h-5" style={{ filter: 'brightness(0) invert(1)' }} />
                            <span className="font-bold font-mono text-white">
                                {formatTimer(gameTimer)}
                            </span>
                        </div>



                        {/* Prize - 2K $SCAN per puzzle win (Quick Round) */}
                        <div className="flex items-center gap-2 font-mono px-4 py-2 rounded-full" style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB' }}>
                            <span className="text-gray-600 dark:text-gray-400">Prize:</span>
                            <span className="font-bold text-gray-900 dark:text-white">2K</span>
                            <img
                                src="https://ik.imagekit.io/cafu/$SCAN/scan.png?updatedAt=1746620925756&ik-s=83f8422add9570195a66cd510d3f1c5e884a50d1"
                                alt="SCAN"
                                className="w-5 h-5 rounded-full"
                            />
                        </div>
                    </div>

                    {/* Puzzle Container */}
                    <div id="onboarding-puzzle-board" className="relative w-full max-w-[400px] aspect-square mb-4 overflow-hidden rounded-xl">
                        {/* Reset Overlay */}
                        <ResetOverlay
                            isVisible={showResetOverlay}
                            resetTime={gameChances.countdownDisplay || "0h 0m 0s"}
                            onBuyAttempt={() => setShowBuyAttempt(true)}
                            isConnected={isFullyConnected}
                            onSignIn={() => authenticated ? handleLinkWallet() : login()}
                            needsWalletConnection={needsWalletConnection}
                            onLinkWallet={handleLinkWallet}
                        />

                        {/* Play Button Overlay */}
                        <AnimatePresence>
                            {isUnlocked && isFullyConnected && (gamePhase === 'idle' || gamePhase === 'ready') && !showResetOverlay && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, transition: { duration: 0.3 } }}
                                    className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm bg-black/40 rounded-xl"
                                >
                                    {gameChances.canPlay ? (
                                        <button
                                            onClick={handlePlayClick}
                                            className="group flex flex-col items-center gap-3"
                                        >
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#0052FF] to-[#AE80FF] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            </div>
                                            <span className="text-white font-bold text-lg font-mono">Play Now</span>
                                        </button>
                                    ) : (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 rounded-xl">
                                            <div className="text-center p-6">
                                                {/* Lock Icon */}
                                                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                </div>

                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 font-mono">
                                                    Attempts reset in
                                                </h3>

                                                <p className="text-2xl font-bold text-blue-500 mb-4 font-mono">
                                                    {gameChances.countdownDisplay || "0h 0m 0s"}
                                                </p>

                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                    Wait for the Reset or<br />
                                                    Buy more Attempts to keep playing.
                                                </p>
                                            </div>
                                        </div>

                                        // <div className="text-center text-white">
                                        //     <p className="font-mono">No chances left</p>
                                        //     <p className="text-sm opacity-70">Reset: {gameChances.countdownDisplay}</p>
                                        // </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Generating Spinner */}
                        <AnimatePresence>
                            {gamePhase === 'generating' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm bg-black/40 rounded-xl"
                                >
                                    <div className="text-center">
                                        <div className="w-16 h-16 mx-auto mb-4 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                        <p className="text-white font-medium font-mono">Generating puzzle...</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Puzzle Game */}
                        <motion.div
                            animate={{
                                filter: (isUnlocked && gamePhase === 'playing') ? "blur(0px)" : "blur(4px)",
                                opacity: (isUnlocked && gamePhase === 'playing') ? 1 : 0.6,
                            }}
                            transition={{ duration: 0.5 }}
                            className={(gamePhase !== 'playing') ? "pointer-events-none" : ""}
                        >
                            <PuzzleGame
                                key={shuffleKey}
                                imageSrc={qrCodeImage || "/images/puzzle/game.webp"}
                                onMove={handleMove}
                                onSolved={handleSolved}
                                moves={moves}
                                isSolved={isSolved}
                                isUnlocked={isUnlocked && gamePhase === 'playing'}
                                isFullscreenMode={false}
                                isBoosted={!!activeBoost}
                                level={gameChances.level}
                            />
                        </motion.div>
                    </div>

                    {/* Action Buttons Row - Under Puzzle */}
                    <div className="w-full max-w-[400px] flex items-center justify-between mb-4 px-2">
                        {/* Left: Info + Reference icons */}
                        <div className="flex items-center gap-2">
                            {/* Info/How It Works Button */}
                            <button
                                onClick={() => setShowHowItWorks(true)}
                                title="How to Play"
                                className="p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-700 transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>

                            {/* Re-trigger Onboarding Tour */}
                            <button
                                onClick={() => startNextStep('qrbase-puzzle-tour')}
                                title="Tour Guide"
                                className="p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-700 transition-colors"
                            >
                                <BookOpen className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>

                            {/* Reference Image Button */}
                            <button
                                onClick={() => qrCodeImage && setShowReferenceImage(true)}
                                disabled={!qrCodeImage}
                                title={qrCodeImage ? "Reference Image" : "Generate QR first"}
                                className={`p-3 rounded-full border transition-colors ${qrCodeImage
                                    ? 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50'
                                    }`}
                            >
                                <Lightbulb className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>

                        </div>

                        {/* Right: Boost Tag (only when boost is active) */}
                        {activeBoost && (
                            <button
                                onClick={() => setShowTokenBoosted(true)}
                                className="relative group overflow-hidden"
                            >
                                {/* Tag */}
                                <div
                                    className="relative flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-transform overflow-hidden"
                                    style={{ backgroundColor: '#FFDA57', color: '#8F7000' }}
                                >
                                    {/* Left-to-right shine sweep effect */}
                                    <div
                                        className="absolute inset-0 -translate-x-full animate-[shine_1s_ease-in-out_infinite]"
                                        style={{
                                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                                        }}
                                    />
                                    <img src="/images/puzzle/boost/boost.svg" alt="" className="w-4 h-4 relative z-10" />
                                    <span className="relative z-10">{activeBoost.duration}H BOOST</span>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Stats Card */}
                    <div id="onboarding-stats" className="w-full max-w-[400px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div className="font-mono">
                                <span className="text-gray-500 dark:text-gray-400">Moves:</span>
                                <span className="ml-2 font-bold text-gray-900 dark:text-white">{moves}</span>
                            </div>
                            <div className="font-mono">
                                <span className="font-bold text-gray-900 dark:text-white">
                                    Lvl {Math.min(gameChances.level, 5)}
                                </span>
                                <span className="text-gray-400 text-xs font-mono">
                                    ({timerDuration}s)
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <img src="/images/puzzle/task/heart.svg" alt="" className="w-4 h-4" />
                                <span className="font-bold text-blue-500 font-mono">{gameChances.totalChances}</span>
                            </div>
                        </div>

                        {/* Mobile (<md) – only Get +1 Attempt */}
                        <div className="w-full max-w-[400px] mt-2">
                            <button
                                id="onboarding-attempts"
                                onClick={() => setShowBuyAttempt(true)}
                                disabled={!isFullyConnected}
                                className={`w-full h-[48px] text-white font-bold text-lg rounded-xl transition-opacity font-mono ${!isFullyConnected ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                                    }`}
                                style={{
                                    background: 'linear-gradient(to right, #50DEF5, #0052FF, #AE80FF)',
                                }}
                            >
                                Get More Attempts
                            </button>
                        </div>
                    </div>






                    {/* Connection prompt - show when not fully connected */}
                    {!isFullyConnected && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-[400px] mt-6 p-6 bg-gradient-to-r from-[#50DEF5]/10 via-[#0052FF]/10 to-[#AE80FF]/10 rounded-xl border border-[#0052FF]/30"
                        >
                            <div className="text-center">
                                {!authenticated ? (
                                    /* ── Not authenticated at all ── */
                                    <>
                                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#0052FF] flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Connect to Play</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            Sign in with X or Farcaster and connect your wallet to play
                                        </p>
                                        <button
                                            onClick={() => login()}
                                            className="px-6 h-[48px] bg-[#0052FF] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                                        >
                                            Sign In
                                        </button>
                                    </>
                                ) : (
                                    /* ── Authenticated but wallet missing ── */
                                    <>
                                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#50DEF5] to-[#0052FF] flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Wallet Required</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            Connect your wallet to start playing and earn rewards
                                        </p>
                                        <button
                                            onClick={handleLinkWallet}
                                            className="px-6 h-[48px] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                                            style={{ background: 'linear-gradient(to right, #50DEF5, #0052FF, #AE80FF)' }}
                                        >
                                            Connect Wallet
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </main>
            </div>
        </QrBaseProvider>
    );
}
