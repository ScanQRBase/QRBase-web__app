'use client';

import { useEffect, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';

/**
 * Detects when an X/Twitter user needs to link a wallet and
 * manages the wallet popup state.
 *
 * Previously duplicated in QrBasePuzzle.tsx and ScanModeMain.tsx.
 */
export function useXWalletPrompt() {
    const { authenticated, user, linkWallet } = usePrivy();

    const needsWalletConnection = useMemo(() => {
        return authenticated && !!user?.twitter && !user?.wallet;
    }, [authenticated, user?.twitter, user?.wallet]);

    const handleLinkWallet = async () => {
        try {
            await linkWallet();
        } catch (error) {
            console.error('Error connecting wallet:', error);
        }
    };

    return {
        needsWalletConnection,
        handleLinkWallet,
    };
}
