'use client';

interface ScanModeFooterProps {
    progress: {
        partnerName: string;
        piecesUnlocked: number;
        totalPieces: number;
        primaryColor: string;
        gradientStart: string;
        gradientEnd: string;
        link: string | null;
        minScanBalance?: number;
        minPartnerPuzzles?: number;
    };
    address: string | null;
    authenticated: boolean;
    hasAccess: boolean;
    scanBalance: number | null;
    userPartnerWins: number;
}

/**
 * Fixed bottom footer for scan mode — matches QrBaseFooter pattern.
 * Shows pieces unlocked, access status message, and buy button.
 * Status: Green (access met), Gray (disconnected), Red (connected, missing requirements).
 */
export default function ScanModeFooter({ progress, address, authenticated, hasAccess, scanBalance, userPartnerWins }: ScanModeFooterProps) {
    const { partnerName, piecesUnlocked, totalPieces, primaryColor, gradientStart, gradientEnd, link } = progress;
    const isComplete = piecesUnlocked === totalPieces;
    const minScanBalance = progress.minScanBalance || 0;
    const minPartnerPuzzles = progress.minPartnerPuzzles || 0;

    // Determine access status — three states
    const getStatus = () => {
        // State 1: Not connected — GRAY
        if (!authenticated || !address) {
            return {
                text: 'Connect your wallet to reveal unlocked pieces.',
                color: 'text-gray-500 dark:text-gray-400 italic text-xs',
                bg: 'bg-gray-100 dark:bg-gray-800',
                pulse: 'bg-gray-400',
            };
        }

        // State 2: Connected + all pieces unlocked
        if (isComplete && hasAccess) {
            return {
                text: '🎉 All pieces unlocked! Scan the QR to claim.',
                color: 'text-green-600 dark:text-green-400 italic text-xs',
                bg: 'bg-green-100 dark:bg-green-900/40',
                pulse: 'bg-green-500',
            };
        }

        // State 3: Connected + has access — GREEN
        if (hasAccess) {
            return {
                text: `✅ Scan the QR when all pieces are unlocked.`,
                color: 'text-green-600 dark:text-green-400 italic text-xs',
                bg: 'bg-green-100 dark:bg-green-900/40',
                pulse: 'bg-green-500',
            };
        }

        // State 4: Connected but missing requirements — RED
        const missing: string[] = [];
        if (scanBalance === null || scanBalance < minScanBalance || userPartnerWins < minPartnerPuzzles) {
            return {
                text: `❌ Meet the requirements to reveal the pieces.`,
                color: 'text-red-600 dark:text-red-400 italic text-xs',
                bg: 'bg-red-100 dark:bg-red-900/40',
                pulse: 'bg-red-500',
            };
        }


        return {};
    };

    const status = getStatus();

    return (
        <div className="z-50 relative md:fixed right-0 md:bottom-0 w-full border-gray-200 dark:border-gray-700 border-t bg-white dark:bg-gray-900 transition-colors duration-200">
            <div className="flex w-full justify-center py-1 md:py-2 qrNumberInfo" style={{ alignItems: 'center', flexDirection: 'column' }}>
                <h2 className="font-bold text-sm md:text-lg text-center text-gray-900 dark:text-white">
                    TOTAL PIECES UNLOCKED {piecesUnlocked}/{totalPieces}
                </h2>
                <div
                    className={`flex items-center px-3 py-1 rounded-full gap-2 max-w-[90%] md:max-w-[600px] ${status.bg}`}
                    style={{ justifyContent: 'center', alignItems: 'center' }}
                >
                    <div
                        key={status.pulse}
                        className={`flex-shrink-0 w-3 h-3 rounded-full ${status.pulse} animate-[pulse_0.4s_infinite]`}
                    />
                    <p
                        className={`${status.color} font-bold text-center text-sm leading-snug`}
                        style={{
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                            whiteSpace: 'normal',
                            flex: '1 1 auto',
                        }}
                    >
                        {status.text}
                    </p>
                </div>
            </div>
            <div className="mx-auto max-w-7xl" style={{ zIndex: 1, position: 'relative' }}>
                <div className="flex flex-col justify-between py-1 md:py-4 md:flex-row md:items-center">
                    <div className="mb-2 hidden flex-col px-4 text-xs md:flex md:mb-0 md:w-1/3 lg:px-6">
                        <span className="text-gray-800 dark:text-gray-200">Built on Base</span>
                        <a className="pt-1 text-[10px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                            ⓒ 2025 QRBase. All rights reserved
                        </a>
                    </div>

                    {link && (
                        <div className="flex flex-col items-center justify-center gap-2 px-4 sm:flex-row sm:gap-0 md:w-auto lg:px-6 connectButtons">
                            <div className="flex justify-center md:justify-start gap-4 w-[200px] md:w-[300px]">
                                <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full px-4 py-2 md:px-6 md:py-3 text-sm font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 text-center"
                                    style={{ background: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})` }}
                                >
                                    BUY ${partnerName}
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
