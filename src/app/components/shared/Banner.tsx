import { FaBullhorn } from 'react-icons/fa';
import ThemeToggle from '../shared/ThemeToggle';
import RevealModeSwitcher from '../shared/RevealModeSwitcher';

interface QrBaseBannerProps {
  round: string;
  isCompleted: boolean;
}

export function QrBaseBanner({ round, isCompleted }: QrBaseBannerProps) {
  return (
    <div className="z-50 fixed top-0 left-0 flex h-10 xs:h-11 w-full items-center sm:h-13
      bg-gradient-to-r from-[#50DEF5] via-[#0052FF] to-[#AE80FF] text-white px-4">
      {/* Spacer for left side to balance the layout - hidden on mobile */}
      <div className="hidden md:flex flex-1 justify-start">
        <div className="w-[140px] sm:w-[160px]"></div>
      </div>

      {/* Center content - left aligned on mobile, centered on desktop */}
      <div className="flex items-center text-xs sm:text-sm md:flex-1 md:justify-center">
        <FaBullhorn className="text-white w-4 h-4" />
        <span className="ml-2 text-white">
          {round} is {isCompleted ? "COMPLETED" : "LIVE"}!
        </span>
      </div>

      {/* Right side with switcher and theme toggle */}
      <div className="flex flex-1 justify-end items-center gap-2">
        <RevealModeSwitcher />
        <ThemeToggle />
      </div>
    </div>
  );
}

