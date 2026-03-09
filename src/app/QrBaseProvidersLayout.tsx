'use client';

import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { base } from 'viem/chains';
import { NEXT_PUBLIC_ONCHAINKIT_API_KEY, NEXT_PUBLIC_PRIVY_APP_ID, NEXT_PUBLIC_PRIVY_APP_X_ID } from './config';
import { WagmiProvider } from '@privy-io/wagmi';
import { PrivyProvider } from '@privy-io/react-auth';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useWagmiConfig } from './wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { ThemeProvider } from './components/providers/ThemeProvider';
import { AuthProvider } from './lib/context/AuthContext';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type Props = { children: ReactNode };

const queryClient = new QueryClient();


function QrBaseProviders({ children }: Props) {
  const [isFarcaster, setIsFarcaster] = useState<boolean | null>(null);
  const [appId, setAppId] = useState<string>("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const init = async () => {
      const isMiniApp = await sdk.isInMiniApp();

      setIsFarcaster(isMiniApp);

      if (isMiniApp) {
        // Dismiss the Farcaster/Base splash screen immediately
        sdk.actions.ready();
        setAppId(NEXT_PUBLIC_PRIVY_APP_ID as string);       // For Farcaster MiniApp

        // Handle deep link routing: ?path=/puzzle redirects to /puzzle
        // The middleware may have redirected to /maintenance, so we do client-side nav
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const targetPath = urlParams.get('path');
          if (targetPath && targetPath !== pathname) {
            router.replace(targetPath);
          }
        }
      } else {
        setAppId(NEXT_PUBLIC_PRIVY_APP_X_ID as string);     // For Twitter or normal web
      }
    };

    init();
  }, []);

  // ⛔ Don't render until detection is ready
  if (isFarcaster === null || appId === "") return null;

  return (
    <ThemeProvider>
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
        }}
      >
        <InnerProviders isMiniApp={isFarcaster}>
          {children}
        </InnerProviders>
      </PrivyProvider>
    </ThemeProvider>
  );
}

/** Inner providers that depend on the mini-app detection result */
function InnerProviders({ children, isMiniApp }: { children: ReactNode; isMiniApp: boolean }) {
  // Pass isMiniApp so wagmi skips WalletConnect connectors inside mini-apps (avoids CSP errors)
  const wagmiConfig = useWagmiConfig(isMiniApp);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
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
          <AuthProvider>
            {isMiniApp ? (
              children
            ) : (
              <RainbowKitProvider modalSize="compact">
                {children}
              </RainbowKitProvider>
            )}
          </AuthProvider>
        </MiniKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default QrBaseProviders;