'use client';

import React from 'react';
import Image from 'next/image';
import styles from './coinsBoughtDisplay.module.css';
import { CoinsBoughtDisplayProps } from '@/src/app/types';



const formatCoins = (coins: number): string => {
  if (coins) {
    if (coins >= 1_000_000) return (coins / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (coins >= 1_000) return (coins / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return coins.toFixed(1); 
  }
  return '0';
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
