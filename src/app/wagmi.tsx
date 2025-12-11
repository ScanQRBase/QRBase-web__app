'use client';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  coinbaseWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet
} from '@rainbow-me/rainbowkit/wallets';
import { useMemo } from 'react';
import { http } from 'wagmi';
import { base } from 'wagmi/chains';
import { NEXT_PUBLIC_WC_PROJECT_ID } from './config';
import { farcasterFrame } from '@farcaster/miniapp-wagmi-connector';
import { createConfig as createPrivyConfig } from '@privy-io/wagmi';

export function useWagmiConfig() {
  const projectId = NEXT_PUBLIC_WC_PROJECT_ID ?? '';
  if (!projectId) {
    throw new Error('Set NEXT_PUBLIC_WC_PROJECT_ID in your env to enable WalletConnect.');
  }

  return useMemo(() => {
    const rainbowKitConnectors = connectorsForWallets(
      [
        {
          groupName: 'Recommended Wallet',
          wallets: [coinbaseWallet],
        },
        {
          groupName: 'Other Wallets',
          wallets: [rainbowWallet, metaMaskWallet, walletConnectWallet],
        },
      ],
      {
        appName: 'QRBase',
        projectId,
      },
    );

    // Combine RainbowKit connectors with farcasterFrame
    const connectors = [
      ...rainbowKitConnectors, // Spread RainbowKit connectors
      farcasterFrame(), // Add Farcaster connector for Mini App
    ];

    return createPrivyConfig({
      chains: [base],
      connectors,                        // ✅ only WalletConnect passed
      multiInjectedProviderDiscovery: false, // 🚫 disables MetaMask, Coinbase, etc.
      ssr: true,
      transports: {
        [base.id]: http(),
      },
    });
  }, [projectId]);
}
