import Image from "next/image";
import WatcherIcon from "../../../images/svg/socialMedia/WatcherIcon";
import lightModePrize from '@/src/app/images/svg/lightModePrize.svg';



const config = {
  API_KEY_CLOUD: process.env.NEXT_PUBLIC_API_KEY ?? "",
  COIN_INFO_ENDPOINT: "/api/coinInfo",
};


export default function QrBaseQrcodeItems({ partnerData, piecesState, isCompleted, countWatcher, unlockedPieces, coinInfo , nftBalance , scanInfo }: any) {

 

  
  function parsePrize(prize: string) {
    const multiplier = prize.endsWith('K') ? 1_000 :
      prize.endsWith('M') ? 1_000_000 : 1;
    return parseFloat(prize) * multiplier;
  }

  function formatCompactUSD(value: number) {
    if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
    return `${Math.round(value)}`;
  }
  const reversedMilestones = [...partnerData.MILESTONES].reverse();
  const showPieces = coinInfo?.phase === "progress";
  const piecesToRender = showPieces ? piecesState : null;


  return (
    <div className="qrClass qrScale flex flex-col items-center justify-center  md:w-[60%] relative overflow-hidden perspective-1000">
      <div className="w-full transition-transform duration-300">
        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center mb-4 gap-3">
            <div className="text-white p-2 " style={{ background: '#0052FF', borderRadius: '6px' }}>
              
              <Image
                src={lightModePrize}
                alt="lightModePrize"
                width={40}
                height={40}
                style={{
                  objectFit: 'cover'
                }}
              />
              {/* <FaTrophy style={{ color: '#fff' }} className="text-xl" /> */}

            </div>

            <p className="text-lg font-bold text-gray-800">
              Prize: <span style={{ color: partnerData.PRIMARY_COLOR }}>100K $SCAN {scanInfo && scanInfo.priceInUsd && `| ~${formatCompactUSD(parsePrize('100K') * scanInfo.priceInUsd)}$`}</span>

            </p>
          </div>
          <div className="qrCube relative w-[440px] h-[440px] border-2 border-gray-300 rounded-lg grid grid-cols-3 grid-rows-3">

            

            {nftBalance?.length > 0 && 
              <Image
                 src={coinInfo?.activeImage}
                alt="full"
                fill
                className="rounded-lg object-cover"
                priority
                placeholder="blur"
                blurDataURL="/images/gif/QRbase-claim-links-work.gif"

              />
            }


             {!nftBalance && !showPieces &&
              <Image
               
                src='/images/gif/QRbase-claim-links-work.gif'
                alt="full"
                fill
                className="rounded-lg object-cover"
                priority
                placeholder="blur"
                blurDataURL="/images/gif/QRbase-claim-links-work.gif"

              />
            }
            
            {showPieces && piecesToRender.map((piece: any, index: any) => (
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
                        priority
                      />
                      <div className={`absolute inset-0 bg-opacity-60 opacity-0 group-hover:opacity-100 flex items-end justify-center p-2`} style={{ backgroundColor: `${partnerData.PRIMARY_COLOR}99` }}>
                        <div className="text-white text-center">
                          <p className="font-extrabold text-[10px]">
                            BoostPass NFT
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
                        priority
                      />
                      {index !== reversedMilestones.length - 1 && !piece.reached &&
                        <div className="absolute inset-0 flex items-end justify-center p-2">
                          <div className="text-white text-center">
                            <p className="font-bold text-[10px] mt-1">
                              {/* IN ~ {(9 - (unlockedPieces + 1)) - index} Hours(s) */}

                              {coinInfo?.phase === "final" ? (
                                <>Final QR unlock in {String(coinInfo?.remainingTime?.seconds ?? 0).padStart(2, "0")}s</>
                              ) : (
                                <>
                                  Unlock in&nbsp;
                                  {(9 - (unlockedPieces + 2)) - index}h&nbsp;{String(coinInfo?.remainingTime?.minutes ?? 0).padStart(2, "0")}m&nbsp;
                                  {String(coinInfo?.remainingTime?.seconds ?? 0).padStart(2, "0")}s
                                </>
                              )}

                              {/* {index}
                            {reversedMilestones.length} */}
                              {/* ${formatLargeValue(reversedMilestones[index])} MKT CAP */}
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

          {/* {isCompleted ? <div className="flex flex items-center mt-8">
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
          </div> :

            <div className="flex items-center space-x-2 border border-gray-500/50 px-4 py-1 rounded-full mt-6 mb-2">
              <WatcherIcon size={15} color={partnerData.PRIMARY_COLOR} />
              <span className="text-bold"> {`${countWatcher ?? 0}`}</span>
              <span className="text-gray-500">People watching</span>
            </div>
          } */}

          <div className="flex items-center space-x-2 border border-gray-500/50 px-4 py-1 rounded-full mt-6 mb-2">
            <WatcherIcon size={15} color={partnerData.PRIMARY_COLOR} />
            <span className="text-bold"> {`${countWatcher ?? 0}`}</span>
            <span className="text-gray-500">People watching</span>
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
