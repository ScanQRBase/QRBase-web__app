'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useLoginToMiniApp } from '@privy-io/react-auth/farcaster';
import { sdk } from '@farcaster/miniapp-sdk';

/**
 * Farcaster mini-app detection and auto-login hook.
 *
 * Consolidates the identical Farcaster login logic previously
 * duplicated in QrBasePuzzle.tsx and ScanModeMain.tsx.
 *
 * Handles:
 * 1. Detecting if running inside a Farcaster mini-app (with fallbacks)
 * 2. Auto-calling sdk.actions.addMiniApp()
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
            // ── Step 1: Detect mini-app environment ──
            let isMiniApp = false;
            try {
                isMiniApp = await sdk.isInMiniApp();
            } catch { /* SDK detection failed */ }

            // Fallback: check raw environment signals (iframe / React Native)
            if (!isMiniApp && typeof window !== 'undefined') {
                const inIframe = window !== window.parent;
                const inReactNative = !!(window as any).ReactNativeWebView;
                if (inIframe || inReactNative) {
                    try {
                        isMiniApp = await (sdk.isInMiniApp as (t?: number) => Promise<boolean>)(3000);
                    } catch {
                        isMiniApp = inIframe || inReactNative;
                    }
                }
            }

            setIsFarcasterApp(isMiniApp);

            // ── Step 2: Register mini-app ──
            if (isMiniApp) {
                try {
                    await sdk.actions.addMiniApp();
                } catch (err) {
                    console.warn('addMiniApp skipped:', (err as any)?.message ?? err);
                }
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
