import { FaBullhorn } from 'react-icons/fa';

interface QrBaseBannerProps {
  round: string;
  isCompleted:boolean;
}

export function QrBaseBanner({ round , isCompleted }: QrBaseBannerProps) {
  return (
    <div className="z-50 fixed top-0 left-0 flex h-10 xs:h-11 w-full flex-wrap items-center justify-center sm:h-13
      bg-gradient-to-r from-[#50DEF5] via-[#0052FF] to-[#AE80FF] text-white">
      <div className="flex h-full flex-wrap items-center justify-center text-center text-xs sm:text-sm">
        <FaBullhorn className="text-white w-4 h-4" />
        <span className="ml-2 text-white">
          {round} is {isCompleted ? "COMPLETED" : "LIVE"}!
        </span>
      </div>
    </div>
  );
}
