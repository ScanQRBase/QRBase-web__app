'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { sdk } from '@farcaster/miniapp-sdk';
import { useFarcasterAuth } from '../../hooks/useFarcasterAuth';
import { useWalletAddress } from '../../hooks/useWalletAddress';
import { useXWalletPrompt } from '../../hooks/useXWalletPrompt';
import { useFarcasterWagmiConnect } from '../../hooks/useFarcasterWagmiConnect';

/**
 * Centralised auth state shared across /puzzle and /scanMode.
 *
 * Wraps the 4 shared hooks + MiniKit readiness so that every page
 * gets the same singleton values without re-calling the hooks themselves.
 */
interface AuthContextValue {
    /** Whether we're inside a Farcaster mini-app */
    isFarcasterApp: boolean;
    /** Farcaster SDK wallet address (mini-app only) */
    sdkAddress: string | null;
    /** Resolved wallet address (works across Farcaster / X / web) */
    address: string | null;
    /** Whether the address has finished resolving */
    isAddressResolved: boolean;
    /** True when an X/Twitter user still needs to link a wallet */
    needsWalletConnection: boolean;
    /** Trigger the Privy link-wallet flow for X users */
    handleLinkWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    isFarcasterApp: false,
    sdkAddress: null,
    address: null,
    isAddressResolved: false,
    needsWalletConnection: false,
    handleLinkWallet: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    // ── 1. Farcaster detection + auto-login ──
    const { isFarcasterApp } = useFarcasterAuth();

    // ── 2. Resolve Farcaster SDK address (mini-app only) ──
    const [sdkAddress, setSdkAddress] = useState<string | null>(null);

    useEffect(() => {
        if (!isFarcasterApp || sdkAddress) return;
        (async () => {
            try {
                const provider = sdk.wallet.ethProvider;
                const accounts = (await provider.request({
                    method: 'eth_requestAccounts',
                })) as string[];
                if (accounts?.[0]) {
                    setSdkAddress(accounts[0]);
                }
            } catch (err) {
                console.error('[AuthContext] SDK address error:', err);
            }
        })();
    }, [isFarcasterApp, sdkAddress]);

    // ── 3. Wallet address resolution ──
    const { address, isResolved: isAddressResolved } = useWalletAddress({
        isFarcasterApp,
        farcasterSdkAddress: sdkAddress,
    });

    // ── 4. X-user wallet prompt ──
    const { needsWalletConnection, handleLinkWallet } = useXWalletPrompt();

    // ── 5. Auto-bridge Farcaster wagmi connector ──
    useFarcasterWagmiConnect(isFarcasterApp);

    // ── 6. MiniKit frame readiness ──
    const { setFrameReady, isFrameReady } = useMiniKit();
    useEffect(() => {
        if (!isFrameReady) setFrameReady();
    }, [isFrameReady, setFrameReady]);

    return (
        <AuthContext.Provider
            value={{
                isFarcasterApp,
                sdkAddress,
                address,
                isAddressResolved,
                needsWalletConnection,
                handleLinkWallet,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
