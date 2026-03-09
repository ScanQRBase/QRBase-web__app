import React, { ReactNode } from 'react';
import { Tooltip } from '@mui/material';
import { IoInformationCircleOutline } from 'react-icons/io5';
import styles from './InfoCard.module.css';

interface InfoCardProps {
    /** Card title (e.g. "Access Requirements") */
    title: string;
    /** Optional tooltip text shown via info icon */
    tooltip?: string;
    /** Card content */
    children: ReactNode;
    /** Additional CSS class names for the card container */
    className?: string;
}

/**
 * Section card with a bold condensed header and optional info tooltip.
 *
 * Replaces the repeated inline-styled card/section blocks
 * in PartnerInfo components (Access Requirements, etc.).
 *
 * @example
 * <InfoCard title="Access Requirements :" tooltip="Hold these tokens to access the game">
 *   <StatusRow label="$SCAN" status="accepted" />
 *   <StatusRow label="$DEGEN" status="unknown" />
 * </InfoCard>
 */
export default function InfoCard({ title, tooltip, children, className }: InfoCardProps) {
    return (
        <div className={`${styles.card} ${className ?? ''}`}>
            <h3 className={styles.header}>
                {title}
                {tooltip && (
                    <Tooltip title={tooltip} placement="top">
                        <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <IoInformationCircleOutline size={16} />
                        </span>
                    </Tooltip>
                )}
            </h3>
            <div className={styles.content}>
                {children}
            </div>
        </div>
    );
}
