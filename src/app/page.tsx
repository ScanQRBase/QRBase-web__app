'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QrBaseMain from "./components/QrBaseMain";
import partnerData from '@/src/app/data/partnerData.json';

export default function Page() {
  const router = useRouter();

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
