'use client';

import { useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';

/**
 * Auto-connects the Farcaster wagmi connector with retry logic.
 *
 * The farcasterFrame connector sends eth_requestAccounts via postMessage
 * to the parent frame. On Farcaster web, this can fail/timeout if the
 * SDK's postMessage channel isn't fully established yet.
 * Retrying with increasing delays fixes this.
 *
 * Previously duplicated in QrBasePuzzle.tsx and ScanModeMain.tsx.
 *
 * @param isFarcasterApp — whether the current env is a Farcaster mini-app
 */
export function useFarcasterWagmiConnect(isFarcasterApp: boolean) {
    const { isConnected: isWalletConnected } = useAccount();
    const { connect, connectors } = useConnect();

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
                await connect({ connector: fcConnector });
                console.log('[QrBase] ✅ Farcaster wallet connected via wagmi');
            } catch (err) {
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
}
