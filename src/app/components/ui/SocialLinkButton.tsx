import React, { ReactNode } from 'react';
import { Tooltip } from '@mui/material';
import styles from './SocialLinkButton.module.css';

interface SocialLinkButtonProps {
    /** URL to open in a new tab */
    href?: string;
    /** Tooltip text (e.g. "X", "Telegram") */
    tooltip: string;
    /** Icon element to render inside the button */
    icon: ReactNode;
    /** Optional click handler (used for share button instead of href) */
    onClick?: () => void;
    /** Additional CSS class names */
    className?: string;
}

/**
 * Circular icon button for social media links and share actions.
 *
 * Replaces the identical inline-styled blocks previously repeated
 * 6× in ScanModePartnerInfo, QrBasePartnerInfo, and their variants.
 *
 * @example
 * <SocialLinkButton
 *   href="https://x.com/username"
 *   tooltip="X"
 *   icon={<XIcon size={15} color={primaryColor} />}
 * />
 */
export default function SocialLinkButton({
    href,
    tooltip,
    icon,
    onClick,
    className,
}: SocialLinkButtonProps) {
    const content = (
        <div className={`${styles.button} ${className ?? ''}`} onClick={onClick}>
            {icon}
        </div>
    );

    if (href) {
        return (
            <Tooltip title={tooltip}>
                <a href={href} target="_blank" rel="noopener noreferrer">
                    {content}
                </a>
            </Tooltip>
        );
    }

    return (
        <Tooltip title={tooltip}>
            {content}
        </Tooltip>
    );
}
