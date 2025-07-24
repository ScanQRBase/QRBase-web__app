'use client';

import React from 'react';
import Image from 'next/image';
import styles from './coinsBoughtDisplay.module.css';
import { CoinsBoughtDisplayProps } from '@/src/app/types';





const formatCoins = (coins: any): string => {
  const value = Number(coins);

  if (isNaN(value)) return '0';

  if (value >= 1_000_000_000) 
    return (value / 1_000_000_000).toFixed(2).replace(/\.0+$/, '') + 'B';
  
  if (value >= 1_000_000) 
    return (value / 1_000_000).toFixed(2).replace(/\.0+$/, '') + 'M';
  
  if (value >= 1_000) 
    return (value / 1_000).toFixed(2).replace(/\.0+$/, '') + 'K';

  return value.toFixed(1).replace(/\.0+$/, '');
};




const CoinsBoughtDisplay: React.FC<CoinsBoughtDisplayProps> = ({ coins, coinLogoUrl }) => {
  return (
    <div className={styles.container}>
      <Image
        src={coinLogoUrl}
        alt="Coin"
        width={16}
        height={16}
        className={styles.coinImage}

      />
      <span className={styles.amount}>{formatCoins(coins)}</span>
    </div>
  );
};

export default CoinsBoughtDisplay;
