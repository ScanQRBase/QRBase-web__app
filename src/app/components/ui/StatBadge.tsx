import React, { ReactNode } from 'react';
import styles from './StatBadge.module.css';

interface StatBadgeProps {
    /** Label text (e.g. "Total Wins") */
    label: string;
    /** Value to display — can be a string or animated span */
    children: ReactNode;
    /** Optional accent color for the value */
    color?: string;
    /** Additional CSS class names */
    className?: string;
}

/**
 * Compact stat display card for metrics like "Total Wins", "Pieces Unlocked".
 *
 * Replaces the repeated inline-styled stat blocks in CoinInfo components.
 *
 * @example
 * <StatBadge label="Total Wins" color="#0052FF">
 *   <animated.span>{springWins.number.to(v => Math.round(v))}</animated.span>
 * </StatBadge>
 */
export default function StatBadge({ label, children, color, className }: StatBadgeProps) {
    return (
        <div className={`${styles.badge} ${className ?? ''}`}>
            <span className={styles.label}>{label}</span>
            <p className={styles.value} style={color ? { color } : undefined}>
                {children}
            </p>
        </div>
    );
}
