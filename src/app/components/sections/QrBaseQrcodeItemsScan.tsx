"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import scan from '@/src/app/images/svg/scan.svg';
import { FaTrophy, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { QrBaseQrcodeItemsProps } from "@/src/app/types";
import { lockedImages, unlockedImages, clearImages } from "../../types/imageAssets";
import WatcherIcon from "../../images/svg/socialMedia/WatcherIcon";

export default function QrBaseQrcodeItems({ partnerData, piecesState, countWatcher, onRoundChange }: QrBaseQrcodeItemsProps) {
  const [currentRound, setCurrentRound] = useState(0);
  const [animationDirection, setAnimationDirection] = useState<"next" | "prev" | null>(null);

  const roundTitles = [
    { round: "Round 1", prize: 1000, description: "is Claimed" },
    { round: "Round 2", prize: 3000, description: "" },
    { round: "Round 3", prize: 5000, description: "" }
  ];

  const totalRounds = roundTitles.length;

  const filteredLockedImages = lockedImages.filter((item: any) => item.id === partnerData.pool);
  const filteredClearImages = clearImages.filter((item: any) => item.id === partnerData.pool);
  const effectiveMilestones = partnerData.MILESTONES
    .filter((milestone: { round: number; milenstone: number[] }) => (currentRound + 1) === milestone.round)
    .flatMap((milestone: any) => milestone.milenstone);

  const reversedMilestones = [...effectiveMilestones].reverse();

  const formatLargeValue = (value: number) => {
    if (value >= 1_000_000_000) {
      const num = Math.round(value / 100_000_000) / 10;
      return `${Number.isInteger(num) ? num.toFixed(0) : num}B`;
    } else if (value >= 1_000_000) {
      const num = Math.round(value / 100_000) / 10;
      return `${Number.isInteger(num) ? num.toFixed(0) : num}M`;
    } else {
      const num = Math.round(value / 100) / 10;
      return `${Number.isInteger(num) ? num.toFixed(0) : num}K`;
    }
  };

  // Determine which pieces to display based on round
  const getCurrentPieces = () => {
    if (currentRound === 0) {
      // Round 1 → filteredClearImages
      return (filteredClearImages[0]?.images || []).map((img: any) => ({
        image: img.src,
        reached: true,
        pulse: false,
        link: "",
      }));
    }

    if (currentRound === 1) {
      // Round 2 → use piecesState directly
      return piecesState;
    }

    if (currentRound === 2) {
      // Round 3 → filteredLockedImages
      return (filteredLockedImages[0]?.images || []).map((img: any) => ({
        image: img.src,
        reached: false,
        pulse: false,
        link: "",
      }));
    }

    return [];
  };

  const goToPrevious = () => {
    if (currentRound > 0) {
      setAnimationDirection("prev");
      setCurrentRound((prev) => prev - 1);
    }
  };

  const goToNext = () => {
    if (currentRound < totalRounds - 1) {
      setAnimationDirection("next");
      setCurrentRound((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (animationDirection) {
      const timer = setTimeout(() => setAnimationDirection(null), 300);
      return () => clearTimeout(timer);
    }
  }, [animationDirection]);

  useEffect(() => {
    if (partnerData?.round) {
      const index = roundTitles.findIndex(r => r.round === partnerData.round);
      if (index !== -1) {
        setCurrentRound(index);
      }
    }
  }, [partnerData?.round]);

  useEffect(() => {
    const newRound = currentRound + 1;
    // localStorage.setItem("currentRound", newRound.toString());
    onRoundChange?.(newRound); // ✅ safe call
  }, [currentRound, onRoundChange]);




  return (
    <div className="qrClass qrScale flex flex-col items-center justify-center md:w-[64%] relative">
      {/* Current Round Display */}
      <div
        className={`w-full flex flex-col items-center ${animationDirection === "next"
          ? "animate-slide-in-from-left"
          : animationDirection === "prev"
            ? "animate-slide-in-from-right"
            : ""
          }`}
        key={currentRound}
      >
        <div className="flex flex-col items-center mb-4">
          <FaTrophy style={{ color: partnerData.PRIMARY_COLOR }} className="text-3xl mb-1" />

          {roundTitles[currentRound].description ? <> <p className="text-lg font-bold text-gray-800" >
            {roundTitles[currentRound].round} <span style={{ color: partnerData.PRIMARY_COLOR }}>{roundTitles[currentRound].description}</span>
          </p>
          </> :
            <p className="text-lg font-bold text-gray-800">
              {roundTitles[currentRound].round} Prize: ${roundTitles[currentRound].prize}
            </p>}
        </div>

        <div className="qrCube relative w-[440px] h-[440px] border-2 border-gray-300 rounded-lg grid grid-cols-3 grid-rows-3">
          {getCurrentPieces().map((piece, pieceIndex) => (
            <div
              key={pieceIndex}
              className={`relative border border-gray-300 group ${piece.pulse ? `animate-pulse border-2 border-[${partnerData.PRIMARY_COLOR}]` : ""}`}
            >
              {piece.image ? (
                piece.link ? (
                  <>
                    <Image
                      src={piece.image}
                      alt={`Grid ${pieceIndex + 1}`}
                      fill
                      className="rounded-md object-cover"
                      sizes="(max-width: 440px) 33vw, 146px"
                    />
                    <div
                      className={`absolute inset-0 bg-opacity-60 opacity-0 group-hover:opacity-100 flex items-end justify-center p-2`}
                      style={{ backgroundColor: `${partnerData.PRIMARY_COLOR}99` }}
                    >
                      <div className="text-white text-center">
                        <p className="font-extrabold text-[10px]">
                          {formatLargeValue(partnerData.MIN_TOKEN_BALANCE)} ${partnerData.title.toUpperCase()}
                          <br />
                          Required
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Image
                      src={piece.image}
                      alt={`Grid ${pieceIndex + 1}`}
                      fill
                      className="rounded-md object-cover"
                      sizes="(max-width: 440px) 33vw, 146px"
                    />
                    {pieceIndex !== reversedMilestones.length - 1 && !piece.reached && (
                      <div className="absolute inset-0 flex items-end justify-center p-2">
                        <div className="text-white text-center">
                          <p className="font-extrabold text-[10px]">Unlock at</p>
                          <p className="font-bold text-[10px] mt-1">
                            ${formatLargeValue(reversedMilestones[pieceIndex])} MKT CAP
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )
              ) : (
                <div className="w-full h-full bg-gray-200 animate-pulse rounded-md" />
              )}
            </div>
          ))}


        </div>
        {roundTitles[currentRound].description && <div className="flex flex items-center mt-4">
          <Image
            src={scan}
            alt="logo"
            width={20}
            height={20}
            style={{
              objectFit: 'cover',
              marginRight: "5px"
            }}
          />
          <p className="text-lg font-bold text-gray-800">SCAN to see winners</p>
        </div>}

        {roundTitles[currentRound].round == 'Round 2' && <div className="flex items-center space-x-2 border border-gray-500/50 px-4 py-1 rounded-full mt-6 mb-2">
          <WatcherIcon size={15} color={partnerData.PRIMARY_COLOR} />
          <span className="text-bold"> {`${countWatcher ?? 0}`}</span>
          <span className="text-gray-500">People watching</span>
        </div>}


      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        disabled={currentRound === 0}
        className={`absolute left-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full text-white ${currentRound === 0
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-gray-800 hover:bg-gray-600"
          }`}
        aria-label="Previous Round"
      >
        <FaChevronLeft />
      </button>
      <button
        onClick={goToNext}
        disabled={currentRound === totalRounds - 1}
        className={`absolute right-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full text-white ${currentRound === totalRounds - 1
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-gray-800 hover:bg-gray-600"
          }`}
        aria-label="Next Round"
      >
        <FaChevronRight />
      </button>

      {/* Dots */}
      <div className="flex space-x-2 mt-4">
        {roundTitles.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full ${currentRound === index ? "bg-blue-500" : "bg-gray-300"}`}
          />
        ))}
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        @keyframes slide-in-from-right {
          0% {
            transform: translateX(30%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slide-in-from-left {
          0% {
            transform: translateX(-30%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-from-right {
          animation: slide-in-from-right 0.3s ease-in-out forwards;
        }
        .animate-slide-in-from-left {
          animation: slide-in-from-left 0.3s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}
