'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QrBaseMain from './components/QrBaseMain';
import partnerData from '@/src/app/data/partnerData.json';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { usePrivy } from '@privy-io/react-auth';
import { useLoginToMiniApp } from '@privy-io/react-auth/farcaster';
import { sdk } from '@farcaster/miniapp-sdk';

export default function Page() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const API_KEY_CLOUD  = process.env.NEXT_PUBLIC_API_KEY ?? ""
  const { initLoginToMiniApp, loginToMiniApp } = useLoginToMiniApp();

  // Helper function to create deep link URLs for Farcaster mini app
  const createMiniAppUrl = (path: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://www.qrbase.xyz';
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}?path=/${cleanPath}`;
  };

  // Handle frame readiness, Farcaster login, and wallet connection
  useEffect(() => {
    const init = async () => {
      // Set frame ready for Mini App
      if (!isFrameReady) {
        setFrameReady();
      }

      sdk.actions.ready();

      const isMiniApp = await sdk.isInMiniApp();

      // Handle deep link routing from notifications
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const targetPath = urlParams.get('path');
        if (targetPath && isMiniApp) {
          router.push(targetPath);
          return;
        }
      }

      if (isMiniApp) {
        try {
          await sdk.actions.addMiniApp();
        } catch (err) {
          console.warn('addMiniApp skipped:', (err as any)?.message ?? err);
        }
      }


      if (ready && !authenticated) {
        try {
          if (!isMiniApp) {
            // For web, rely on manual wallet connection via RainbowKit
            if (partnerData && partnerData[0]) {
              router.replace(`/base/${partnerData[0].id}`);
            }
            return;
          }

          // Farcaster login for Mini App
          const { nonce } = await initLoginToMiniApp();
          const result = await sdk.actions.signIn({ nonce });

          const loginRes: any = await loginToMiniApp({
            message: result.message,
            signature: result.signature,
          });



          const fid = loginRes?.farcaster?.fid;

     


          await fetch('/api/sendNotification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': API_KEY_CLOUD,
            },
            body: JSON.stringify({
              fid: fid,
              title: "Welcome to QRbase 👋",
              body: "Thanks for signing in! Explore our mini app and earn rewards.",
              targetUrl: createMiniAppUrl('/')
            }),
          });


        } catch (err) {
          console.error('❌ Farcaster login failed:', err);
          if (partnerData && partnerData[0]) {
            router.replace(`/base/${partnerData[0].id}`);
          }
        }
      }

    };

    init();
  }, [ready, authenticated, isFrameReady]);




  if (!partnerData || !partnerData[0]) {
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

  return (

    <QrBaseMain partnerData={partnerData[0]} />

  );
}