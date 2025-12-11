import React, { useEffect, useRef, useState } from 'react';
import { Tooltip } from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import { ExternalLinkSvg } from '@/src/app/images/svg/utils/ExternalLinkSvg';
import logo from '@/src/app/images/logo/white-bg-logo.png';
import gift from '@/src/app/images/svg/gift.svg';
import lock from '@/src/app/images/svg/lock.svg';
import Image from 'next/image';
import CheckIcon from '@mui/icons-material/Check';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import { styled } from '@mui/material/styles';
import InfoIcon from '@/src/app/images/svg/utils/InfoIcon';



export default function QrBaseCoinInfo({ coinInfo, marketCap, maxMarketCap, partnerData, isLoading, isCompleted }: any) {
  const timelineItems = partnerData.timelineItems
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const lastReachedIndex = timelineItems.findIndex((item: any) => marketCap < item.value);
  const lastReached = lastReachedIndex === -1 ? timelineItems.length - 1 : lastReachedIndex - 1;
  const [phase, setPhase] = useState(coinInfo?.phase || 'progress'); // Track phase


  const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: partnerData.BACKGROUND, // Empty track color
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 5,
      backgroundImage: `linear-gradient(to right, ${partnerData.GRADIENT_START}, ${partnerData.GRADIENT_END})`, // Gradient
    },
  }));



  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setHighlightedIndex((prev) => {
        if (prev < timelineItems.length) {
          return prev + 1;
        } else {
          clearInterval(interval);

          return prev;
        }
      });
    }, 200); // Change color every 500ms

    return () => {
      setHighlightedIndex(0)
      clearInterval(interval);
    }
  }, [isLoading]);



  const hours = Math.floor(coinInfo?.remainingTime?.hours);
  const minutes = Math.floor(coinInfo?.remainingTime?.minutes);
  const seconds = Math.floor(coinInfo?.remainingTime?.seconds);



  // Common styles with color variables
  const dotStyle = (isCurrent: boolean, isMaxReached: boolean) => ({
    width: 20,
    height: 20,
    border: `2px solid ${isCurrent || isMaxReached ? partnerData.PRIMARY_COLOR : partnerData.GRAY_LIGHT}`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    backgroundColor: isMaxReached && !isCurrent ? partnerData.PRIMARY_COLOR : 'transparent',
  });

  const timelineDotStyle = (isCurrent: boolean, isMaxReached: boolean) => ({
    backgroundColor: isCurrent ? partnerData.PRIMARY_COLOR : partnerData.GRAY_LIGHT,
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

  const DEXSCREENER_URL = 'https://dexscreener.com/base/';

    // If phase === "final", show all QR as completed
  const isFinalPhase = coinInfo?.phase === 'final';
  const computedMaxReachedIndex = isFinalPhase ? timelineItems.length - 1 : lastReached;

  return (
    <div className="qrRoad flex flex-col justify-center border-gray-200 border-b p-4 py-8 pb-12 md:w-1/3 md:border-l md:border-b-0 md:py-4 lg:border-l lg:p-6 lg:pb-22 mt-5 md:mt-[40px]">
      <div className="coinInfoBlock">
        <div className="flex justify-center items-start mb-6">
          <div className="flex flex-col items-center justify-center h-screen text-white rounded-2xl" style={{ maxWidth: '100%', height: '145px', background: "linear-gradient(90deg, #50DEF5 -17.83%, #0052FF 53.18%, #AE80FF 124.2%)" }}>
            <h1 className="text-xl font-bold mb-4">{isFinalPhase ? 'New QR in' :  'QR reveal in'}</h1>
            <div className="flex gap-4 bg-white/10 rounded-2xl shadow-lg backdrop-blur-md" style={{
              margin: '0px 20px 0px 20px',
              padding: '10px 10px 10px 10px'
            }}>
              <div className="text-center">
                <p className="text-3xl font-bold">{String(hours).padStart(2, "0")}</p>
                <p className="text-sm">Hours</p>
              </div>
              <span className="text-3xl">:</span>
              <div className="text-center">
                <p className="text-3xl font-bold">{String(minutes).padStart(2, "0")}</p>
                <p className="text-sm">Minutes</p>
              </div>
              <span className="text-3xl">:</span>
              <div className="text-center">
                <p className="text-3xl font-bold">{String(seconds).padStart(2, "0")}</p>
                <p className="text-sm">Seconds</p>
              </div>
            </div>
          </div>
        </div>

        <h2
          className="font-bold text-2xl leading-tight"
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
              {partnerData.round} Progress: {' '}
              <span style={{ color: partnerData.PRIMARY_COLOR, marginLeft: '6px' }}>
                {/* {((computedMaxReachedIndex  + 1) / (timelineItems.length - 1) * 100) > 100 ? 100 : ((lastReached + 1) / (timelineItems.length - 1) * 100).toFixed(1)}% */}
                {((lastReached + 1) / (timelineItems.length) * 100).toFixed(1)}%
              </span>
            </div>
            <Tooltip title="Progress" placement="top">
              <span>
                <InfoIcon size={20} color={partnerData.PRIMARY_COLOR} style={{ objectFit: 'none', cursor: 'pointer' }} />
              </span>
            </Tooltip>
          </div>
          <BorderLinearProgress variant="determinate" value={((computedMaxReachedIndex  + 1) / (timelineItems.length - 1) * 100) > 100 ? 100 : ((lastReached + 1) / (timelineItems.length - 1) * 100)} />
        </h2>




        <div className="relative">
          <Timeline
            sx={{
              [`& .${timelineItemClasses.root}:before`]: { flex: 0, padding: 0 },
              padding: 0,
              margin: 0,
              marginLeft: '8px',
            }}
          >

            {isLoading &&
              timelineItems.map((_: any, index: any) => (
                <TimelineItem key={index} sx={{ minHeight: 14, margin: 0, zIndex: -1 }}>
                  <TimelineSeparator>
                    <div
                      style={{
                        backgroundColor:
                          index < highlightedIndex
                            ? partnerData.PRIMARY_COLOR
                            : partnerData.GRAY_LIGHT,
                      }}
                      className={`w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center pulse-dot`}
                    ></div>

                    {/* ✅ Only show connector if it's not the last item */}
                    {index !== timelineItems.length - 1 && (
                      <TimelineConnector sx={{ height: 25, backgroundColor: index < highlightedIndex ? partnerData.PRIMARY_COLOR : partnerData.GRAY_LIGHT }} />
                    )}
                  </TimelineSeparator>
                  <TimelineContent sx={{ paddingTop: 0, margin: 0 }}>
                    <p className="text-sm text-gray-500 animate-pulse">Loading MKT C...</p>
                  </TimelineContent>
                </TimelineItem>
              ))}
            {!isLoading && timelineItems.map((item: any, index: any) => {
              const isMaxReached = index <= computedMaxReachedIndex;
              const isCurrent = index === computedMaxReachedIndex;
              const isLast = index === timelineItems.length - 1;

              return (
                <TimelineItem key={item.title} sx={{ minHeight: 14, margin: 0, zIndex: -1 }}>
                  <TimelineSeparator>
                    {(isLast) ? (
                      <div
                        className={`w-5 h-5 rounded-full overflow-hidden border-2 ${isMaxReached ? `border-[${partnerData.PRIMARY_COLOR}]` : `border-[${partnerData.GRAY_LIGHT}]`
                          } ${isMaxReached ? 'shake-effect' : ''}`}
                      >
                        <Image
                          src={logo}
                          alt="logo"
                          width={20}
                          height={20}
                          style={{
                            objectFit: 'cover',
                            filter: isLast && !isMaxReached ? 'grayscale(100%) brightness(1.2)' : undefined,
                            opacity: isLast && !isMaxReached ? 0.7 : 1,
                            margin: 'auto',
                          }}
                        />
                      </div>
                    ) : (
                      <div style={dotStyle(isCurrent, isMaxReached)}>
                        {isMaxReached && !isCurrent ? (
                          <CheckIcon
                            style={{
                              fontSize: 16,
                              color: partnerData.WHITE,
                            }}

                          />
                        ) : (
                          <>
                            <TimelineDot
                              sx={timelineDotStyle(isCurrent, isMaxReached)}

                            />
                            {isCurrent && (
                              <div
                                className="absolute h-[16px] w-[16px] rounded-full animate-ping"
                                style={{ backgroundColor: partnerData.PRIMARY_COLOR, opacity: 0.6 }}
                              ></div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    {!isLast && (
                      <TimelineConnector
                        sx={{ height: 25, backgroundColor: isMaxReached ? partnerData.PRIMARY_COLOR : partnerData.GRAY_LIGHT }}
                      />
                    )}
                  </TimelineSeparator>
                  <TimelineContent sx={{ paddingTop: 0, margin: 0, display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                    <strong
                      style={{
                        fontSize: 14,
                        background: isMaxReached
                          ? `linear-gradient(to right, ${partnerData.GRADIENT_START}, ${partnerData.GRADIENT_END})`
                          : undefined,
                        WebkitBackgroundClip: isMaxReached ? 'text' : undefined,
                        WebkitTextFillColor: isMaxReached ? 'transparent' : undefined,
                      }}
                    >
                      {item.title}
                    </strong>
                    {item.description && (
                      <p className="text-sm leading-relaxed" style={{ fontSize: 12, margin: 0, color: partnerData.GRAY_TEXT }}>
                        {item.description}
                      </p>
                    )}
                  </TimelineContent>

                  {isLast && (
                    <TimelineConnector
                      sx={{
                        height: 24,
                        backgroundColor: isFinalPhase ? partnerData.PRIMARY_COLOR : partnerData.GRAY_LIGHT,
                        borderRadius: 15,
                        color: isLast ? partnerData.WHITE : partnerData.BLACK,
                        display: isLast ? 'flex' : 'none',
                        fontSize: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        opacity: isFinalPhase ? 1 : 0.5

                      }}
                    >
                      {isLast && (
                        <Image src={gift} alt="Gift" width={20} height={20} style={{ objectFit: 'none', margin: '0 2px 2px 0' }} />
                      )}
                      {/* {isFinalPhase ? 'Scan QR' : 'Scan QR'} */}
                      Scan QR
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