'use client';

import Image from 'next/image';
import { FaTrophy } from 'react-icons/fa';
import scan from '@/src/app/images/svg/scan.svg';
import WatcherIcon from '@/src/app/images/svg/socialMedia/WatcherIcon';
import { PieceState } from '@/src/app/types';

interface ScanModeQrcodeItemsProps {
    partnerData: {
        primaryColor: string;
        title: string;
        round: string;
        prizes: string;
        link: string;

        MILESTONES: number[];
    };
    piecesState: PieceState[];
    isCompleted: boolean;
    viewerCount: number | null;
    id?: string;
}

/**
 * 3×3 Grid displaying the progressive reveal of the QR code.
 * Matches the exact design of QrBaseQrcodeItems.
 */
export default function ScanModeQrcodeItems({
    partnerData,
    piecesState,
    isCompleted,
    viewerCount,
    id,
}: ScanModeQrcodeItemsProps) {


    const reversedMilestones = [...partnerData.MILESTONES].reverse();

    return (
        <div id={id} className="qrClass qrScale flex flex-col items-center justify-center md:w-[64%] relative overflow-hidden perspective-1000">
            <div className="w-full transition-transform duration-300">
                <div className="flex flex-col items-center">
                    {/* People watching — top-left on mobile only */}

                    <div className="md:hidden flex w-full justify-between mb-2">
                        <div className="flex items-center gap-2 font-mono px-4 py-2 rounded-full" style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB' }}>
                            <WatcherIcon size={15} color={partnerData.primaryColor} />
                            <span className="text-bold text-gray-900 dark:text-white">{`${viewerCount ?? 0}`}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono px-4 py-2 rounded-full" style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB' }}>
                            <span className="text-gray-600 dark:text-gray-400">Prize:</span>
                            <span className="font-bold text-gray-900 dark:text-white">1000$</span>
                            <img
                                src="https://ik.imagekit.io/cafu/$SCAN/scan.png?updatedAt=1746620925756&ik-s=83f8422add9570195a66cd510d3f1c5e884a50d1"
                                alt="SCAN"
                                className="w-5 h-5 rounded-full"
                            />
                        </div>
                    </div>


                    <div className="hidden md:flex items-center mb-4">
                        <FaTrophy style={{ color: partnerData.primaryColor }} className="text-3xl mr-2" />

                        <p className="text-lg font-bold text-gray-800 dark:text-white">
                            {isCompleted ? (
                                <span style={{ color: partnerData.primaryColor }}>is Claimed!</span>
                            ) : (
                                <>Prizes: <span style={{ color: partnerData.primaryColor }}>${partnerData.prizes}</span></>
                            )}
                        </p>
                    </div>

                    <div className="relative w-[320px] h-[320px] md:w-[440px] md:h-[440px] border border-gray-300 rounded-lg grid grid-cols-3 grid-rows-3 qrCube">
                        {piecesState.map((piece, index) => (
                            <div
                                key={index}
                                className={`relative border border-gray-300 group ${piece.pulse ? `animate-pulse border border-[${partnerData.primaryColor}]` : ""
                                    }`}
                            >
                                {piece.image ? (
                                    <>
                                        {typeof piece.image === 'string' && piece.image.startsWith('http') ? (
                                            <img
                                                src={piece.image}
                                                alt={`Grid ${index + 1}`}
                                                className="absolute inset-0 w-full h-full rounded-md object-cover"
                                            />
                                        ) : (
                                            <Image
                                                src={piece.image}
                                                alt={`Grid ${index + 1}`}
                                                fill
                                                className="rounded-md object-cover"
                                                sizes="(max-width: 440px) 33vw, 146px"
                                            />
                                        )}
                                        {!piece.reached &&
                                            <div className="absolute inset-0 flex items-end justify-center p-2">
                                                <div className="text-white text-center">
                                                    <p className="font-extrabold text-[10px]">
                                                        Unlock at
                                                    </p>
                                                    <p className="font-bold text-[10px] mt-1">
                                                        {reversedMilestones[index]} WINS
                                                    </p>
                                                </div>
                                            </div>
                                        }
                                    </>
                                ) : (
                                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
                                )}
                            </div>
                        ))}
                    </div>

                    {isCompleted ? (
                        <div className="flex items-center mt-8">
                            <Image
                                src={scan}
                                alt="logo"
                                width={20}
                                height={20}
                                style={{ objectFit: 'cover', marginRight: '5px' }}
                            />
                            <p className="text-lg font-bold text-gray-800 dark:text-white">SCAN to see winners</p>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center space-x-2 bg-white border border-gray-500/50 dark:border-gray-400/50 px-4 py-1 rounded-full mt-6 mb-2">
                            <WatcherIcon size={15} color={partnerData.primaryColor} />
                            <span className="text-bold text-gray-900 dark:text-white">{`${viewerCount ?? 0}`}</span>
                            <span className="text-gray-500 dark:text-gray-400">People watching</span>
                        </div>
                    )}
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
