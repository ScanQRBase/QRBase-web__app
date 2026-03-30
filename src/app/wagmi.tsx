'use client';

import { useMemo } from 'react';
import { http, fallback, createConfig as createVanillaConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { NEXT_PUBLIC_WC_PROJECT_ID } from './config';
import { farcasterFrame } from '@farcaster/miniapp-wagmi-connector';
import { baseAccount } from 'wagmi/connectors';
import { createConfig as createPrivyConfig } from '@privy-io/wagmi';

// Moralis RPC fallback transport (site1 primary, site2 backup)
const moralisTransport = fallback([
  http(process.env.NEXT_PUBLIC_RPC_SITE1_URL),
  http(process.env.NEXT_PUBLIC_RPC_SITE2_URL),
]);

// Only import RainbowKit connectors lazily — importing them at the top level
// triggers WalletConnect API calls that violate mini-app CSP.
let _rainbowKitConnectors: any = null;

function getRainbowKitConnectors(projectId: string) {
  if (_rainbowKitConnectors) return _rainbowKitConnectors;

  // These imports are safe in a normal browser context
  const { connectorsForWallets } = require('@rainbow-me/rainbowkit');
  const {
    coinbaseWallet,
    metaMaskWallet,
    rainbowWallet,
    walletConnectWallet,
  } = require('@rainbow-me/rainbowkit/wallets');

  _rainbowKitConnectors = connectorsForWallets(
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

  return _rainbowKitConnectors;
}

export function useWagmiConfig(isMiniApp: boolean = false) {
  const projectId = NEXT_PUBLIC_WC_PROJECT_ID ?? '';
  if (!projectId) {
    throw new Error('Set NEXT_PUBLIC_WC_PROJECT_ID in your env to enable WalletConnect.');
  }

  return useMemo(() => {
    // ═══════════════════════════════════════════════════════════════════
    // FARCASTER PATH: Use vanilla wagmi createConfig
    //
    // WHY: Privy's createConfig STRIPS all non-mock connectors:
    //   connectors: r.connectors?.filter(e => "mock" === e.type)
    // And Privy's WagmiProvider injects MetaMask via useSyncPrivyWallets.
    //
    // By using vanilla wagmi createConfig, farcasterFrame() is preserved
    // and no injected wallets are added.
    // ═══════════════════════════════════════════════════════════════════
    if (isMiniApp) {
      return createVanillaConfig({
        chains: [base],
        connectors: [
          farcasterFrame(),
          baseAccount({
            appName: 'QRBase',
            appLogoUrl: 'https://www.qrbase.xyz/logo-first.png',
          }),
        ],
        multiInjectedProviderDiscovery: false,
        // CRITICAL: Disable storage so wagmi does NOT rehydrate a previously-connected
        // MetaMask/injected connector from localStorage. Without this, zustand/persist
        // restores the old web-session connector (io.metamask) into the connector list.
        storage: null,
        ssr: true,
        transports: {
          [base.id]: moralisTransport,
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // WEB PATH: Use Privy's createConfig (unchanged)
    //
    // Privy manages wallet connections via useSyncPrivyWallets.
    // RainbowKit connectors are passed for the wallet modal UI but
    // Privy strips them internally — Privy handles wallet injection.
    // ═══════════════════════════════════════════════════════════════════
    try {
      const rainbowKitConnectors = getRainbowKitConnectors(projectId);

      return createPrivyConfig({
        chains: [base],
        connectors: [
          ...rainbowKitConnectors,
        ],
        multiInjectedProviderDiscovery: false,
        ssr: true,
        transports: {
          [base.id]: moralisTransport,
        },
      });
    } catch (e) {
      console.warn('RainbowKit failed to load, falling back to base config:', e);
      return createPrivyConfig({
        chains: [base],
        connectors: [],
        multiInjectedProviderDiscovery: false,
        ssr: true,
        transports: {
          [base.id]: moralisTransport,
        },
      });
    }
  }, [projectId, isMiniApp]);
}
