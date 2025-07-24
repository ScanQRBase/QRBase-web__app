'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QrBaseMain from "./components/QrBaseMain";
import partnerData from '@/src/app/data/partnerData.json';
import { useMiniKit } from '@coinbase/onchainkit/minikit';

export default function Page() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const router = useRouter();


  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);
 
  useEffect(() => {
    if (partnerData && partnerData[0]) {
      
      router.replace(`/base/${partnerData[0].id}`);
    }
  }, [partnerData]); 

  if (!partnerData || !partnerData[0]) {
    return <div>Loading...</div>; 
  }

  return <QrBaseMain partnerData={partnerData[0]} />;
}
