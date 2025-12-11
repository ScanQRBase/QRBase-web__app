'use client';

import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { base } from 'viem/chains';
import { NEXT_PUBLIC_ONCHAINKIT_API_KEY, NEXT_PUBLIC_PRIVY_APP_ID, NEXT_PUBLIC_PRIVY_APP_X_ID } from './config';
import { WagmiProvider } from '@privy-io/wagmi';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useWagmiConfig } from './wagmi';
import { sdk } from '@farcaster/miniapp-sdk';



import { useEffect, useState } from 'react';

type Props = { children: ReactNode };

const queryClient = new QueryClient();



function PrivyWrapper({ children }: { children: ReactNode }) {
  const [isFarcaster, setIsFarcaster] = useState<boolean | null>(null);
  const [appId, setAppId] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      const isMiniApp = await sdk.isInMiniApp();

      setIsFarcaster(isMiniApp);

      if (isMiniApp) {
        setAppId(NEXT_PUBLIC_PRIVY_APP_ID as string);       // For Farcaster MiniApp
      } else {
        setAppId(NEXT_PUBLIC_PRIVY_APP_X_ID as string);     // For Twitter or normal web
      }
    };

    init();
  }, []);

  // ⛔ Don't render PrivyProvider until detection is ready
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
          walletList: ["coinbase_wallet", "wallet_connect_qr", "metamask"],
        },
        embeddedWallets: {
          showWalletUIs: false,
          ethereum: { createOnLogin: "off" },
          solana: { createOnLogin: "off" },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}


function QrBaseProviders({ children }: Props) {
  const wagmiConfig = useWagmiConfig();

  return (
    <PrivyWrapper>
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
              <RainbowKitProvider modalSize="compact">
                {children}
              </RainbowKitProvider>
            </MiniKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
    </PrivyWrapper>
  );
}

export default QrBaseProviders;