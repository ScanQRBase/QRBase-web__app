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
import XIcon from "@/src/app/images/svg/socialMedia/XIcon";
import WarpcastIcon from "@/src/app/images/svg/socialMedia/WarpcastIcon";

// ── Types ──────────────────────────────────────
interface TaskType {
    task_type: string;
    platform: 'x' | 'farcaster';
    label: string;
    default_price: number;
    duration_hours: number;
    link_pattern: string;
    actions_bundled: string;
}

// ── Payment constants ──────────────────────────
const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as Address;
const ADMIN_WALLET = (process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT_GAME_ADDRESS || '') as Address;

const ERC20_TRANSFER_ABI = [{
    name: 'transfer', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
}] as const;

const ERC20_BALANCE_ABI = [{
    name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
}] as const;

const basePublicClient = createPublicClient({
    chain: base,
    transport: fallback([
        http(process.env.NEXT_PUBLIC_RPC_SITE1_URL),
        http(process.env.NEXT_PUBLIC_RPC_SITE2_URL),
    ]),
});

async function getTokenBalance(tokenAddress: Address, walletAddress: string): Promise<bigint> {
    try {
        return await basePublicClient.readContract({
            address: tokenAddress,
            abi: ERC20_BALANCE_ABI,
            functionName: 'balanceOf',
            args: [walletAddress as Address],
        });
    } catch {
        return BigInt(0);
    }
}

// ── Component ──────────────────────────────────
export default function CreateTaskPage() {
    const { user } = usePrivy();
    const gameUserId = user ? getUserIdFromPrivyUser(user) : null;
    const { address: connectedAddress, isConnected: isWalletConnected } = useAccount();
    const { sendTransactionAsync } = useSendTransaction();
    const { switchChainAsync } = useSwitchChain();
    const { connect, connectors } = useConnect();
    const { isFarcasterApp, sdkAddress } = usePuzzleData();
    const effectiveAddress = isFarcasterApp ? (sdkAddress || connectedAddress) : connectedAddress;

    // State
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(true);
    const [selectedPlatform, setSelectedPlatform] = useState<'x' | 'farcaster'>('x');
    const [selectedType, setSelectedType] = useState<string>('');
    const [targetLink, setTargetLink] = useState('');
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<{ taskId: string; label: string } | null>(null);
    const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
    const [insufficientInfo, setInsufficientInfo] = useState<{ required: string; balance: string; wallet: string } | null>(null);

    // Auto-connect Farcaster wallet (same pattern as boost/page.tsx)
    useEffect(() => {
        if (!isFarcasterApp || isWalletConnected) return;
        let retryCount = 0;
        let cancelled = false;
        let timeoutId: ReturnType<typeof setTimeout>;

        const tryConnect = async () => {
            if (cancelled) return;
            const fcConnector = connectors.find(c => c.id === 'farcaster');
            if (!fcConnector) {
                if (retryCount < 5) { retryCount++; timeoutId = setTimeout(tryConnect, retryCount * 1000); }
                return;
            }
            try {
                await connect({ connector: fcConnector });
            } catch {
                if (!cancelled && retryCount < 5) { retryCount++; timeoutId = setTimeout(tryConnect, retryCount * 1000); }
            }
        };
        timeoutId = setTimeout(tryConnect, 500);
        return () => { cancelled = true; clearTimeout(timeoutId); };
    }, [isFarcasterApp, isWalletConnected, connectors, connect]);

    // Fetch task types
    useEffect(() => {
        async function fetchTypes() {
            try {
                const res = await fetch('/api/game/tasks/types');
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    setTaskTypes(json.data);
                    // Auto-select first type for current platform
                    const first = json.data.find((t: TaskType) => t.platform === selectedPlatform);
                    if (first) setSelectedType(first.task_type);
                }
            } catch (err) {
                console.error('[CreateTask] Failed to fetch types:', err);
            } finally {
                setIsLoadingTypes(false);
            }
        }
        fetchTypes();
    }, []);

    // When platform changes, auto-select first type
    useEffect(() => {
        const first = taskTypes.find(t => t.platform === selectedPlatform);
        if (first) setSelectedType(first.task_type);
        setTargetLink('');
    }, [selectedPlatform, taskTypes]);

    const selectedTypeData = taskTypes.find(t => t.task_type === selectedType);
    const filteredTypes = taskTypes.filter(t => t.platform === selectedPlatform);

    // ── Client-side link validators (must match worker) ──
    const validateLink = (taskType: string, url: string): boolean => {
        try {
            const u = new URL(url.startsWith('http') ? url : `https://${url}`);
            switch (taskType) {
                case 'x_follow':
                    return (u.hostname === 'x.com' || u.hostname === 'www.x.com' || u.hostname === 'twitter.com')
                        && u.pathname.split('/').filter(Boolean).length === 1
                        && !u.pathname.includes('/status/');
                case 'x_post_engage':
                    return (u.hostname === 'x.com' || u.hostname === 'www.x.com' || u.hostname === 'twitter.com')
                        && u.pathname.includes('/status/')
                        && /\/status\/\d+/.test(u.pathname);
                case 'fc_follow':
                    return ['farcaster.xyz', 'www.farcaster.xyz'].includes(u.hostname)
                        && u.pathname.split('/').filter(Boolean).length === 1;
                case 'fc_cast_engage': {
                    const segs = u.pathname.split('/').filter(Boolean);
                    return ['farcaster.xyz', 'www.farcaster.xyz'].includes(u.hostname)
                        && segs.length === 2 && segs[1].startsWith('0x');
                }
                case 'fc_miniapp_engage': {
                    if (u.protocol !== 'https:') return false;
                    if (['x.com', 'twitter.com'].includes(u.hostname)) return false;
                    if (['farcaster.xyz', 'www.farcaster.xyz'].includes(u.hostname)) {
                        return u.pathname.startsWith('/miniapps/');
                    }
                    return true;
                }
                default:
                    return true;
            }
        } catch { return false; }
    };

    const isLinkValid = selectedType && targetLink ? validateLink(selectedType, targetLink) : false;

    // ── Purchase handler ────────────────────────
    const handlePurchase = async () => {
        if (!selectedTypeData || !targetLink || !gameUserId) return;

        // Validate link BEFORE payment
        if (!validateLink(selectedType, targetLink)) {
            setError(`Invalid link format for ${selectedTypeData.label}. Please check the URL format.`);
            return;
        }

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
            // USDC amount (6 decimals)
            const usdcAmount = BigInt(Math.round(selectedTypeData.default_price * 1_000_000));

            // Pre-check balance
            if (effectiveAddress) {
                const balance = await getTokenBalance(USDC_ADDRESS, effectiveAddress);
                if (balance < usdcAmount) {
                    setIsPurchasing(false);
                    setInsufficientInfo({
                        required: formatUnits(usdcAmount, 6),
                        balance: formatUnits(balance, 6),
                        wallet: effectiveAddress,
                    });
                    setShowInsufficientBalance(true);
                    return;
                }
            }

            // Encode transfer
            const callData = encodeFunctionData({
                abi: ERC20_TRANSFER_ABI,
                functionName: 'transfer',
                args: [ADMIN_WALLET, usdcAmount],
            });

            let txHash: string;

            if (isFarcasterApp) {
                const provider = await sdk.wallet.getEthereumProvider();
                if (!provider) throw new Error('Farcaster wallet provider not available');
                txHash = await (provider as any).request({
                    method: 'eth_sendTransaction',
                    params: [{ from: effectiveAddress, to: USDC_ADDRESS, data: appendBuilderSuffix(callData), value: '0x0' }],
                });
            } else {
                await switchChainAsync({ chainId: base.id });
                txHash = await sendTransactionAsync({
                    chainId: base.id,
                    to: USDC_ADDRESS,
                    data: appendBuilderSuffix(callData),
                    value: BigInt(0),
                });
            }

            if (!txHash) throw new Error('Transaction was rejected');

            // Send to API
            const res = await fetch('/api/game/tasks/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: gameUserId,
                    taskType: selectedType,
                    targetLink,
                    txHash,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setSuccess({ taskId: data.data.taskId, label: data.data.label });
            } else {
                setError(data.error || 'Failed to create task');
            }
        } catch (err: any) {
            const msg = err?.message || '';
            if (msg.includes('rejected') || msg.includes('denied')) {
                setError('Transaction cancelled.');
            } else if (msg.includes('exceeds balance') || msg.includes('insufficient') || msg.includes('Insufficient')) {
                setError('Insufficient USDC balance.');
            } else {
                setError(`Transaction failed: ${msg || 'Unknown error'}`);
            }
        } finally {
            setIsPurchasing(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col font-sansMono bg-[#F7F8FD] dark:bg-gray-900 pb-28">
            <QrBaseBanner round="1" isCompleted={false} />
            <QrBaseNavbar />

            <main className="flex-1 pt-28 px-4 max-w-lg mx-auto w-full">
                {/* ── Header ── */}
                <h1 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                    Create a Task
                </h1>
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">
                    Promote your link and let the QRbase community engage with it
                </p>

                {/* ── Success Popup Modal ── */}
                {success && (
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
                                onClick={() => {
                                    setSuccess(null);
                                    setTargetLink('');
                                }}
                                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                ✕
                            </button>

                            {/* Icon */}
                            <Image
                                src="/images/puzzle/boostConfirm.svg"
                                alt="success"
                                width={56}
                                height={56}
                                className="mb-4"
                            />

                            {/* Title */}
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Congratulations!
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                                Your Task to{' '}
                                <span className="font-bold text-blue-600">{success.label}</span>{' '}
                                have been Created.
                            </p>

                            {/* Got It button */}
                            <a
                                href="/puzzle/tasks"
                                className="w-full h-[48px] bg-[#0052FF] hover:opacity-90 text-white font-bold rounded-xl text-center text-sm shadow-md transition-all flex items-center justify-center"
                            >
                                Got It
                            </a>
                        </div>
                    </div>
                )}

                {/* ── Form ── */}
                {!success && (
                    <>
                        {/* ── Platform Selector ── */}
                        <div className="flex gap-2 mb-5">
                            <button
                                onClick={() => setSelectedPlatform('x')}
                                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${selectedPlatform === 'x'
                                    ? 'bg-black text-white shadow-md'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                <XIcon size={12} color={selectedPlatform === 'x' ? '#FFFFFF' : '#006AF1'} /> Twitter
                            </button>
                            <button
                                onClick={() => setSelectedPlatform('farcaster')}
                                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${selectedPlatform === 'farcaster'
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                <WarpcastIcon size={14} color={selectedPlatform === 'farcaster' ? '#FFFFFF' : '#0052FF'} /> Farcaster
                            </button>
                        </div>

                        {/* ── Task Type Selector ── */}
                        <div className="mb-5">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Task Type
                            </label>
                            {isLoadingTypes ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-2">
                                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                                                    <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-20" />
                                                </div>
                                                <div className="w-14 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredTypes.map(tt => (
                                        <button
                                            key={tt.task_type}
                                            onClick={() => setSelectedType(tt.task_type)}
                                            className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${selectedType === tt.task_type
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                                }`}
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {tt.label}
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    Actions: {tt.actions_bundled}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-bold text-blue-600">${tt.default_price}</p>
                                                <p className="text-[10px] text-gray-400">7 Days</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Link Input ── */}
                        {selectedTypeData && (
                            <div className="mb-5">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    Target Link
                                </label>
                                <input
                                    type="url"
                                    value={targetLink}
                                    onChange={(e) => setTargetLink(e.target.value)}
                                    placeholder={selectedTypeData.link_pattern}
                                    className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    {targetLink ? (
                                        isLinkValid ? (
                                            <span className="text-[11px] text-green-500 font-semibold">✓ Valid link format</span>
                                        ) : (
                                            <span className="text-[11px] text-red-500 font-semibold">✗ Invalid format — expected: {selectedTypeData.link_pattern}</span>
                                        )
                                    ) : (
                                        <span className="text-[11px] text-gray-400">Format: {selectedTypeData.link_pattern}</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Summary ── */}
                        {selectedTypeData && targetLink && isLinkValid && (
                            <div className="mb-5 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Duration</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">7 Days</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 font-bold">Price</span>
                                        <span className="font-bold text-blue-600">${selectedTypeData.default_price} USDC</span>
                                    </div>
                                    <button
                                        onClick={handlePurchase}
                                        disabled={!selectedTypeData || !targetLink || !isLinkValid || isPurchasing || !gameUserId}
                                        className="w-full h-[48px] bg-[#0052FF] text-white font-bold rounded-2xl shadow-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isPurchasing ? (
                                            <>
                                                <div className="w-5 h-5 border border-white border-t-transparent rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            `Pay $${selectedTypeData?.default_price || '—'} USDC & Create Task`
                                        )}
                                    </button>
                                </div>
                                {/* ── Purchase Button ── */}

                            </div>
                        )}

                        {/* ── Error ── */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}



                        <p className="text-center text-xs text-gray-400 mt-3">
                            Payment is in USDC on Base. Task goes live immediately.
                        </p>

                        {/* ── Back link ── */}
                        <div className="text-center mt-4">
                            <a href="/puzzle/tasks" className="text-sm text-blue-500 hover:underline">
                                ← Back to Task List
                            </a>
                        </div>
                    </>
                )}
            </main>

            <PuzzleFooter />

            {/* ── Insufficient Balance Modal ── */}
            {showInsufficientBalance && insufficientInfo && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="relative bg-white dark:bg-gray-800 shadow-xl p-6 w-[340px] rounded-2xl mx-4">
                        <button
                            onClick={() => setShowInsufficientBalance(false)}
                            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500"
                        >
                            ✕
                        </button>
                        <div className="flex flex-col items-center text-center">
                            <div className="text-sm text-gray-500 mb-1 font-mono">Your wallet</div>
                            <div className="text-xs text-gray-700 dark:text-gray-300 mb-3 font-mono">
                                {insufficientInfo.wallet.slice(0, 6)}...{insufficientInfo.wallet.slice(-4)}
                            </div>
                            <div className="flex items-center justify-between w-full mb-3">
                                <span className="text-xs text-gray-500">Balance</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                                    {parseFloat(insufficientInfo.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
                                </span>
                            </div>
                            <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 mb-4">
                                <p className="text-red-600 font-bold text-sm mb-1">Insufficient balance</p>
                                <p className="text-red-400 text-xs mt-1 font-mono">
                                    Required: ${parseFloat(insufficientInfo.required).toLocaleString()} USDC
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(insufficientInfo.wallet);
                                }}
                                className="w-full h-[48px] bg-[#0052FF] text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-sm"
                            >
                                Copy address to fund
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
