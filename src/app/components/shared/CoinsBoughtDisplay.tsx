'use client';

import React from 'react';
import Image from 'next/image';
import styles from './coinsBoughtDisplay.module.css';
import { CoinsBoughtDisplayProps } from '@/src/app/types';





const formatCoins = (coins: any): string => {
  const value = Number(coins);

  if (isNaN(value)) return '0';

  // Helper to avoid rounding up
  const formatNoRound = (num: number, divisor: number, suffix: string) => {
    const v = num / divisor;
    const truncated = Math.floor(v * 100) / 100; // keep 2 decimals, no rounding
    return truncated.toString().replace(/\.0+$/, '') + suffix;
  };

  if (value >= 1_000_000_000)
    return formatNoRound(value, 1_000_000_000, 'B');

  if (value >= 1_000_000)
    return formatNoRound(value, 1_000_000, 'M');

  if (value >= 1_000)
    return formatNoRound(value, 1_000, 'K');

  // For < 1000: just truncate, no rounding
  const truncated = Math.floor(value * 10) / 10;
  return truncated.toString().replace(/\.0+$/, '');
};




const CoinsBoughtDisplay: React.FC<CoinsBoughtDisplayProps> = ({ coins, coinLogoUrl }) => {
  if (coins === null || coins === undefined) {
    return (
      <div className={styles.container}>
        <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="w-10 h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

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
