'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useLoginToMiniApp } from '@privy-io/react-auth/farcaster';
import { sdk } from '@farcaster/miniapp-sdk';
import { getCachedIsFarcaster } from '../QrBaseProvidersLayout';

/**
 * Farcaster mini-app detection and auto-login hook.
 *
 * Consolidates the identical Farcaster login logic previously
 * duplicated in QrBasePuzzle.tsx and ScanModeMain.tsx.
 *
 * Handles:
 * 1. Detecting if running inside a Farcaster mini-app (uses cached result)
 * 2. Fire-and-forget sdk.actions.addMiniApp()
 * 3. Auto-login via signIn + loginToMiniApp if not authenticated
 *
 * @returns { isFarcasterApp } — whether the current env is a Farcaster mini-app
 */
export function useFarcasterAuth() {
    const { ready, authenticated } = usePrivy();
    const { initLoginToMiniApp, loginToMiniApp } = useLoginToMiniApp();
    const [isFarcasterApp, setIsFarcasterApp] = useState(false);

    useEffect(() => {
        const init = async () => {
            // ── Step 1: Use cached detection from QrBaseProvidersLayout ──
            // This avoids a duplicate sdk.isInMiniApp() call (~300ms-1s saved)
            let isMiniApp = getCachedIsFarcaster();

            // Fallback: if cache not ready yet (shouldn't happen, but defensive)
            if (isMiniApp === null) {
                try {
                    isMiniApp = await sdk.isInMiniApp();
                } catch {
                    isMiniApp = false;
                }
            }

            setIsFarcasterApp(isMiniApp);

            // ── Step 2: Register mini-app (fire-and-forget, no need to await) ──
            if (isMiniApp) {
                sdk.actions.addMiniApp().catch((err: any) => {
                    console.warn('addMiniApp skipped:', err?.message ?? err);
                });
            }

            // ── Step 3: Auto-login if not authenticated ──
            if (ready && !authenticated) {
                try {
                    if (!isMiniApp) return; // Only auto-login in mini-app

                    const { nonce } = await initLoginToMiniApp();
                    const result = await sdk.actions.signIn({ nonce });
                    await loginToMiniApp({
                        message: result.message,
                        signature: result.signature,
                    });
                } catch (err) {
                    console.error('❌ Farcaster login failed:', err);
                }
            }
        };

        init();
    }, [ready, authenticated]);

    return { isFarcasterApp };
}

