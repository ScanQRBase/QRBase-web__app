'use client';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { base } from 'viem/chains';
import { WagmiProvider } from 'wagmi';
import { NEXT_PUBLIC_ONCHAINKIT_API_KEY } from '@/src/app/config';
import { wagmiConfig } from '@/src/app/wagmi';

type Props = { children: ReactNode };

const queryClient = new QueryClient();

function QrBaseProviders({ children }: Props) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <MiniKitProvider
          apiKey={NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base as any}
          config={{ appearance: { theme: 'base' , mode:'light' } }}
          projectId = {process.env.NEXT_PUBLIC_PROJECT_ID}
        >
          {children}
        </MiniKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default QrBaseProviders;
