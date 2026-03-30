'use client';

import { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { getNeynarUser } from '@/src/app/utils/encrypt_decrypt';

interface UseWalletAddressOptions {
    /** If running in a Farcaster mini-app, supply the SDK address directly */
    farcasterSdkAddress?: string | null;
    /** Whether this is a Farcaster mini-app environment */
    isFarcasterApp?: boolean;
}

/**
 * Resolves the user's wallet address across all login environments.
 *
 * Priority order:
 * 1. Farcaster SDK address (mini-app only — prevents wrong address from wagmi)
 * 2. wagmi connected address (for web users, but NOT for X users without a Privy-linked wallet)
 * 3. Neynar lookup by FID (Farcaster web login fallback)
 * 4. Privy linked wallet (only if actually linked in Privy)
 *
 * Previously duplicated in QrBasePuzzle.tsx (lines 314-366) and ScanModeMain.tsx (lines 303-333).
 */
export function useWalletAddress({
    farcasterSdkAddress = null,
    isFarcasterApp = false,
}: UseWalletAddressOptions = {}) {
    const { authenticated, user } = usePrivy();
    const { wallets } = useWallets();
    const { address: connectedAddress } = useAccount();
    const [address, setAddress] = useState<string | null>(null);
    const [isResolved, setIsResolved] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function resolveAddress() {
            // ── Path 1: Farcaster SDK address (mini-app) ──
            if (isFarcasterApp) {
                if (farcasterSdkAddress) {
                    setAddress(farcasterSdkAddress);
                    setIsResolved(true);
                }
                return;
            }

            // ── Guard: X/Twitter user without linked wallet ──
            const isXUser = authenticated && user?.twitter && !user?.farcaster;
            const hasPrivyWallet = !!user?.wallet;

            // X user with no linked wallet → resolve immediately (no address)
            // so the page shows the "Connect Wallet" prompt instead of skeleton
            if (isXUser && !hasPrivyWallet) {
                setAddress(null); // Clear stale address from previously-linked wallet
                setIsResolved(true);
                return;
            }

            // ── Path 2: wagmi connected address ──
            if (connectedAddress && connectedAddress !== address && (!isXUser || hasPrivyWallet)) {
                setAddress(connectedAddress);
                setIsResolved(true);
                return;
            }

            // ── Path 3: Neynar fallback (web Farcaster login) ──
            if (user?.farcaster?.fid && !address) {
                setLoading(true);
                setError(null);
                try {
                    const data = await getNeynarUser(`${user.farcaster.fid}`);
                    setAddress(data.address ?? null);
                    setIsResolved(true);
                } catch (err: any) {
                    console.error('Error fetching Farcaster address:', err);
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            }

            // ── Path 4: Privy linked wallet ──
            if (!address && wallets.length > 0 && hasPrivyWallet) {
                const linkedWallet = wallets.find((w) => w.linked);
                if (linkedWallet?.address) {
                    setAddress(linkedWallet.address);
                    setIsResolved(true);
                }
            }
        }

        resolveAddress();
    }, [
        isFarcasterApp,
        farcasterSdkAddress,
        connectedAddress,
        user?.farcaster?.fid,
        wallets,
        address,
        authenticated,
        user?.twitter,
        user?.wallet,
    ]);

    // Clear address when user disconnects
    useEffect(() => {
        if (!authenticated) {
            setAddress(null);
            setIsResolved(false);
        }
    }, [authenticated]);

    // Safety timeout: prevent infinite skeleton if auth state gets stuck
    useEffect(() => {
        if (isResolved) return;
        const timer = setTimeout(() => {
            console.warn('[useWalletAddress] Safety timeout (3s) — forcing isResolved to prevent infinite skeleton');
            setIsResolved(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, [isResolved]);

    return { address, isResolved, loading, error };
}
