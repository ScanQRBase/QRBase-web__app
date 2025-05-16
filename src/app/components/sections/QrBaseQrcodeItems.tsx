import Image from "next/image"; // Use Next.js Image
import { FaTrophy } from "react-icons/fa";
import {  QrBaseQrcodeItemsProps  } from "@/src/app/types";


export default function QrBaseQrcodeItems({ partnerData, piecesState }: QrBaseQrcodeItemsProps) {

  const formatLargeValue = (value: number) => {
    if (value >= 1_000_000) {
      const num = Math.round(value / 100_000) / 10;
      return `${Number.isInteger(num) ? num.toFixed(0) : num}M`;
    } else {
      const num = Math.round(value / 100) / 10;
      return `${Number.isInteger(num) ? num.toFixed(0) : num}K`;
    }
  };

  const reversedMilestones = [...partnerData.MILESTONES].reverse();

  return (
    <div className="qrClass qrScale flex flex-col items-center justify-center  md:w-[64%] relative overflow-hidden perspective-1000">
      <div className="w-full transition-transform duration-300">
        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center mb-4">
            <FaTrophy style={{ color: partnerData.PRIMARY_COLOR }} className="text-3xl mb-1" />
            <p className="text-lg font-bold text-gray-800">{partnerData.round} Prize: ${partnerData.reward}</p>
          </div>
          <div className="qrCube relative w-[440px] h-[440px] border-2 border-gray-300 rounded-lg grid grid-cols-3 grid-rows-3 gap-1">
            {piecesState.map((piece, index) => (
              <div
                key={index}
                className={`relative border border-gray-300 group ${piece.pulse ? `animate-pulse border-2 border-[${partnerData.PRIMARY_COLOR}]` : ""
                  }`}
              >
                {piece.image ? (
                  piece.link ? (
                    <>
                      <Image
                        src={piece.image}
                        alt={`Grid ${index + 1}`}
                        fill
                        className="rounded-md object-cover"
                        sizes="(max-width: 440px) 33vw, 146px"
                      />
                      <div className={`absolute inset-0 bg-opacity-60 opacity-0 group-hover:opacity-100 flex items-end justify-center p-2`} style={{ backgroundColor: `${partnerData.PRIMARY_COLOR}99` }}>
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
                        alt={`Grid ${index + 1}`}
                        fill
                        className="rounded-md object-cover"
                        sizes="(max-width: 440px) 33vw, 146px"
                      />
                      {index !== reversedMilestones.length - 1 && !piece.reached &&
                        <div className="absolute inset-0 flex items-end justify-center p-2">
                          <div className="text-white text-center">
                            <p className="font-extrabold text-[10px]">
                              Unlock at
                            </p>
                            <p className="font-bold text-[10px] mt-1">
                              {formatLargeValue(reversedMilestones[index])} MKT CAP
                            </p>
                          </div>
                        </div>
                      }
                    </>
                  )
                ) : (
                  <div className="w-full h-full bg-gray-200 animate-pulse rounded-md" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
