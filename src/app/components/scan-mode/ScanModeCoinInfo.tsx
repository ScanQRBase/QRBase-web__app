'use client';

import React, { useEffect, useState } from 'react';
import { Tooltip } from '@mui/material';
import { formatLargeValue } from '../../lib/utils';
import Timeline from '@mui/lab/Timeline';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import CheckIcon from '@mui/icons-material/Check';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import { styled } from '@mui/material/styles';
import lock from '@/src/app/images/svg/lock.svg';
import gift from '@/src/app/images/svg/gift.svg';
import logo from '@/src/app/images/logo/white-bg-logo.png';
import Image from 'next/image';
import InfoIcon from '@/src/app/images/svg/utils/InfoIcon';
import { ExternalLinkSvg } from '@/src/app/images/svg/utils/ExternalLinkSvg';
import { useSpring, animated } from '@react-spring/web';

interface ScanModeCoinInfoProps {
    progress: {
        totalWins: number;
        milestones: number[];
        piecesUnlocked: number;
        totalPieces: number;
        primaryColor: string;
        gradientStart: string;
        gradientEnd: string;
        round: string;
        partnerName: string;
    };
    isLoading?: boolean;
    isCompleted?: boolean;
}

/**
 * Right sidebar: community puzzle wins timeline,
 * MUI Timeline matching QrBaseCoinInfo format exactly.
 */
export default function ScanModeCoinInfo({ progress, isLoading = false, isCompleted = false }: ScanModeCoinInfoProps) {
    const {
        totalWins,
        milestones,
        piecesUnlocked,
        totalPieces,
        primaryColor,
        gradientStart,
        gradientEnd,
        round,
        partnerName,
    } = progress;

    // Build timeline items from milestones — label as "X Puzzle Wins"
    const timelineItems = milestones.map((milestone) => ({
        title: `${milestone}`,
        value: milestone,
        description: 'Puzzle Wins',
    }));

    // Add final "Round 2" locked item
    timelineItems.push({
        title: 'Round 2',
        value: Infinity,
        description: '',
    });

    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const lastReachedIndex = timelineItems.findIndex((item) => totalWins < item.value);
    const lastReached = lastReachedIndex === -1 ? timelineItems.length - 1 : lastReachedIndex - 1;

    const GRAY_LIGHT = '#D1D5DB';
    const WHITE = '#FFFFFF';

    const BorderLinearProgress = styled(LinearProgress)(() => ({
        height: 10,
        borderRadius: 5,
        marginTop: 5,
        [`&.${linearProgressClasses.colorPrimary}`]: {
            backgroundColor: '#E5E7EB',
        },
        [`& .${linearProgressClasses.bar}`]: {
            borderRadius: 5,
            backgroundImage: `linear-gradient(to right, ${gradientStart}, ${gradientEnd})`,
        },
    }));

    // Loading pulse animation
    useEffect(() => {
        if (!isLoading) return;
        const interval = setInterval(() => {
            setHighlightedIndex((prev) => {
                if (prev < timelineItems.length) return prev + 1;
                clearInterval(interval);
                return prev;
            });
        }, 200);
        return () => {
            setHighlightedIndex(0);
            clearInterval(interval);
        };
    }, [isLoading]);



    // Animated wins counter
    const springWins = useSpring({
        number: totalWins,
        config: { tension: 120, friction: 20 },
    });

    // Animated pieces counter
    const springPieces = useSpring({
        number: piecesUnlocked,
        config: { tension: 120, friction: 20 },
    });

    // Dot styling matching QrBaseCoinInfo
    const dotStyle = (isCurrent: boolean, isMaxReached: boolean) => ({
        width: 20,
        height: 20,
        border: `2px solid ${isCurrent || isMaxReached ? primaryColor : GRAY_LIGHT}`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative' as const,
        backgroundColor: isMaxReached && !isCurrent ? primaryColor : 'transparent',
    });

    const timelineDotStyle = (isCurrent: boolean, isMaxReached: boolean) => ({
        backgroundColor: isCurrent ? primaryColor : GRAY_LIGHT,
        width: isCurrent ? 7 : isMaxReached ? 17 : 7,
        height: isCurrent ? 7 : isMaxReached ? 17 : 7,
        margin: 0,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        boxShadow: !isCurrent ? 'none' : '',
    });

    const progressPercent = Math.min(((lastReached + 1) / (timelineItems.length - 1)) * 100, 100);

    const displayName = partnerName === 'Base is for everyone' ? 'Base'
        : partnerName === 'MINT CLUB' ? 'MT'
            : partnerName.toUpperCase();

    return (
        <div className="qrRoad flex flex-col justify-start md:justify-center border-gray-200 dark:border-gray-700 border-b p-4 py-8 pb-12 w-full md:w-1/3 md:border-l md:border-b-0 md:py-4 md:pt-[75px] lg:border-l lg:p-6 lg:pb-22 lg:pt-[75px] transition-colors duration-200">
            <div className="coinInfoBlock w-full">
                {/* Header: $TOKEN Price + MARKET CAP (matching base mode QrBaseCoinInfo) */}
                <div className="flex justify-between items-start mb-6">
                    <div className="coinInfoPrice flex flex-col items-start bg-gray-100 dark:bg-gray-800 rounded-lg p-2 transition-colors duration-200">
                        <div className="flex cursor-pointer items-center text-[0.85rem]">
                            <p className="leading-relaxed text-[0.65rem] text-gray-700 dark:text-gray-300">Total Wins</p>
                            <div className="relative w-fit ms-1">
                                <div className="h-[8px] w-[8px] rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                <div
                                    className="absolute left-0 top-0 h-[8px] w-[8px] rounded-full animate-ping"
                                    style={{ backgroundColor: primaryColor }}
                                ></div>
                            </div>
                        </div>
                        <Tooltip title={`${totalWins} total wins`}>
                            <p className="text-lg font-bold text-[0.85rem]" style={{ color: primaryColor }}>
                                <animated.span style={{ color: primaryColor }}>
                                    {springWins.number.to((val) => `${Math.round(val)}`)}
                                </animated.span>
                            </p>
                        </Tooltip>
                    </div>
                    <div className="coinInfoPrice flex flex-col items-start bg-gray-100 dark:bg-gray-800 rounded-lg p-2 transition-colors duration-200">
                        <div className="flex cursor-pointer items-center text-[0.85rem]">
                            <p className="leading-relaxed text-[0.65rem] text-gray-700 dark:text-gray-300">PIECES UNLOCKED</p>
                            <span className="pl-1">
                                <ExternalLinkSvg />
                            </span>
                        </div>
                        <Tooltip title={`${piecesUnlocked}/${totalPieces} pieces unlocked`}>
                            <p className="text-lg font-bold text-[0.85rem]" style={{ color: primaryColor }}>
                                <animated.span style={{ color: primaryColor }}>
                                    {springPieces.number.to((val) => `${Math.round(val)}/${totalPieces}`)}
                                </animated.span>
                            </p>
                        </Tooltip>
                    </div>
                </div>


                {/* Progress Header */}
                <h2
                    className="font-bold text-2xl leading-tight text-gray-900 dark:text-white"
                    style={{
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        fontWeight: 700,
                        fontStretch: 'condensed',
                        WebkitBackgroundClip: 'text',
                        fontSize: '20px',
                        marginBottom: '20px',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex' }}>
                            Community Progress :{' '}
                            <span style={{ color: primaryColor, marginLeft: '6px' }}>
                                {progressPercent.toFixed(1)}%
                            </span>
                        </div>
                        <Tooltip title="This timeline advances with total QR Puzzle wins from all players" placement="top">
                            <span>
                                <InfoIcon size={20} color={primaryColor} style={{ objectFit: 'none', cursor: 'pointer' }} />
                            </span>
                        </Tooltip>
                    </div>
                    <BorderLinearProgress variant="determinate" value={progressPercent} />
                </h2>

                {/* MUI Timeline */}
                <div className="relative">
                    <Timeline
                        sx={{
                            [`& .${timelineItemClasses.root}:before`]: { flex: 0, padding: 0 },
                            padding: 0,
                            margin: 0,
                            marginLeft: '8px',
                        }}
                    >
                        {/* Loading state */}
                        {isLoading &&
                            timelineItems.map((_, index) => (
                                <TimelineItem key={index} sx={{ minHeight: 14, margin: 0 }}>
                                    <TimelineSeparator>
                                        <div
                                            style={{
                                                backgroundColor:
                                                    index < highlightedIndex ? primaryColor : GRAY_LIGHT,
                                            }}
                                            className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center pulse-dot"
                                        />
                                        {index !== timelineItems.length - 1 && (
                                            <TimelineConnector sx={{ height: 25, backgroundColor: index < highlightedIndex ? primaryColor : GRAY_LIGHT }} />
                                        )}
                                    </TimelineSeparator>
                                    <TimelineContent sx={{ paddingTop: 0, margin: 0 }}>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading...</p>
                                    </TimelineContent>
                                </TimelineItem>
                            ))}

                        {/* Loaded state */}
                        {!isLoading && timelineItems.map((item, index) => {
                            const isMaxReached = totalWins >= item.value;
                            const isCurrent = index === lastReached;
                            const isLast = index === timelineItems.length - 1;
                            const isSecondToLast = index === timelineItems.length - 2;

                            return (
                                <TimelineItem key={item.title} sx={{ minHeight: 14, margin: 0 }}>
                                    <TimelineSeparator>
                                        {(isLast || isSecondToLast) ? (
                                            <div
                                                className={`w-5 h-5 rounded-full overflow-hidden border-2 ${isMaxReached ? `border-[${primaryColor}]` : `border-[${GRAY_LIGHT}]`
                                                    } ${isMaxReached ? 'shake-effect' : ''}`}
                                            >
                                                <Image
                                                    src={isLast ? lock : logo}
                                                    alt="logo"
                                                    width={isLast ? 12 : 20}
                                                    height={isLast ? 12 : 20}
                                                    style={{
                                                        objectFit: 'cover',
                                                        filter: isSecondToLast && !isMaxReached ? 'grayscale(100%) brightness(1.2)' : undefined,
                                                        opacity: isSecondToLast && !isMaxReached ? 0.7 : 1,
                                                        margin: 'auto',
                                                        marginTop: isLast ? '1px' : undefined,
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div style={dotStyle(isCurrent, isMaxReached)}>
                                                {isMaxReached && !isCurrent ? (
                                                    <CheckIcon style={{ fontSize: 16, color: WHITE }} />
                                                ) : (
                                                    <>
                                                        <TimelineDot sx={timelineDotStyle(isCurrent, isMaxReached)} />
                                                        {isCurrent && (
                                                            <div
                                                                className="absolute h-[16px] w-[16px] rounded-full animate-ping"
                                                                style={{ backgroundColor: primaryColor, opacity: 0.6 }}
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        {!isLast && (
                                            <TimelineConnector
                                                sx={{ height: 25, backgroundColor: isMaxReached ? primaryColor : GRAY_LIGHT }}
                                            />
                                        )}
                                    </TimelineSeparator>
                                    <TimelineContent sx={{ paddingTop: 0, margin: 0, display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <strong
                                            style={{
                                                fontSize: 14,
                                                background: isMaxReached
                                                    ? `linear-gradient(to right, ${gradientStart}, ${gradientEnd})`
                                                    : undefined,
                                                WebkitBackgroundClip: isMaxReached ? 'text' : undefined,
                                                WebkitTextFillColor: isMaxReached ? 'transparent' : undefined,
                                            }}
                                        >
                                            {item.title}
                                        </strong>
                                        {item.description && (
                                            <p className="text-sm leading-relaxed" style={{ fontSize: 12, margin: 0, color: '#6B7280' }}>
                                                {item.description}
                                            </p>
                                        )}
                                    </TimelineContent>

                                    {/* Gift badge — same TimelineConnector approach as QrBaseCoinInfo */}
                                    {(isSecondToLast || isLast) && (
                                        <TimelineConnector
                                            sx={{
                                                height: 24,
                                                backgroundColor: isCompleted ? primaryColor : GRAY_LIGHT,
                                                borderRadius: 15,
                                                color: isSecondToLast ? WHITE : '#000000',
                                                display: isSecondToLast ? 'flex' : 'none',
                                                fontSize: 10,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                opacity: isCompleted ? 1 : 0.5,
                                            }}
                                        >
                                            {isSecondToLast && (
                                                <Image src={gift} alt="Gift" width={20} height={20} style={{ objectFit: 'none', margin: '0 2px 2px 0' }} />
                                            )}
                                            {isCompleted ? 'Prize Claimed' : 'Scan QR'}
                                        </TimelineConnector>
                                    )}
                                </TimelineItem>
                            );
                        })}
                    </Timeline>
                </div>
            </div>
        </div>
    );
}
