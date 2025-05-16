'use client';

import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';
import { metaMask } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [base as any],
  connectors: [
    coinbaseWallet({
      appName: 'QRBase',
    }),
    metaMask()
  ],
  ssr: true,
  transports: {
    [base.id]: http(),
  },
});
