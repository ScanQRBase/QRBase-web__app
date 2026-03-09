'use client';

import { useEffect, useState } from 'react';

/**
 * Lightweight hook that tracks whether the viewport is below a breakpoint.
 *
 * Previously implemented inline in ScanModeMain.tsx with
 * addEventListener + useState.
 *
 * @param breakpoint — pixel width threshold (default: 768)
 * @returns isMobile — true when window.innerWidth < breakpoint
 */
export function useMobileDetect(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < breakpoint);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, [breakpoint]);

    return isMobile;
}
