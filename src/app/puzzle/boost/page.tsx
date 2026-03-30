"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useSendTransaction, useSwitchChain, useConnect } from "wagmi";
import { type Address, encodeFunctionData, createPublicClient, http, fallback, formatUnits } from "viem";
import { base } from "viem/chains";
import { appendBuilderSuffix } from "@/src/app/lib/builder-code";
import sdk from "@farcaster/miniapp-sdk";
import { getUserIdFromPrivyUser } from "@/src/app/lib/game";
import { usePuzzleData } from "@/src/app/lib/context/PuzzleDataContext";
import PuzzleFooter from "@/src/app/components/puzzle/PuzzleFooter";
import { QrBaseBanner } from "@/src/app/components/puzzle/PuzzleBanner";
import QrBaseNavbar from "@/src/app/components/puzzle/PuzzleNavbar";
import { ThemeProvider } from "@/src/app/components/providers/ThemeProvider";
import XIcon from "@/src/app/images/svg/socialMedia/XIcon";
import WarpcastIcon from "@/src/app/images/svg/socialMedia/WarpcastIcon";

interface Partner {
    name: string;
    logo: string;
    ca: string;
    scanMode?: boolean;
}

// Boost durations/prices are fetched from the API (single source of truth in D1)
interface BoostTier {
    hours: number;
    price: number;
}

// Fallback tiers in case the API fetch fails (keeps UI usable)
const FALLBACK_BOOST_TIERS: BoostTier[] = [
    { hours: 1, price: 9 },
    { hours: 3, price: 19 },
    { hours: 6, price: 49 },
    { hours: 12, price: 99 },
    { hours: 24, price: 199 },
];

// Payment constants
const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as Address;
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
        console.error('[QrBase Boost] Failed to read token balance:', err);
        return BigInt(0);
    }
}

export default function BoostPage() {
    const [selectedPartner, setSelectedPartner] = useState<string>("");
    const [selectedDuration, setSelectedDuration] = useState<number>(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoadingPartners, setIsLoadingPartners] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [nextAvailableAt, setNextAvailableAt] = useState<string | null>(null);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);
    const [purchaseDetails, setPurchaseDetails] = useState<{
        partnerName: string;
        duration: number;
        startDate: string;
        endDate: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [boostTiers, setBoostTiers] = useState<BoostTier[]>(FALLBACK_BOOST_TIERS);
    const [isLoadingTiers, setIsLoadingTiers] = useState(true);
    const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
    const [insufficientBalanceInfo, setInsufficientBalanceInfo] = useState<{
        required: string;
        balance: string;
        walletAddress: string;
    } | null>(null);
    const [showInsufficientEth, setShowInsufficientEth] = useState(false);
    const { user } = usePrivy();
    const gameUserId = user ? getUserIdFromPrivyUser(user) : null;
    const { address: connectedAddress, isConnected: isWalletConnected } = useAccount();
    const { sendTransactionAsync } = useSendTransaction();
    const { switchChainAsync } = useSwitchChain();
    const { connect, connectors } = useConnect();
    // Get shared Farcaster state from context (resolved once, persists across navigation)
    const { isFarcasterApp, sdkAddress } = usePuzzleData();

    // Effective address: SDK for Farcaster, wagmi for web
    const effectiveAddress = isFarcasterApp ? (sdkAddress || connectedAddress) : connectedAddress;

    // Auto-connect Farcaster wallet with retry
    // Same pattern as QrBasePuzzle — retry up to 5 times with increasing delay
    useEffect(() => {
        if (!isFarcasterApp || isWalletConnected) return;

        let retryCount = 0;
        const maxRetries = 5;
        let timeoutId: ReturnType<typeof setTimeout>;
        let cancelled = false;

        const tryConnect = async () => {
            if (cancelled) return;

            const fcConnector = connectors.find(c => c.id === 'farcaster');
            if (!fcConnector) {
                if (retryCount < maxRetries) {
                    retryCount++;
                    timeoutId = setTimeout(tryConnect, retryCount * 1000);
                }
                return;
            }

            try {
                console.log(`[QrBase Boost] Connecting to Farcaster wallet (attempt ${retryCount + 1})...`);
                await connect({ connector: fcConnector });
                console.log('[QrBase Boost] ✅ Farcaster wallet connected');
            } catch (err) {
                console.error(`[QrBase Boost] ❌ Farcaster wallet connect failed (attempt ${retryCount + 1}):`, err);
                if (!cancelled && retryCount < maxRetries) {
                    retryCount++;
                    timeoutId = setTimeout(tryConnect, retryCount * 1000);
                }
            }
        };

        // Delay first attempt 500ms to let SDK's postMessage channel establish
        timeoutId = setTimeout(tryConnect, 500);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [isFarcasterApp, isWalletConnected, connectors, connect]);

    // Fetch partners on mount
    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const res = await fetch('/api/game/prizes');
                const data = await res.json();
                console.log('Prizes API response:', data);
                if (data.success && data.data?.partners) {
                    // API returns { prizes, partners, wallet } structure
                    const partnerList = data.data.partners.map((p: { name: string; logo: string; ca: string }) => ({
                        name: p.name,
                        logo: p.logo,
                        ca: p.ca,
                    }));
                    setPartners(partnerList);
                    console.log('Partners loaded:', partnerList.length);
                } else {
                    console.error('No partners in response:', data);
                }
            } catch (err) {
                console.error('Failed to fetch partners:', err);
            } finally {
                setIsLoadingPartners(false);
            }
        };
        fetchPartners();
    }, []);



    // Fetch queue to get next available time
    useEffect(() => {
        const fetchQueue = async () => {
            try {
                const res = await fetch('/api/game/boost/queue');
                const data = await res.json();
                if (data.success && data.data?.nextAvailableAt) {
                    setNextAvailableAt(data.data.nextAvailableAt);
                }
            } catch (err) {
                console.error('Failed to fetch queue:', err);
            }
        };
        fetchQueue();
    }, []);

    // Fetch boost tiers from the API (single source of truth)
    useEffect(() => {
        async function fetchTiers() {
            try {
                const res = await fetch('/api/game/boost/tiers');
                const json = await res.json();
                if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                    setBoostTiers(json.data.map((t: { duration_hours: number; price_usd: number }) => ({
                        hours: t.duration_hours,
                        price: t.price_usd,
                    })));
                    // Always select first tier if current selection is invalid or unset
                    const validHours = json.data.map((t: { duration_hours: number }) => t.duration_hours);
                    if (!selectedDuration || !validHours.includes(selectedDuration)) {
                        setSelectedDuration(json.data[0].duration_hours);
                    }
                }
            } catch (err) {
                console.error('[Boost] Failed to fetch tiers, using fallback:', err);
            } finally {
                setIsLoadingTiers(false);
            }
        }
        fetchTiers();
    }, []);

    const selectedPartnerData = partners.find(p => p.ca === selectedPartner);

    // Calculate estimated dates for each duration
    const getEstimatedDatesForDuration = (hours: number) => {
        const startDate = nextAvailableAt ? new Date(nextAvailableAt) : new Date();
        const endDate = new Date(startDate.getTime() + hours * 60 * 60 * 1000);
        return {
            start: startDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            end: endDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        };
    };

    const handlePurchase = async () => {
        if (!selectedPartner) return;

        // In Farcaster, use SDK-resolved address
        if (isFarcasterApp && !effectiveAddress) {
            setError('Farcaster wallet not detected. Please try again.');
            return;
        }
        if (!isFarcasterApp && (!isWalletConnected || !connectedAddress)) {
            setError('Please connect your wallet first.');
            return;
        }

        setIsPurchasing(true);
        setError(null);

        try {
            // Derive USDC amount from fetched tier price (convert USD to 6-decimal USDC)
            const tier = boostTiers.find(t => t.hours === selectedDuration);
            const usdcAmount = tier
                ? BigInt(Math.round(tier.price * 1_000_000))
                : BigInt('9000000'); // fallback $9

            // Pre-check: verify USDC balance before submitting
            // Prevents ugly native "Transaction failure" error in Farcaster/Base app
            if (effectiveAddress) {
                const usdcBalance = await getTokenBalance(USDC_ADDRESS, effectiveAddress);
                if (usdcBalance < usdcAmount) {
                    setIsPurchasing(false);
                    setInsufficientBalanceInfo({
                        required: formatUnits(usdcAmount, 6),
                        balance: formatUnits(usdcBalance, 6),
                        walletAddress: effectiveAddress,
                    });
                    setShowInsufficientBalance(true);
                    return;
                }
            }

            // Encode ERC-20 transfer call data
            const callData = encodeFunctionData({
                abi: ERC20_TRANSFER_ABI,
                functionName: 'transfer',
                args: [ADMIN_WALLET, usdcAmount],
            });

            let txHash: string;

            if (isFarcasterApp) {
                // FARCASTER: Use SDK provider directly for transactions
                // wagmi's sendTransactionAsync uses the WRONG wallet (MetaMask)
                console.log('[QrBase Boost] Sending transaction via SDK provider (Farcaster)...');
                const provider = await sdk.wallet.getEthereumProvider();
                if (!provider) {
                    throw new Error('Farcaster wallet provider not available');
                }
                txHash = await (provider as any).request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from: effectiveAddress,
                        to: USDC_ADDRESS,
                        data: appendBuilderSuffix(callData),
                        value: '0x0',
                    }],
                });
            } else {
                // WEB: Use wagmi's sendTransactionAsync (MetaMask/RainbowKit)
                await switchChainAsync({ chainId: base.id });
                console.log('[QrBase Boost] Sending transaction via wagmi (Web)...');
                txHash = await sendTransactionAsync({
                    chainId: base.id,
                    to: USDC_ADDRESS,
                    data: appendBuilderSuffix(callData),
                    value: BigInt(0),
                });
            }

            if (!txHash) throw new Error('Transaction was rejected');

            // Pass txHash to API for verification + boost creation
            const res = await fetch('/api/game/boost/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: gameUserId,
                    partnerAddress: selectedPartner,
                    duration: selectedDuration,
                    durationHours: selectedDuration,
                    txHash,
                }),
            });

            const data = await res.json();

            if (data.success) {
                const dates = getEstimatedDatesForDuration(selectedDuration);
                setPurchaseDetails({
                    partnerName: selectedPartnerData?.name || 'Token',
                    duration: selectedDuration,
                    startDate: dates.start,
                    endDate: dates.end,
                });
                setPurchaseSuccess(true);
            } else {
                setError(data.error || 'Failed to purchase boost');
            }
        } catch (err: any) {
            const msg = err?.message || '';
            if (msg.includes('rejected') || msg.includes('denied') || msg.includes('rejected_by_user')) {
                setError('Transaction cancelled.');
            } else if (!isFarcasterApp && (msg.includes('gas') || msg.includes('fee') || msg.includes('intrinsic') || (msg.includes('insufficient') && msg.includes('ETH')))) {
                setShowInsufficientEth(true);
            } else if (msg.includes('exceeds balance') || msg.includes('insufficient') || msg.includes('Insufficient')) {
                setError('Insufficient USDC balance. Please add USDC to your wallet.');
            } else if (msg.includes('reverted') || msg.includes('Simulation failed')) {
                setError('Transaction failed. Please check your USDC balance.');
            } else if (msg.includes('network') || msg.includes('timeout') || msg.includes('RPC')) {
                setError('Network error. Please try again.');
            } else {
                setError(`Transaction failed: ${msg || 'Unknown error'}`);
            }
            console.error('Purchase error:', err);
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleSelectPartner = (ca: string) => {
        setSelectedPartner(ca);
        setIsDropdownOpen(false);
    };

    return (
        <ThemeProvider>
            <div className="flex min-h-screen flex-col font-sansMono bg-[#F7F8FD] dark:bg-gray-900 pb-28">
                <QrBaseBanner round="1" isCompleted={false} />
                <QrBaseNavbar />

                <main className="flex-1 pt-28 px-4 max-w-lg mx-auto w-full">
                    {/* Header Icon */}
                    <div className="flex flex-wrap items-center justify-center mb-4 text-xl font-bold text-center text-gray-900 dark:text-white">
                        <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center mx-1.5 shrink-0">
                            <img src="/images/puzzle/boost/boost.svg" alt="Boost" className="w-4 h-4" />
                        </div>
                        <span>Boost Your Favorite Token</span>

                    </div>


                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">
                        Lock your favorite token as the only active puzzle — boost visibility and stack more wins
                    </p>



                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Partner Dropdown */}
                    <div className="relative mb-6">

                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center justify-between w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
                        >
                            {selectedPartnerData ? (
                                <div className="flex items-center gap-3">
                                    <img src={selectedPartnerData.logo} alt="" className="w-6 h-6 rounded-full" />
                                    <span className="text-gray-900 dark:text-white font-medium">{selectedPartnerData.name}</span>
                                </div>
                            ) : (
                                <span className="text-gray-500">Choose a token to boost</span>
                            )}
                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg z-[100] max-h-60 overflow-y-auto">
                                {isLoadingPartners ? (
                                    <div className="p-4 text-sm text-gray-500 flex items-center gap-2 justify-center">
                                        <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        Loading tokens...
                                    </div>
                                ) : partners.map((partner) => (
                                    <button
                                        type="button"
                                        key={partner.ca}
                                        onClick={() => handleSelectPartner(partner.ca)}
                                        className="flex items-center gap-3 w-full p-3 text-left border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <img src={partner.logo} alt="" className="w-6 h-6 rounded-full" />
                                        <span className="flex-1 font-medium text-gray-900 dark:text-white">
                                            {partner.name}
                                        </span>
                                        {selectedPartner === partner.ca && (
                                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Duration Selection - 2x grid */}
                    <div className="mb-4">

                        <div className="grid grid-cols-2 gap-3">
                            {boostTiers.slice(0, Math.min(4, boostTiers.length)).map((d) => {
                                const dates = getEstimatedDatesForDuration(d.hours);
                                const isSelected = selectedDuration === d.hours;
                                return (
                                    <button
                                        type="button"
                                        key={d.hours}
                                        onClick={() => setSelectedDuration(d.hours)}
                                        className={`relative p-4 rounded-xl border transition-all text-left ${isSelected
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                            }`}
                                    >
                                        {/* Radio in top-right */}
                                        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}>
                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                        </div>

                                        {/* Badge */}
                                        <div
                                            className="inline-flex items-center gap-1 px-2 py-1 mb-2"
                                            style={{ backgroundColor: '#FFDA57', borderRadius: '24px' }}
                                        >
                                            <img src="/images/puzzle/boost/boost.svg" alt="" className="w-4 h-4" />
                                            <span
                                                className="text-[10px] font-bold tracking-wider"
                                                style={{ color: '#8F7000' }}
                                            >
                                                {d.hours}H BOOST
                                            </span>
                                        </div>

                                        {/* Price */}
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">${d.price}</div>

                                        {/* Dates */}
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                                            <img src="/images/puzzle/clock.svg" alt="" className="w-5 h-5" style={{ filter: 'brightness(0) saturate(100%) invert(70%) sepia(6%) saturate(368%) hue-rotate(182deg) brightness(93%) contrast(88%)' }} />
                                            <span>{dates.start} → {dates.end}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 24H Boost - Full width */}
                    <div className="mb-6">
                        {(() => {
                            const d = boostTiers.length > 4 ? boostTiers[4] : null;
                            if (!d) return null;
                            const dates = getEstimatedDatesForDuration(d.hours);
                            const isSelected = selectedDuration === d.hours;
                            return (
                                <button
                                    type="button"
                                    onClick={() => setSelectedDuration(d.hours)}
                                    className={`relative w-full p-4 rounded-xl border transition-all text-center ${isSelected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                        }`}
                                >
                                    {/* Radio in top-right */}
                                    <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}>
                                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                    </div>

                                    {/* Badge */}
                                    <div
                                        className="inline-flex items-center gap-1 px-2 py-1 mb-2"
                                        style={{ backgroundColor: '#FFDA57', borderRadius: '24px' }}
                                    >
                                        <img src="/images/puzzle/boost/boost.svg" alt="" className="w-4 h-4" />
                                        <span
                                            className="text-[10px] font-bold tracking-wider"
                                            style={{ color: '#8F7000' }}
                                        >
                                            {d.hours}H BOOST
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">${d.price}</div>

                                    {/* Dates */}
                                    <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 mt-1">
                                        <img src="/images/puzzle/clock.svg" alt="" className="w-5 h-5" style={{ filter: 'brightness(0) saturate(100%) invert(70%) sepia(6%) saturate(368%) hue-rotate(182deg) brightness(93%) contrast(88%)' }} />
                                        <span>{dates.start} → {dates.end}</span>
                                    </div>
                                </button>
                            );
                        })()}
                    </div>

                    {/* Buy Button */}
                    <button
                        onClick={handlePurchase}
                        disabled={!selectedPartner || isPurchasing}
                        className="w-full h-[48px] bg-[#0052FF] text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPurchasing ? (
                            <>
                                <div className="w-5 h-5 border border-white border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Buy Boost Pack'
                        )}
                    </button>

                    {/* Info text */}
                    <p className="text-center text-xs text-gray-400 mt-4">
                        Boost will be queued and start when previous boosts expire.
                    </p>
                </main>

                <PuzzleFooter />

                {/* Insufficient Balance Modal */}
                {showInsufficientBalance && insufficientBalanceInfo && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="relative bg-white dark:bg-gray-800 shadow-xl p-6 w-[340px] rounded-2xl mx-4">
                            <button
                                onClick={() => setShowInsufficientBalance(false)}
                                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                ✕
                            </button>
                            <div className="flex flex-col items-center text-center">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-mono">Your wallet</div>
                                <div className="text-xs text-gray-700 dark:text-gray-300 mb-3 font-mono">
                                    {insufficientBalanceInfo.walletAddress.slice(0, 6)}...{insufficientBalanceInfo.walletAddress.slice(-4)}
                                </div>
                                <div className="flex items-center justify-between w-full mb-3">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Balance</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                                        {parseFloat(insufficientBalanceInfo.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
                                    </span>
                                </div>
                                <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 mb-4">
                                    <p className="text-red-600 dark:text-red-400 font-bold text-sm mb-1">Insufficient balance</p>
                                    <p className="text-red-500 dark:text-red-400 text-xs">
                                        You don&apos;t have enough USDC in your wallet for this transaction.
                                    </p>
                                    <p className="text-red-400 dark:text-red-500 text-xs mt-1 font-mono">
                                        Required: ${parseFloat(insufficientBalanceInfo.required).toLocaleString()} USDC
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(insufficientBalanceInfo.walletAddress);
                                        const btn = document.getElementById('boost-copy-address-btn');
                                        if (btn) {
                                            btn.textContent = 'Copied!';
                                            setTimeout(() => { btn.textContent = 'Copy address to fund'; }, 2000);
                                        }
                                    }}
                                    id="boost-copy-address-btn"
                                    className="w-full h-[48px] bg-[#0052FF] text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-sm"
                                >
                                    Copy address to fund
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Insufficient ETH for Gas Fees Modal */}
                {showInsufficientEth && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="relative bg-white dark:bg-gray-800 shadow-xl p-6 w-[340px] rounded-2xl mx-4">
                            <button
                                onClick={() => setShowInsufficientEth(false)}
                                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                ✕
                            </button>
                            <div className="flex flex-col items-center text-center">
                                <img src="/images/puzzle/Warning.svg" alt="Warning" className="w-12 h-12 mb-3" />
                                <h3
                                    className="text-lg font-bold text-gray-900 dark:text-white mb-2"
                                    style={{ fontFamily: "'Noto Sans Mono', monospace" }}
                                >
                                    Insufficient ETH for Fees
                                </h3>
                                <p
                                    className="text-sm text-gray-500 dark:text-gray-400 mb-4"
                                    style={{ fontFamily: "'Noto Sans Mono', monospace" }}
                                >
                                    You don&apos;t have enough ETH in your wallet to cover the gas fees for this transaction. Please add ETH to your wallet and try again.
                                </p>
                                <button
                                    onClick={() => setShowInsufficientEth(false)}
                                    className="w-full h-[48px] bg-[#0052FF] text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-sm"
                                >
                                    Got It
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Boost Purchase Success Modal */}
                {purchaseSuccess && purchaseDetails && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                        <div
                            className="relative bg-white dark:bg-gray-800 shadow-2xl mx-4 overflow-hidden flex flex-col"
                            style={{
                                width: '100%',
                                maxWidth: 374,
                                maxHeight: 702,
                                borderRadius: 16,
                                padding: 16,
                                gap: 15,
                                fontFamily: "'Noto Sans Mono', monospace",
                            }}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => {
                                    setPurchaseSuccess(false);
                                    setPurchaseDetails(null);
                                    setSelectedPartner("");
                                }}
                                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
                            >
                                ✕
                            </button>

                            {/* Boost Share Image */}
                            <div className="w-full rounded-xl overflow-hidden">
                                <img
                                    src="/images/puzzle/share/Boost Share 3.jpg"
                                    alt="Boost Share"
                                    className="w-full object-contain"
                                    style={{ borderRadius: 12 }}
                                />
                            </div>

                            {/* Confirm icon */}
                            <div className="flex justify-center">
                                <img src="/images/puzzle/boostConfirm.svg" alt="Confirmed" style={{ width: 40, height: 40 }} />
                            </div>

                            {/* Title */}
                            <h2
                                className="text-center"
                                style={{
                                    fontFamily: "'Noto Sans Mono', monospace",
                                    fontWeight: 700,
                                    fontSize: 18,
                                    lineHeight: '28px',
                                    color: '#111827',
                                }}
                            >
                                Congratulations !
                            </h2>

                            {/* Description */}
                            <p
                                className="text-center"
                                style={{
                                    fontFamily: "'Noto Sans Mono', monospace",
                                    fontWeight: 500,
                                    fontSize: 13,
                                    lineHeight: '20px',
                                    color: '#6B7280',
                                }}
                            >
                                Your Purchase of a{' '}
                                <span style={{ fontWeight: 700, color: '#0052FF', textDecoration: 'underline' }}>
                                    {purchaseDetails.duration}H Boost
                                </span>{' '}
                                for{' '}
                                <span style={{ fontWeight: 700, color: '#0052FF', textDecoration: 'underline' }}>
                                    ${purchaseDetails.partnerName}
                                </span>{' '}
                                has been confirmed.
                            </p>

                            {/* Boost details card */}
                            <div
                                className="flex flex-col items-center"
                                style={{
                                    width: '100%',
                                    minHeight: 91,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderStyle: 'solid',
                                    borderColor: '#FFDA57',
                                    backgroundColor: '#FFDA5733',
                                    paddingTop: 14,
                                    paddingBottom: 14,
                                    paddingLeft: 13,
                                    paddingRight: 8,
                                    gap: 19,
                                    alignSelf: 'center',
                                }}
                            >
                                {/* Icon + Name + Tag row centered */}
                                <div className="flex items-center justify-center gap-2">
                                    {selectedPartnerData?.logo && (
                                        <img src={selectedPartnerData.logo} alt="" className="w-5 h-5 rounded-full" />
                                    )}
                                    <span style={{ fontFamily: "'Noto Sans Mono', monospace", fontWeight: 700, fontSize: 13, color: '#111827' }}>
                                        ${purchaseDetails.partnerName}
                                    </span>
                                    <div
                                        className="inline-flex items-center gap-1 px-2 py-0.5"
                                        style={{ backgroundColor: '#FFDA57', borderRadius: 24 }}
                                    >
                                        <img src="/images/puzzle/boost/boost.svg" alt="" className="w-3 h-3" />
                                        <span style={{ fontFamily: "'Noto Sans Mono', monospace", fontWeight: 700, fontSize: 9, letterSpacing: '0.05em', color: '#8F7000' }}>
                                            {purchaseDetails.duration}H BOOST
                                        </span>
                                    </div>
                                </div>

                                {/* Period centered */}
                                <div
                                    className="text-center"
                                    style={{
                                        fontFamily: "'Noto Sans Mono', monospace",
                                        fontWeight: 600,
                                        fontSize: 12,
                                        lineHeight: '14px',
                                        color: '#8F7000',
                                    }}
                                >
                                    {purchaseDetails.startDate} &gt; {purchaseDetails.endDate}
                                </div>
                            </div>

                            {/* Bottom buttons */}
                            <div className="flex gap-[15px]" style={{ marginTop: 'auto' }}>
                                <button
                                    onClick={() => {
                                        const shareText = `I just boosted $${purchaseDetails.partnerName} with a ${purchaseDetails.duration}H Boost on @ScanQRBase! 🚀⚡`;
                                        const shareUrl = typeof window !== 'undefined' ? window.location.origin + '/puzzle/boost' : 'https://www.qrbase.xyz/puzzle/boost';
                                        const twitterUrl = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                                        window.open(twitterUrl, '_blank');
                                    }}
                                    style={{
                                        flex: 1,
                                        height: 48,
                                        borderRadius: 8,
                                        paddingTop: 10,
                                        paddingBottom: 10,
                                        paddingLeft: 16,
                                        paddingRight: 16,
                                        backgroundColor: '#0052FF1A',
                                        color: '#0052FF',
                                        fontFamily: "'Noto Sans Mono', monospace",
                                        fontWeight: 700,
                                        fontSize: 14,
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                    }}
                                >
                                    <XIcon size={14} />
                                    X.com
                                </button>
                                <button
                                    onClick={() => {
                                        const shareText = `I just boosted $${purchaseDetails.partnerName} with a ${purchaseDetails.duration}H Boost on @scanqrbase.eth! 🚀⚡`;
                                        const referralLink = 'https://farcaster.xyz/miniapps/pSTSE9GDxQA7/qrbase?path=/puzzle/boost';
                                        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.qrbase.xyz';
                                        const boostShareImage = `${baseUrl}/images/puzzle/share/Boost%20Share%203.jpg`;
                                        const warpcastUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(referralLink)}&embeds[]=${encodeURIComponent(boostShareImage)}`;
                                        window.open(warpcastUrl, '_blank');
                                    }}
                                    style={{
                                        flex: 1,
                                        height: 48,
                                        borderRadius: 8,
                                        paddingTop: 10,
                                        paddingBottom: 10,
                                        paddingLeft: 16,
                                        paddingRight: 16,
                                        backgroundColor: '#0052FF1A',
                                        color: '#0052FF',
                                        fontFamily: "'Noto Sans Mono', monospace",
                                        fontWeight: 700,
                                        fontSize: 14,
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                    }}
                                >
                                    <WarpcastIcon size={16} />
                                    Farcaster
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ThemeProvider>
    );
}
