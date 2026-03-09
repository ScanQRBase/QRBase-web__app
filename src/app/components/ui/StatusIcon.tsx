import React from 'react';

export type AccessStatus = 'unknown' | 'rejected' | 'accepted';

interface StatusIconProps {
    status: AccessStatus;
    className?: string;
}

/**
 * Small circle icon indicating accepted (✓ green), rejected (✕ red),
 * or unknown (— gray) status.
 *
 * Previously duplicated in QrBasePartnerInfo and ScanModePartnerInfo.
 */
export default function StatusIcon({ status, className }: StatusIconProps) {
    switch (status) {
        case 'accepted':
            return (
                <svg
                    className={`w-4 h-4 text-green-500 ${className ?? ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8.5 12.5l2.5 2.5l5 -5" />
                </svg>
            );
        case 'rejected':
            return (
                <svg
                    className={`w-4 h-4 text-red-500 ${className ?? ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="16" y1="8" x2="8" y2="16" />
                    <line x1="8" y1="8" x2="16" y2="16" />
                </svg>
            );
        default:
            return (
                <svg
                    className={`w-4 h-4 text-gray-400 ${className ?? ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h8" />
                </svg>
            );
    }
}
