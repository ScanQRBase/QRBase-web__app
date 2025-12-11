import { useEffect, useState } from 'react';
import { FaBullhorn } from 'react-icons/fa';
import RevealModeSwitcher from './RevealModeSwitcher';

interface QrBaseBannerProps {
  round: string;
  currentRound: number;


}

export function QrBaseBannerScan({ round, currentRound }: QrBaseBannerProps) {

  const [status, setStatus] = useState("");

  const getRoundStatus = (round: string, currentRound: number) => {


    // Extract number from "ROUND 1", "ROUND 2", etc.
    const roundNumber = parseInt(round.replace(/\D/g, ""), 10);
    if (roundNumber === currentRound || currentRound == 0) return "LIVE";
    if (roundNumber > currentRound) return "COMPLETED";

    return "COMING";
  };

  useEffect(() => {
    setStatus(getRoundStatus(round, currentRound));
  }, [round, currentRound]);
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
          <p>ROUND {currentRound === 0 ? 2 : currentRound} is {status}!</p>
        </span>
      </div>
      
      {/* Right side with switcher */}
      <div className="flex flex-1 justify-end">
        <RevealModeSwitcher />
      </div>
    </div>
  );
}
