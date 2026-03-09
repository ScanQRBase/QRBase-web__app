'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const DEFAULT_SCAN_ADDRESS = '0x20429F731096e359910921994A267d32ef576720';

export default function RevealModeSwitcher() {
    const pathname = usePathname();
    const router = useRouter();
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        // Active if on a /scanMode route
        setIsActive(pathname.includes('/scanMode/'));
    }, [pathname]);

    const handleToggle = () => {
        if (pathname.includes('/scanMode/')) {
            // Switch from Scan Mode → Puzzle
            router.push('/puzzle');
        } else if (pathname.startsWith('/puzzle')) {
            // Switch from Puzzle → Scan Mode (default SCAN partner)
            router.push(`/scanMode/${DEFAULT_SCAN_ADDRESS}`);
        }
    };

    // Show on /puzzle and /scanMode/ pages
    const shouldShow = pathname.startsWith('/puzzle') || pathname.includes('/scanMode/');

    if (!shouldShow) return null;

    return (
        <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-medium text-white whitespace-nowrap">
                SCAN MODE
            </span>
            <button
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 sm:h-6 sm:w-12 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none  ${isActive ? ' bg-gradient-to-r from-[#50DEF5] via-[#50DEF5] to-[#50DEF5]' : 'bg-gray-300'
                    }`}
                role="switch"
                aria-checked={isActive}
                aria-label="Toggle Scan Mode"
            >
                <span
                    className={`inline-block h-4 w-4 sm:h-4 sm:w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${isActive ? 'translate-x-6 sm:translate-x-6' : 'translate-x-1'
                        }`}
                />
            </button>
        </div>
    );
}
