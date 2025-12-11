"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QrBaseProvider } from "./provider/QrBaseProvider";
import { QrBaseBanner } from './sections/QrBaseBanner';
import { QrBaseBannerScan } from './sections/QrBaseBannerScan';
import { lockedImages, unlockedImages } from "@/src/app/types/imageAssets";
import scanData from '@/src/app/data/partnerData.json';
import QrBaseFooterMobile from './sections/QrBaseFooterMobile';
import QrBaseFooter from './sections/QrBaseFooter';
import QrBaseQrcodeItems from './sections/QrBaseQrcodeItems';
import QrBaseQrcodeItemsScan from './sections/QrBaseQrcodeItemsScan';
import QrBasePartnerInfo from './sections/QrBasePartnerInfo';
import QrBaseCoinInfo from './sections/QrBaseCoinInfo';
import QrBaseCoinInfoScan from './sections/QrBaseCoinInfoScan';
import QrBaseNavbar from './sections/QrBaseNavbar';
import QrBasePartnerList from './sections/QrBasePartnerList';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { PieceState, CoinDisplay, TokenData } from "@/src/app/types";
import { decryptObject, decryptObjectFullImage, getNeynarUser } from "@/src/app/utils/encrypt_decrypt";
import Confetti from 'react-confetti-boom';
import TokenIcon from "../images/svg/tab/TokenIcon";
import QrIcon from "../images/svg/tab/QrIcon";
import ProgressIcon from "../images/svg/tab/ProgressIcon";
import { usePathname } from "next/navigation";
import { useLiveCounterWS } from "../utils/useLiveCounterWS";


// Config for environment variables
const config = {
  API_KEY_CLOUD: process.env.NEXT_PUBLIC_API_KEY ?? "",
  COIN_INFO_ENDPOINT: "/api/coinInfo",
  ALL_MARKET_CAP_ENDPOINT: "/api/getAllMaxMarketCap",
  POLL_INTERVAL: 5000,
  WORKER_PROXY_URL: "/api/proxyFullImages",
  CHAIN_ID: "0x2105",
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  MORALIS_API_KEY: process.env.NEXT_PUBLIC_MORALIS_API_KEY ?? "",
  MORALIS_API_BASE_URL: "https://deep-index.moralis.io/api/v2.2",
};

export default function QrBaseMain({ partnerData }: any) {
  const [ownedNFTCount, setOwnedNFTCount] = useState(0);
  const [coinInfo, setCoinInfo] = useState<TokenData | null>(null);
  const [fullImages, setFullImages] = useState<string[]>([]);
  const [piecesState, setPiecesState] = useState<PieceState[]>([]);
  const [scanBalance, setScanBalance] = useState<number | null>(null);
  const [partnerBalance, setPartnerBalance] = useState<number | null>(null);
  const [scanLogo, setScanLogo] = useState<string>(scanData[0].logo);
  const [hasEnoughScan, setHasEnoughScan] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const pathname: any = usePathname()
  const endpoint = `${process.env.NEXT_PUBLIC_LIVE_COUNTER_WS_BASE}/ws?pageId=${encodeURIComponent(pathname !== '/' ? pathname : "/base/0x20429F731096e359910921994A267d32ef576720")}`
  const count = useLiveCounterWS(endpoint)
  const [address, setAddress] = useState<string | null>(null);
  const [coinsBoughtDisplay, setCoinsBoughtDisplay] = useState<CoinDisplay[]>([]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const isPoolReset = useRef<boolean>(false);
  const isBalanceFetched = useRef<boolean>(false);
  const [allMarketCap, setAllMarketCap] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [activeSection, setActiveSection] = useState<'token' | 'qr' | 'progress' | null>(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


 useEffect(() => {
        async function fetchFarcasterAddress() {
            if (user?.farcaster?.fid) {
                setLoading(true);
                setError(null);
                try {
                    const fid = user.farcaster.fid;
                    const data = await getNeynarUser(`${fid}`)
                    const fetchedAddress = data.address ?? null;
                    setAddress(fetchedAddress);

                } catch (err: any) {
                    console.error("Error fetching Farcaster address:", err);
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            } else if (wallets.length > 0 && !address) {
                const linkedWallet = wallets.find((w) => w.linked);
                if (linkedWallet?.address) setAddress(linkedWallet.address);
            }
        }
        fetchFarcasterAddress();
    }, [user?.farcaster?.fid, wallets, address]);

  useEffect(() => {
    console.log(
      count !== null
        ? `${count} watching live ( pathname ${pathname} )`
        : 'Loading…'
    )
  }, [pathname, count, endpoint])




  useEffect(() => {

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (windowSize.width < 768) {
      setActiveSection("qr");
    } else {
      setActiveSection(null);
    }
  }, [windowSize.width]);

  const handleRoundChange = (newRound: number) => {
    setCurrentRound(newRound);
  };

  useEffect(() => {
    setCoinInfo(null);
    setFullImages([]);
    setPiecesState([]);
    setScanBalance(null);
    setPartnerBalance(null);
    setHasEnoughScan(null);
    setOwnedNFTCount(0);
    setIsLoading(false);
    setIsSuccess(false);
    setScanLogo(scanData[0].logo);
    isPoolReset.current = true;
    isBalanceFetched.current = false;
  }, [partnerData.pool]);

  const fetchPrice = useCallback(
    async (isManualFetch: boolean = false) => {
      if (isManualFetch) setIsLoading(true);
      try {
        const coinInforesponse = await fetch(config.COIN_INFO_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": config.API_KEY_CLOUD,
          },
          body: JSON.stringify({ pool: partnerData.pool, id: partnerData.id }),
        });

        if (!coinInforesponse.ok) {
          console.error("Failed to fetch coin info");
          return;
        }

        const coinInfoData = await coinInforesponse.json();
        const decryptCoinInfoData = decryptObject(coinInfoData);
        setCoinInfo({
          priceInUsd: decryptCoinInfoData.lastPrice,
          volumeUsd: decryptCoinInfoData.volumeUsd,
          maxMarketCap: decryptCoinInfoData.maxMarketCap,
        });
      } catch (error) {
        console.error("Fetch coin info error:", error);
      } finally {
        if (isManualFetch) setIsLoading(false);
      }
    },
    [partnerData.pool]
  );

  useEffect(() => {

    fetchPrice(true);

  }, [fetchPrice, partnerData.pool, address, wallets]);

  useEffect(() => {

    const intervalId = setInterval(() => fetchPrice(false), config.POLL_INTERVAL);
    return () => clearInterval(intervalId);

  }, [fetchPrice]);

  const marketCap = useMemo(
    () => (coinInfo?.volumeUsd ? parseFloat(coinInfo.volumeUsd) : 0),
    [coinInfo?.volumeUsd]
  );

  const unlockedPieces = useMemo(() => {
    const effectiveMilestones =
      partnerData.pool === "0x2a0f410422951f53cd2f3e9f6d0f29fccb1426e9"
        ? partnerData.MILESTONES.filter((milestone: { round: number; milenstone: number[] }) => milestone.round === 2).flatMap((milestone: any) => milestone.milenstone)
        : partnerData.MILESTONES;
    const maxCap = Number(coinInfo?.maxMarketCap ?? 0);
    return Math.max(0, effectiveMilestones.filter((cap: any) => maxCap >= cap).length - 1);
  }, [coinInfo?.maxMarketCap, partnerData.MILESTONES]);

  useEffect(() => {
    setOwnedNFTCount(unlockedPieces + 1);
    async function fetchTotalPiece() {
      try {
        const maxMarketCapresponse = await fetch(config.ALL_MARKET_CAP_ENDPOINT, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "api-key": config.API_KEY_CLOUD,
          },
        });

        if (!maxMarketCapresponse.ok) {
          console.error("Failed to fetch coin info");
          return;
        }

        const maxMarketCapData = await maxMarketCapresponse.json();
        const decryptMaxMarketCapDataData = decryptObject(maxMarketCapData);
        setAllMarketCap(decryptMaxMarketCapDataData);
      } catch (e) {
        console.error("Error fetching token balances:", e);
      }
    }
    fetchTotalPiece();
  }, [unlockedPieces]);

  const onSuccess = () => {
    setIsSuccess(true);
  };

  useEffect(() => {
    async function fetchUserBalance() {
      try {
        if (!address) {
          setHasEnoughScan(null);
          setScanBalance(null);
          setPartnerBalance(null);
          isBalanceFetched.current = true;
          return;
        }

        const balanceUrl = `${config.MORALIS_API_BASE_URL}/wallets/${address}/tokens?chain=0x2105`;
        const response = await fetch(balanceUrl, {
          headers: {
            'X-API-Key': config.MORALIS_API_KEY,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const tokens = data.result || [];

        const isDualToken = partnerData?.title !== "SCAN";
        const scanTokenId = scanData[0].id.toLowerCase();
        const partnerTokenId = partnerData?.id?.toLowerCase();
        const tokenAddresses = isDualToken ? [scanTokenId, partnerTokenId] : [scanTokenId];

        const balances: Record<string, string> = {};
        const coinDisplay: CoinDisplay[] = [];

        for (const tokenAddress of tokenAddresses) {
          const result = tokens.find((r: any) => r.token_address.toLowerCase() === tokenAddress.toLowerCase());
          const balance = result && result?.balance_formatted ? result.balance_formatted : '0';
          balances[tokenAddress] = balance;
          const logo = tokenAddress === scanTokenId ? scanLogo : partnerData.logo;
          coinDisplay.push({ balance, logo });
        }

        const scanBal = balances[scanTokenId] ?? 0;
        setScanBalance(parseFloat(scanBal));
        setCoinsBoughtDisplay(coinDisplay);

        let hasEnough = parseFloat(scanBal) >= scanData[0]?.MIN_TOKEN_BALANCE;

        if (isDualToken) {
          const partnerBal = balances[partnerTokenId] ?? 0;
          setPartnerBalance(parseFloat(partnerBal));
          hasEnough = hasEnough && parseFloat(partnerBal) >= (partnerData?.MIN_TOKEN_BALANCE ?? 0);
        }

        setHasEnoughScan(hasEnough);
        setIsSuccess(false);
        isBalanceFetched.current = true;
      } catch (e) {
        console.error("Error fetching token balances:", e);
        setHasEnoughScan(false);
        setScanBalance(null);
        setPartnerBalance(null);
        isBalanceFetched.current = true;
      }
    }


    fetchUserBalance();

  }, [address, partnerData.title, partnerData.id, isSuccess, scanLogo, partnerData.pool]);

  const fetchFullImages = useCallback(
    async () => {
      try {
        const response = await fetch(config.WORKER_PROXY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": config.API_KEY_CLOUD!,
          },
          body: JSON.stringify({ pool: partnerData.pool }),
        });
        const data = await response.json();
        const decrypted = await decryptObjectFullImage(data);
        setFullImages(decrypted);
      } catch (error) {
        console.error("Error fetching full images:", error);
      }
    },
    [partnerData.pool]
  );

  useEffect(() => {
    if (!isPoolReset.current || !isBalanceFetched.current) {
      return;
    }
    if (hasEnoughScan === true && unlockedPieces > 0) {
      fetchFullImages();
    } else {
      setFullImages([]);
    }
  }, [fetchFullImages, unlockedPieces, hasEnoughScan, partnerData.pool]);

  useEffect(() => {
    const filteredLockedImages = lockedImages.filter((item: any) => item.id === partnerData.pool);
    const filteredUnlockedImages = unlockedImages.filter((item: any) => item.id === partnerData.pool);
    const updatedPieces: PieceState[] = Array(9)
      .fill(null)
      .map((_, i) => ({ image: filteredLockedImages[0]?.images[i]?.src || "" }));

    updatedPieces[8] = { image: partnerData.FIRST_IMAGE_SRC };

    const placementOrder = [7, 6, 5, 4, 3, 2, 1, 0];
    for (let i = 0; i < Math.min(unlockedPieces, placementOrder.length); i++) {
      const index = placementOrder[i];
      updatedPieces[index] = hasEnoughScan && fullImages[i]
        ? { image: fullImages[i], reached: true }
        : { image: filteredUnlockedImages[0]?.images[index]?.src || "", link: partnerData.link, pulse: true };
    }
    setPiecesState(updatedPieces);
  }, [fullImages, unlockedPieces, hasEnoughScan, partnerData.pool]);

  return (
    <QrBaseProvider>
      {!ready ? (
        <div className="flex justify-center items-center h-screen">
          <img 
            src="/images/gif/QRbase-claim-links-work.gif" 
            alt="Loading..." 
            className="w-64 h-64 object-contain"
          />
        </div>
      ) : (
        <div className="relative flex h-full max-h-screen max-w-full flex-col font-sansMono">
          {partnerData.title === 'SCAN' ? (
            <QrBaseBannerScan round={partnerData.round} currentRound={currentRound} />
          ) : (
            <QrBaseBanner round={partnerData.round} isCompleted={ownedNFTCount === 9} />
                      )}

          <QrBaseNavbar coinsBoughtDisplay={coinsBoughtDisplay} address={address} loading={loading} />

          {ownedNFTCount === 9 && hasEnoughScan && (
            <>
              <Confetti
                style={{ zIndex: 51 }}
                mode="fall"
                particleCount={500}
                colors={[partnerData.PRIMARY_COLOR, partnerData.GRADIENT_END, partnerData.GRADIENT_START, partnerData.GRAY_LIGHT]}
              />
              <Confetti
                style={{ zIndex: 51 }}
                mode="boom"
                effectInterval={10000}
                particleCount={100}
                colors={[partnerData.PRIMARY_COLOR, partnerData.GRADIENT_END, partnerData.GRADIENT_START, partnerData.GRAY_LIGHT]}
                effectCount={2}
              />
            </>
          )}

          <QrBasePartnerList allMarketCap={allMarketCap} />

          {activeSection === null && (
            <main className="mx-auto flex max-w-7xl grow flex-col">
              <div className="flex grow flex-col md:flex-row containQrBase">
                <div className="flex grow flex-col md:flex-row">
                  <QrBasePartnerInfo
                    scanBalance={scanBalance}
                    partnerBalance={partnerBalance}
                    partnerData={partnerData}
                    scanData={scanData[0]}
                    currentRound={currentRound}
                  />
                  {partnerData.title === 'SCAN' ? (
                    <QrBaseQrcodeItemsScan
                      partnerData={partnerData}
                      piecesState={piecesState}
                      isCompleted={ownedNFTCount === 9}
                      countWatcher={count}
                      onRoundChange={handleRoundChange}
                    />
                  ) : (
                    <QrBaseQrcodeItems
                      partnerData={partnerData}
                      piecesState={piecesState}
                      isCompleted={ownedNFTCount === 9}
                      countWatcher={count}
                    />
                  )}
                  {partnerData.title === 'SCAN' ? (
                    <QrBaseCoinInfoScan
                      coinInfo={coinInfo}
                      marketCap={marketCap}
                      maxMarketCap={coinInfo?.maxMarketCap}
                      partnerData={partnerData}
                      isLoading={isLoading}
                      isCompleted={partnerData.isClaimed}
                      currentRound={currentRound}
                    />
                  ) : (
                    <QrBaseCoinInfo
                      coinInfo={coinInfo}
                      marketCap={marketCap}
                      maxMarketCap={coinInfo?.maxMarketCap}
                      partnerData={partnerData}
                      isLoading={isLoading}
                      isCompleted={partnerData.isClaimed}
                    />
                  )}
                </div>
              </div>
              <QrBaseFooter
                ownedNFTCount={ownedNFTCount}
                partnerData={partnerData}
                scanBalance={scanBalance}
                partnerBalance={partnerBalance}
                hasEnoughScan={hasEnoughScan}
                onSuccess={onSuccess}
              />
            </main>
          )}

          {activeSection !== null && (
            <main className="mx-auto flex max-w-7xl grow flex-col">
              <div className="flex grow flex-col md:flex-row containQrBase">
                <div className="flex grow flex-col md:flex-row">
                  {activeSection === "token" && (
                    <QrBasePartnerInfo
                      scanBalance={scanBalance}
                      partnerBalance={partnerBalance}
                      partnerData={partnerData}
                      scanData={scanData[0]}
                      currentRound={currentRound}
                    />
                  )}
                  {partnerData.title === 'SCAN' ? (
                    <>
                      {activeSection === "qr" && (
                        <div className="qrMobile">
                          <div className="qrMobileHeight">
                            <QrBaseQrcodeItemsScan
                              partnerData={partnerData}
                              piecesState={piecesState}
                              isCompleted={ownedNFTCount === 9}
                              countWatcher={count}
                              onRoundChange={handleRoundChange}
                            />
                            <QrBaseFooterMobile
                              ownedNFTCount={ownedNFTCount}
                              partnerData={partnerData}
                              scanBalance={scanBalance}
                              partnerBalance={partnerBalance}
                              hasEnoughScan={hasEnoughScan}
                              onSuccess={onSuccess}
                            />
                          </div>
                        </div>
                      )}
                      {activeSection === "progress" && (
                        <div className="progressMobile">
                          <div className="progressMobile1">
                            <QrBaseCoinInfoScan
                              coinInfo={coinInfo}
                              marketCap={marketCap}
                              maxMarketCap={coinInfo?.maxMarketCap}
                              partnerData={partnerData}
                              isLoading={isLoading}
                              isCompleted={partnerData.isClaimed}
                              currentRound={currentRound}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {activeSection === "qr" && (
                        <div className="qrMobile">
                          <div className="qrMobileHeight">
                            <QrBaseQrcodeItems
                              partnerData={partnerData}
                              piecesState={piecesState}
                              isCompleted={ownedNFTCount === 9}
                              countWatcher={count}
                            />
                            <QrBaseFooterMobile
                              ownedNFTCount={ownedNFTCount}
                              partnerData={partnerData}
                              scanBalance={scanBalance}
                              partnerBalance={partnerBalance}
                              hasEnoughScan={hasEnoughScan}
                              onSuccess={onSuccess}
                            />
                          </div>
                        </div>
                      )}
                      {activeSection === "progress" && (
                        <div className="progressMobile">
                          <div className="progressMobile1">
                            <QrBaseCoinInfo
                              coinInfo={coinInfo}
                              marketCap={marketCap}
                              maxMarketCap={coinInfo?.maxMarketCap}
                              partnerData={partnerData}
                              isLoading={isLoading}
                              isCompleted={partnerData.isClaimed}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="fixed bottom-0 left-0 w-full bg-white border-t md:hidden flex justify-around items-center p-2">
                <button className="flex flex-col items-center" onClick={() => setActiveSection('token')}>
                  <span className="text-blue-500">
                    <TokenIcon size={20} color={activeSection === 'token' ? partnerData.PRIMARY_COLOR : '#6B7280'} />
                  </span>
                  <span className="tabTitle" style={{ color: activeSection === 'token' ? partnerData.PRIMARY_COLOR : '#6B7280' }}>Token Info</span>
                </button>
                <button className="flex flex-col items-center" onClick={() => setActiveSection('qr')}>
                  <span>
                    <QrIcon size={20} color={activeSection === 'qr' ? partnerData.PRIMARY_COLOR : '#6B7280'} />
                  </span>
                  <span style={{ color: activeSection === 'qr' ? partnerData.PRIMARY_COLOR : '#6B7280' }} className="tabTitle">Qrcode</span>
                </button>
                <button className="flex flex-col items-center" onClick={() => setActiveSection('progress')}>
                  <span>
                    <ProgressIcon size={20} color={activeSection === 'progress' ? partnerData.PRIMARY_COLOR : '#6B7280'} />
                  </span>
                  <span style={{ color: activeSection === 'progress' ? partnerData.PRIMARY_COLOR : '#6B7280' }} className="tabTitle">Progress</span>
                </button>
              </div>
            </main>
          )}
        </div>
      )}
    </QrBaseProvider>
  );
}