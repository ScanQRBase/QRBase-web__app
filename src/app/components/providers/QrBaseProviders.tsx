'use client';

import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { base } from 'viem/chains';
import { NEXT_PUBLIC_ONCHAINKIT_API_KEY, NEXT_PUBLIC_PRIVY_APP_ID, NEXT_PUBLIC_PRIVY_APP_X_ID } from '../../config';
import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi';
import { WagmiProvider as VanillaWagmiProvider } from 'wagmi';
import { PrivyProvider, dataSuffix } from '@privy-io/react-auth';
import { BUILDER_DATA_SUFFIX } from '../../lib/builder-code';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useWagmiConfig } from '../../wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { ThirdwebProvider } from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';

import { useEffect, useState } from 'react';

type Props = { children: ReactNode };

const queryClient = new QueryClient();


function QrBaseProviders({ children }: Props) {
  const [isFarcaster, setIsFarcaster] = useState<boolean | null>(null);
  const [appId, setAppId] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      // Primary detection via SDK
      let isMiniApp = false;
      try {
        isMiniApp = await sdk.isInMiniApp();
      } catch {
        // SDK detection failed
      }

      // Fallback: if SDK says false, double-check environment signals
      // The SDK short-circuits to false if window === window.parent && !ReactNativeWebView
      // but the Promise.race might timeout. Check the raw signals ourselves.
      if (!isMiniApp && typeof window !== 'undefined') {
        const inIframe = window !== window.parent;
        const inReactNative = !!(window as any).ReactNativeWebView;
        if (inIframe || inReactNative) {
          // We're in an iframe or RN WebView — likely Farcaster.
          // Try SDK detection again with a longer timeout.
          try {
            isMiniApp = await (sdk.isInMiniApp as (timeoutMs?: number) => Promise<boolean>)(3000);
          } catch {
            // Still treat as mini-app if we're in an iframe
            isMiniApp = inIframe || inReactNative;
          }
        }
      }

      console.log('[QrBase] Farcaster detection:', isMiniApp);
      setIsFarcaster(isMiniApp);

      if (isMiniApp) {
        // Dismiss the Farcaster/Base splash screen immediately
        sdk.actions.ready();
        setAppId(NEXT_PUBLIC_PRIVY_APP_ID as string);       // For Farcaster MiniApp
      } else {
        setAppId(NEXT_PUBLIC_PRIVY_APP_X_ID as string);     // For Twitter or normal web
      }
    };

    init();
  }, []);

  // ⛔ Don't render until detection is ready
  if (isFarcaster === null || appId === "") return null;

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: isFarcaster ? ["farcaster"] : ["twitter"],
        appearance: {
          accentColor: "#0052FF",
          theme: "#F5F5F5",
          logo: "/logo-first.png",
          walletChainType: "ethereum-only",
          // Remove wallet_connect_qr inside mini-apps to avoid CSP violations
          walletList: isFarcaster
            ? ["coinbase_wallet"]
            : ["coinbase_wallet", "wallet_connect_qr", "metamask"],
        },
        embeddedWallets: {
          showWalletUIs: false,
          ethereum: { createOnLogin: "off" },
          solana: { createOnLogin: "off" },
        },
        plugins: [dataSuffix(BUILDER_DATA_SUFFIX)],
      }}
    >
      <InnerProviders isMiniApp={isFarcaster}>
        {children}
      </InnerProviders>
    </PrivyProvider>
  );
}

/** Inner providers that depend on the mini-app detection result */
function InnerProviders({ children, isMiniApp }: { children: ReactNode; isMiniApp: boolean }) {
  const wagmiConfig = useWagmiConfig(isMiniApp);

  // ═══════════════════════════════════════════════════════════════════
  // FARCASTER PATH: Use vanilla wagmi WagmiProvider
  //
  // WHY: Privy's WagmiProvider wraps children with PrivyWagmiConnector
  // which calls useSyncPrivyWallets(). That hook creates injected()
  // connectors for every Privy-managed wallet (MetaMask, etc.) and
  // calls reconnect(), auto-connecting MetaMask inside Farcaster.
  //
  // By using vanilla WagmiProvider, ONLY the farcasterFrame() connector
  // is available. MetaMask is completely excluded.
  // ═══════════════════════════════════════════════════════════════════
  if (isMiniApp) {
    return (
      <QueryClientProvider client={queryClient}>
        <VanillaWagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          <MiniKitProvider
            apiKey={NEXT_PUBLIC_ONCHAINKIT_API_KEY}
            chain={base as any}
            config={{
              appearance: { theme: 'base', mode: 'light' },
              wallet: {
                display: 'modal',
                termsUrl: '#',
                privacyUrl: '#',
              },
            }}
            projectId={process.env.NEXT_PUBLIC_PROJECT_ID}
          >
            {children}
          </MiniKitProvider>
        </VanillaWagmiProvider>
      </QueryClientProvider>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // WEB PATH: Use Privy's WagmiProvider (unchanged)
  //
  // Privy manages wallet connections via useSyncPrivyWallets.
  // RainbowKit provides the wallet selection modal.
  // MetaMask, Coinbase Wallet, WalletConnect all work as before.
  // ═══════════════════════════════════════════════════════════════════
  return (
    <QueryClientProvider client={queryClient}>
      <PrivyWagmiProvider config={wagmiConfig}>
        <MiniKitProvider
          apiKey={NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base as any}
          config={{
            appearance: { theme: 'base', mode: 'light' },
            wallet: {
              display: 'modal',
              termsUrl: '#',
              privacyUrl: '#',
            },
          }}
          projectId={process.env.NEXT_PUBLIC_PROJECT_ID}
        >
          <RainbowKitProvider modalSize="compact">
            {children}
          </RainbowKitProvider>
        </MiniKitProvider>
      </PrivyWagmiProvider>
    </QueryClientProvider>
  );
}

export default QrBaseProviders;