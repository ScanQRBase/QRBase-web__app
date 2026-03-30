'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from '@/src/app/components/shared/coinsBoughtDisplay.module.css';

const SCAN_LOGO_URL = 'https://ik.imagekit.io/cafu/$SCAN/scan.png?updatedAt=1746620925756&ik-s=83f8422add9570195a66cd510d3f1c5e884a50d1';

const formatCoins = (value: number): string => {
    if (isNaN(value)) return '0';

    const formatNoRound = (num: number, divisor: number, suffix: string) => {
        const v = num / divisor;
        const truncated = Math.floor(v * 100) / 100;
        return truncated.toString().replace(/\.0+$/, '') + suffix;
    };

    if (value >= 1_000_000_000) return formatNoRound(value, 1_000_000_000, 'B');
    if (value >= 1_000_000) return formatNoRound(value, 1_000_000, 'M');
    if (value >= 1_000) return formatNoRound(value, 1_000, 'K');

    const truncated = Math.floor(value * 10) / 10;
    return truncated.toString().replace(/\.0+$/, '');
};

interface ScanCoinBalanceProps {
    walletAddress: string | null;
}

export default function ScanCoinBalance({ walletAddress }: ScanCoinBalanceProps) {
    const [balance, setBalance] = useState<number | null>(null);
    const balanceRef = useRef<number | null>(null); // Track current balance for optimistic updates

    useEffect(() => {
        if (!walletAddress) {
            setBalance(null);
            balanceRef.current = null;
            return;
        }

        let cancelled = false;
        const cacheKey = `scan_balance_${walletAddress.toLowerCase()}`;

        const fetchBalance = async () => {
            try {
                const res = await fetch(`/api/game/scanMode/userBalance?address=${encodeURIComponent(walletAddress)}&t=${Date.now()}`);
                const data = await res.json();
                if (!cancelled && data.success) {
                    setBalance(data.balance);
                    balanceRef.current = data.balance;
                    try { sessionStorage.setItem(cacheKey, String(data.balance)); } catch { }
                }
            } catch (err) {
                console.error('[ScanCoinBalance] Failed to fetch balance:', err);
                if (!cancelled) setBalance(null);
            }
        };

        // On mount: show cached value as placeholder, then fetch fresh
        const cached = sessionStorage.getItem(cacheKey);
        if (cached !== null) {
            const cachedVal = Number(cached);
            setBalance(cachedVal);
            balanceRef.current = cachedVal;
        }
        fetchBalance();

        /**
         * Optimistic balance update via CustomEvent.
         * - If event.detail.delta is set: apply delta instantly (no skeleton, no RPC wait)
         * - If no delta: show skeleton and fetch from RPC (legacy fallback)
         */
        const handleBalanceRefresh = (e: Event) => {
            const detail = (e as CustomEvent)?.detail;
            const delta = detail?.delta;
            
            if (typeof delta === 'number' && balanceRef.current !== null) {
                // Optimistic update: apply delta immediately
                const newBalance = balanceRef.current + delta;
                console.log('[ScanCoinBalance] Optimistic update:', balanceRef.current, delta > 0 ? '+' : '', delta, '=', newBalance);
                setBalance(newBalance);
                balanceRef.current = newBalance;
                try { sessionStorage.setItem(cacheKey, String(newBalance)); } catch { }
                
                // Background reconciliation after 5s (non-blocking, no skeleton)
                setTimeout(() => {
                    if (!cancelled) {
                        fetchBalance();
                    }
                }, 5000);
            } else {
                // Fallback: show skeleton and fetch (e.g. referral claim where delta is unknown)
                console.log('[ScanCoinBalance] balance-refresh (no delta), fetching from RPC...');
                try { sessionStorage.removeItem(cacheKey); } catch { }
                setBalance(null);
                fetchBalance();
            }
        };
        window.addEventListener('balance-refresh', handleBalanceRefresh);

        return () => {
            cancelled = true;
            window.removeEventListener('balance-refresh', handleBalanceRefresh);
        };
    }, [walletAddress]);

    if (!walletAddress) return null;

    if (balance === null) {
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
                src={SCAN_LOGO_URL}
                alt="SCAN"
                width={16}
                height={16}
                className={styles.coinImage}
            />
            <span className={styles.amount}>{formatCoins(balance)}</span>
        </div>
    );
}
