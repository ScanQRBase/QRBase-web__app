'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { sdk } from '@farcaster/miniapp-sdk';
import { useAuth } from './lib/context/AuthContext';

export default function Page() {
  const { ready, authenticated, user } = usePrivy();
  const { isFarcasterApp } = useAuth();
  const router = useRouter();
  const API_KEY_CLOUD = process.env.NEXT_PUBLIC_API_KEY ?? '';
  const notificationSent = useRef(false);

  // Helper function to create deep link URLs for Farcaster mini app
  const createMiniAppUrl = (path: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://www.qrbase.xyz';
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}?path=/${cleanPath}`;
  };

  // Handle deep link routing, welcome notification, and maintenance redirect
  useEffect(() => {
    const init = async () => {
      // Signal frame readiness to Farcaster
      try { sdk.actions.ready(); } catch { /* not in mini-app */ }

      // Handle deep link routing from notifications
      if (typeof window !== 'undefined' && isFarcasterApp) {
        const urlParams = new URLSearchParams(window.location.search);
        const targetPath = urlParams.get('path');
        if (targetPath) {
          router.push(targetPath);
          return;
        }
      }

      // Non-mini-app web users → maintenance
      if (ready && !authenticated && !isFarcasterApp) {
        router.replace('/maintenance');
        return;
      }

      // Send welcome notification on first Farcaster login (once)
      if (authenticated && user?.farcaster?.fid && !notificationSent.current) {
        notificationSent.current = true;
        try {
          await fetch('/api/sendNotification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': API_KEY_CLOUD },
            body: JSON.stringify({
              fid: user.farcaster.fid,
              title: 'Welcome to QRbase 👋',
              body: 'Thanks for signing in! Explore our mini app and earn rewards.',
              targetUrl: createMiniAppUrl('/'),
            }),
          });
        } catch (err) {
          console.error('Welcome notification failed:', err);
        }
      }

      // After login (or if already authenticated), redirect to maintenance
      router.replace('/maintenance');
    };

    init();
  }, [ready, authenticated, isFarcasterApp, user?.farcaster?.fid]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <img
        src="/images/gif/QRbase-claim-links-work.gif"
        alt="Loading..."
        className="w-64 h-64 object-contain"
      />
    </div>
  );
}