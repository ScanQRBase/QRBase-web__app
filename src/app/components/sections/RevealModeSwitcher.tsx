'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RevealModeSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);

  // Check if we're on boostpass or fast-mode pages
  useEffect(() => {
    const active =  pathname === '/fast-mode' || pathname === '/fast-mode/winners'  || pathname === '/x402/boostpass'  ;
    setIsActive(active);
  }, [pathname]);

  const handleToggle = () => {
    if (isActive) {
      // If active, redirect to home
      router.push('/');
    } else {
      // If not active, redirect to fast-mode
      router.push('/fast-mode');
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="text-xs sm:text-sm font-medium text-white whitespace-nowrap">
        FAST MODE
      </span>
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 sm:h-6 sm:w-12 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none  ${
          isActive ? ' bg-gradient-to-r from-[#50DEF5] via-[#50DEF5] to-[#50DEF5]' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={isActive}
        aria-label="Toggle Reveal Mode"
      >
        <span
          className={`inline-block h-4 w-4 sm:h-4 sm:w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
            isActive ? 'translate-x-6 sm:translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
