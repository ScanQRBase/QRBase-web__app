'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import XIcon from '@/src/app/images/svg/socialMedia/XIcon';
import InfoIcon from '@/src/app/images/svg/utils/InfoIcon';
import WarpcastIcon from '@/src/app/images/svg/socialMedia/WarpcastIcon';

interface ShareModalScanModeProps {
    isOpen: boolean;
    onClose: () => void;
    partnerName: string;
    primaryColor: string;
    shareImageUrl: string | null;
    stage: number;
    totalPieces: number;
    prizes: string | null;
}

export default function ShareModalScanMode({
    isOpen,
    onClose,
    partnerName,
    primaryColor,
    shareImageUrl,
    stage,
    totalPieces,
    prizes,
}: ShareModalScanModeProps) {
    if (!isOpen) return null;

    const [copied, setCopied] = useState(false);

    // Build share URL with stage param for unique OG cache per stage
    const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    const shareUrl = `${baseUrl}?stage=${stage}`;

    const displayName = partnerName.toUpperCase();
    const shareTextTwitter = `🧩 $${displayName} Stage ${stage}/${totalPieces}${prizes ? ` | $${prizes} in rewards` : ''} on @ScanQRBase`;
    const shareTextWarpcast = `🧩 $${displayName} Stage ${stage}/${totalPieces}${prizes ? ` | $${prizes} in rewards` : ''} on @scanqrbase.eth`;

    const encodedTextTwitter = encodeURIComponent(shareTextTwitter);
    const encodedTextWarpcast = encodeURIComponent(shareTextWarpcast);
    const encodedLink = encodeURIComponent(shareUrl);

    const twitterUrl = `https://x.com/intent/post?text=${encodedTextTwitter}%0A%0A${encodedLink}`;
    const warpcastUrl = `https://farcaster.xyz/~/compose?text=${encodedTextWarpcast}&embeds[]=${encodedLink}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" style={{ marginTop: 0 }}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-md relative border-4 border-gray-200 dark:border-gray-700 m-5 md:m-0 md:max-w-lg lg:max-w-xl transition-colors duration-200">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Share</h2>
                    <button onClick={onClose} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Dynamic Stage Image */}
                <div className="rounded-lg mb-6" style={{ placeSelf: 'center' }}>
                    {shareImageUrl ? (
                        <img
                            src={shareImageUrl}
                            alt={`${displayName} Stage ${stage}`}
                            className="w-full object-contain rounded-md"
                            style={{ borderRadius: '10px' }}
                        />
                    ) : (
                        <div className="w-full h-48 flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-700 rounded-md text-gray-400 dark:text-gray-500 gap-2">
                            <p className="text-sm">No share image available</p>
                            <p className="text-xs">Stage {stage}/{totalPieces}</p>
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                    {/* X.com Button */}
                    <button
                        onClick={() => window.open(twitterUrl, '_blank')}
                        className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-1.5 rounded-2xl text-sm font-medium transition-colors duration-200 hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-[136px] min-h-[44px]"
                    >
                        <XIcon size={16} color={primaryColor} />
                        X.com
                    </button>

                    {/* Warpcast Button */}
                    <button
                        onClick={() => window.open(warpcastUrl, '_blank')}
                        className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-1.5 rounded-2xl text-sm font-medium transition-colors duration-200 hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-[136px] min-h-[44px]"
                    >
                        <WarpcastIcon size={18} color={primaryColor} />
                        Farcaster
                    </button>

                    {/* Copy Link Button */}
                    <motion.button
                        onClick={handleCopy}
                        className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-1.5 rounded-2xl text-sm font-medium transition-colors duration-200 hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-[136px] min-h-[44px]"
                        whileTap={{ scale: 0.95 }}
                    >
                        {copied ? (
                            <span className="text-green-600 font-medium">Copied! 🎉</span>
                        ) : (
                            <>
                                <InfoIcon size={18} color={primaryColor} />
                                Copy link
                            </>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
