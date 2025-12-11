"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { QrBaseProvider } from ".";
import { QrBaseProvider } from "../components/provider/QrBaseProvider";
import { QrBaseBanner } from "../components/sections/fast-mode/QrBaseBanner";
import { lockedImages, unlockedImages } from "@/src/app/types/imageAssets";
import QrBaseFooterMobile from '../components/sections/fast-mode/QrBaseFooterMobile';
import QrBaseFooter from '../components/sections/fast-mode/QrBaseFooter';
import QrBaseQrcodeItems from '../components/sections/fast-mode/QrBaseQrcodeItems';
import QrBasePartnerInfo from '../components/sections/fast-mode/QrBasePartnerInfo';
import QrBaseCoinInfo from '../components/sections/fast-mode/QrBaseCoinInfo';
import QrBaseNavbar from '../components/sections/fast-mode/QrBaseNavbar';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { PieceState, CoinDisplay, TokenData } from "@/src/app/types";
import { decryptObject, decryptObjectFullImage, getNeynarUser } from "@/src/app/utils/encrypt_decrypt";
import Confetti from 'react-confetti-boom';
import TokenIcon from "../images/svg/tab/TokenIcon";
import QrIcon from "../images/svg/tab/QrIcon";
import ProgressIcon from "../images/svg/tab/ProgressIcon";
import { usePathname } from "next/navigation";
import { useLiveCounterWS } from "../utils/useLiveCounterWS";
import partnerData from "@/src/app/components/sections/fast-mode/data.json";
import ShareModalFastmode from "../components/sections/modals/ShareModalFastmode";

// Config for environment variables
const config = {
  API_KEY_CLOUD: process.env.NEXT_PUBLIC_API_KEY ?? "",
  COIN_INFO_ENDPOINT: "/api/fastmodeCoinInfo",
  ALL_MARKET_CAP_ENDPOINT: "/api/getAllMaxMarketCap",
  POLL_INTERVAL: 1000,
  WORKER_PROXY_URL: "/api/fastmodeImages",
  CHAIN_ID: "0x2105",
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  MORALIS_API_KEY: process.env.NEXT_PUBLIC_MORALIS_API_KEY ?? "",
  MORALIS_API_BASE_URL: "https://deep-index.moralis.io/api/v2.2",
  SHARE_API: "/api/checkShare"
};

export default function QrBaseFastmode() {
  const [ownedNFTCount, setOwnedNFTCount] = useState(0);
  const [coinInfo, setCoinInfo] = useState({
    maxMarketCap: 0, startTime: 1760135236183,
    endTime: 1760135716183,
    remainingTime: { ms: 241752, minutes: 4, seconds: 1, hours: 0 },
    phase: "progress",
    activeImage: "/images/gif/QRbase-claim-links-work.gif"
  });
  const [fullImages, setFullImages] = useState<string[]>([]);
  const [piecesState, setPiecesState] = useState<PieceState[]>([]);
  const [scanBalance, setScanBalance] = useState<number | null>(null);
  const [partnerBalance, setPartnerBalance] = useState<number | null>(null);
  const [scanLogo, setScanLogo] = useState<string>(partnerData[1].logo);
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
  const [currentRound, setCurrentRound] = useState(0);
  const [nftData, setNftData] = useState<any[] | null>(null);
  const [hasEnoughScan, setHasEnoughScan] = useState<boolean | null>(null);
  const [activeSection, setActiveSection] = useState<'token' | 'qr' | 'progress' | null>(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [shareData, setShareData] = useState(null)
  const [isModalOpen, setModalOpen] = useState(false);
  const [scanInfo, setScanInfo] = useState<any | null>({ priceInUsd: 0.00008 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    async function fetchScanInfo() {
      try {
        const scanInforesponse = await fetch('/api/coinInfo', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": config.API_KEY_CLOUD,
          },
          body: JSON.stringify({ pool: '0x2a0f410422951f53cd2f3e9f6d0f29fccb1426e9', id: '0x20429F731096e359910921994A267d32ef576720' }),
        });

        if (!scanInforesponse.ok) {
          console.error("Failed to fetch coin info");
          return;
        }

        const coinInfoData = await scanInforesponse.json();
        const decryptCoinInfoData = decryptObject(coinInfoData);
        setScanInfo({
          priceInUsd: decryptCoinInfoData.lastPrice,
        });
      } catch (error) {
        console.error("Fetch coin info error:", error);
      }
    }
    fetchScanInfo();
  }, []);



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
          body: JSON.stringify({ pool: partnerData[0].pool, id: partnerData[0].id }),
        });

        if (!coinInforesponse.ok) {
          console.error("Failed to fetch coin info");
          return;
        }

        const coinInfoData = await coinInforesponse.json();
        const decryptCoinInfoData = decryptObject(coinInfoData);
        setCoinInfo({
          maxMarketCap: decryptCoinInfoData.maxMarketCap,
          startTime: decryptCoinInfoData.startTime,
          endTime: decryptCoinInfoData.endTime,
          remainingTime: decryptCoinInfoData.remainingTime,
          phase: decryptCoinInfoData.phase,
          activeImage: decryptCoinInfoData.activeImage
        });
      } catch (error) {
        console.error("Fetch coin info error:", error);
      } finally {
        if (isManualFetch) setIsLoading(false);
      }
    },
    [partnerData[0].pool]
  );


  useEffect(() => {

    fetchPrice(true);

  }, [fetchPrice, partnerData[0].pool, address, wallets]);



  useEffect(() => {

    const intervalId = setInterval(() => fetchPrice(false), config.POLL_INTERVAL);
    return () => clearInterval(intervalId);

  }, [fetchPrice]);


  const nftInfo = {
    address: "0x5ad20cc3e37f234d3a6690fea121d94cc223c2e4"
  }


  const fetchNfts = async (limit = 1) => {
    if (!address) return;
    try {
      const params = new URLSearchParams({
        chain: "base",
        format: "decimal",
        "token_addresses[0]": nftInfo.address,
        normalizeMetadata: "true",
        media_items: "false",
        include_prices: "false",
        limit: limit.toString(),
      });

      const nftUrl = `${config.MORALIS_API_BASE_URL}/${address}/nft?${params.toString()}&exclude_spam=false`;
      const response = await fetch(
        nftUrl,
        {
          headers: {
            accept: "application/json",
            "X-API-Key": config.MORALIS_API_KEY,
          },
        }
      );

      const data = await response.json();

      const nfts = data.result.map((nft: any) => ({
        type: "nft",
        transaction: "NFT Minted",
        value: `+${nft.amount || 1} NFT`,
        grayValue: `NFT ID: ${nft.token_id}`,
        date: new Date(nft.last_token_uri_sync || nft.last_metadata_sync).toLocaleString(),
        timestamp: new Date(nft.last_token_uri_sync || nft.last_metadata_sync).getTime(),
        transactionHash: "",
        contract_address: nft.token_address,
        name: nft.normalized_metadata?.name || nft.name || "Unnamed NFT",
        slug: nft.symbol || null,
        description: nft.normalized_metadata?.description || "No description available",
        image: nft.normalized_metadata?.image?.replace("ipfs://", "https://ipfs.io/ipfs/"),
        floor_price: null,
        symbol: nft.symbol || "N/A",
        tokenId: nft.token_id,
        collectionName: nft.name || "Greener Future",
      }));


      setNftData((prev) => [...(prev || []), ...nfts]);
    } catch (error) {
      console.error("Error fetching NFTs from Moralis:", error);
    }
  };


  useEffect(() => {
    if (address) {
      setNftData([]);
      Promise.all([
        fetchNfts(1),
      ]);
    } else {
      setNftData(null);
    }
  }, [address]);



  
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
      }
      else if (wallets.length > 0 && !address) {
        const Xaddress: any = wallets.find((w) => w.linked)?.address
        setAddress(Xaddress);
      }
    }

    fetchFarcasterAddress();
  }, [user?.farcaster?.fid, wallets]);

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
    // setCoinInfo(null);
    setFullImages([]);
    setPiecesState([]);
    setScanBalance(null);
    setPartnerBalance(null);
    setHasEnoughScan(null);
    setOwnedNFTCount(0);
    setIsLoading(false);
    setIsSuccess(false);
    setScanLogo(partnerData[1].logo);
    isPoolReset.current = true;
    isBalanceFetched.current = false;
  }, [partnerData[0].pool]);


  //  const marketCap = useMemo(
  //   () => (coinInfo?.maxMarketCap ? parseFloat(coinInfo.maxMarketCap) : 0),
  //   [coinInfo?.maxMarketCap]
  // );



  const unlockedPieces = useMemo(() => {
    const effectiveMilestones = partnerData[0].MILESTONES;
    const maxCap = Number(coinInfo?.maxMarketCap ?? 0);
    return Math.max(0, effectiveMilestones.filter((cap: any) => maxCap >= cap).length - 1);
  }, [coinInfo?.maxMarketCap, partnerData[0].MILESTONES]);

  // useEffect(() => {
  //   setOwnedNFTCount(unlockedPieces + 1);
  //   async function fetchTotalPiece() {
  //     try {
  //       const maxMarketCapresponse = await fetch(config.ALL_MARKET_CAP_ENDPOINT, {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //           "api-key": config.API_KEY_CLOUD,
  //         },
  //       });

  //       if (!maxMarketCapresponse.ok) {
  //         console.error("Failed to fetch coin info");
  //         return;
  //       }

  //       const maxMarketCapData = await maxMarketCapresponse.json();
  //       const decryptMaxMarketCapDataData = decryptObject(maxMarketCapData);
  //       setAllMarketCap(decryptMaxMarketCapDataData);
  //     } catch (e) {
  //       console.error("Error fetching token balances:", e);
  //     }
  //   }
  //   fetchTotalPiece();
  // }, [unlockedPieces]);


  useEffect(() => {
    setOwnedNFTCount(unlockedPieces + 1);
  }, [unlockedPieces])





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

        const scanTokenId = partnerData[1].id.toLowerCase();
        const tokenAddresses = [scanTokenId];

        const balances: Record<string, string> = {};
        const coinDisplay: CoinDisplay[] = [];

        for (const tokenAddress of tokenAddresses) {
          const result = tokens.find((r: any) => r.token_address.toLowerCase() === tokenAddress.toLowerCase());
          const balance = result && result?.balance_formatted ? result.balance_formatted : '0';
          balances[tokenAddress] = balance;
          const logo = tokenAddress === scanTokenId ? scanLogo : partnerData[0].logo;
          coinDisplay.push({ balance, logo });
        }

        const scanBal = balances[scanTokenId] ?? 0;
        setScanBalance(parseFloat(scanBal));
        setCoinsBoughtDisplay(coinDisplay);

        // let hasEnough = parseFloat(scanBal) >= partnerData[1]?.MIN_TOKEN_BALANCE;

        let hasEnough = nftData && nftData.length > 0

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

  }, [address, partnerData[0].title, partnerData[0].id, isSuccess, scanLogo, partnerData[0].pool, nftData]);

  const fetchFullImages = useCallback(
    async () => {
      try {
        const response = await fetch(config.WORKER_PROXY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": config.API_KEY_CLOUD!,
          },
          body: JSON.stringify({ pool: partnerData[0].pool, maxMarketCap: coinInfo.maxMarketCap }),
        });
        const data = await response.json();
        const decrypted = await decryptObjectFullImage(data);
        setFullImages(decrypted);
      } catch (error) {
        console.error("Error fetching full images:", error);
      }
    },
    [coinInfo.maxMarketCap, coinInfo.phase]
  );

  useEffect(() => {
    if (!isPoolReset.current || !isBalanceFetched.current) {
      return;
    }

    if ((hasEnoughScan === true && unlockedPieces > 0) || coinInfo.phase == 'final') {
      fetchFullImages();
    } else {
      setFullImages([]);
    }
  }, [fetchFullImages, unlockedPieces, hasEnoughScan, partnerData[0].pool, coinInfo.phase, address]);

  useEffect(() => {
    const filteredLockedImages = lockedImages.filter((item: any) => item.id === partnerData[0].pool);
    const filteredUnlockedImages = unlockedImages.filter((item: any) => item.id === partnerData[0].pool);
    const updatedPieces: PieceState[] = Array(9)
      .fill(null)
      .map((_, i) => ({ image: filteredLockedImages[0]?.images[i]?.src || "" }));

    updatedPieces[8] = { image: partnerData[0].FIRST_IMAGE_SRC };

    const placementOrder = [7, 6, 5, 4, 3, 2, 1, 0];
    for (let i = 0; i < Math.min(unlockedPieces, placementOrder.length); i++) {
      const index = placementOrder[i];
      updatedPieces[index] = hasEnoughScan && fullImages[i]
        ? { image: fullImages[i], reached: true }
        : { image: filteredUnlockedImages[0]?.images[index]?.src || "", link: partnerData[0].link, pulse: true };
    }
    setPiecesState(updatedPieces);
  }, [fullImages, unlockedPieces, hasEnoughScan, partnerData[0].pool]);




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

  useEffect(() => {
    async function fetchCheckShare() {
      if (!address) return; // ← IMPORTANT FIX

      try {
        const response = await fetch(config.SHARE_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": config.API_KEY_CLOUD,
          },
          body: JSON.stringify({
            action: "check",
            address,
          }),
        });
        if (!response.ok) {
          throw new Error("API Error: " + response.status);
        }

        const data = await response.json();
        if (data && data.message && data.message == "empty") {
          return
        }
        setShareData(data)
        if (data && !data.isShared) {
          setModalOpen(true)
        }
      } catch (err: any) {
        setError(err.message);
      }
    }

    fetchCheckShare();
  }, [address]);

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
          {/* <p>Remaining: {Math.ceil(coinInfo.remaining / 1000)}s</p> */}
          {/* <p>Max Market Cap: {coinInfo.maxMarketCap}</p> */}
          <QrBaseBanner round={partnerData[0].round} isCompleted={ownedNFTCount === 9} />
          <QrBaseNavbar coinsBoughtDisplay={coinsBoughtDisplay} address={address} loading={loading} />
          <ShareModalFastmode
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            shareData={shareData}
            dollarPrize={formatCompactUSD(parsePrize(shareData?.lastPrice || '0K') * scanInfo.priceInUsd)}
          />

          {ownedNFTCount === 9 && hasEnoughScan && (
            <>
              <Confetti
                style={{ zIndex: 51, opacity: 0.5 }}
                mode="fall"
                particleCount={50}
                colors={[partnerData[0].PRIMARY_COLOR, partnerData[0].GRADIENT_END, partnerData[0].GRADIENT_START, partnerData[0].GRAY_LIGHT]}
              />
              <Confetti
                style={{ zIndex: 51, opacity: 0.5 }}
                mode="boom"
                effectInterval={100000}
                particleCount={10}
                colors={[partnerData[0].PRIMARY_COLOR, partnerData[0].GRADIENT_END, partnerData[0].GRADIENT_START, partnerData[0].GRAY_LIGHT]}
                effectCount={1}
              />
            </>
          )}

          {/* <QrBasePartnerList allMarketCap={allMarketCap} /> */}

          {activeSection === null && (
            <main className="mx-auto flex max-w-7xl grow flex-col">
              <div className="flex grow flex-col md:flex-row containQrBaseFastMode">
                <div className="flex grow flex-col md:flex-row">
                  <QrBasePartnerInfo
                    scanBalance={scanBalance}
                    partnerBalance={partnerBalance}
                    partnerData={partnerData[0]}
                    scanData={partnerData[1]}
                    currentRound={currentRound}
                    nftBalance={nftData}
                  />

                  <QrBaseQrcodeItems
                    partnerData={partnerData[0]}
                    piecesState={piecesState}
                    isCompleted={ownedNFTCount === 9}
                    countWatcher={count}
                    unlockedPieces={unlockedPieces}
                    coinInfo={coinInfo}
                    nftBalance={nftData}
                    scanInfo={scanInfo}
                  />
                  <QrBaseCoinInfo
                    coinInfo={coinInfo}
                    marketCap={coinInfo?.maxMarketCap}
                    maxMarketCap={coinInfo?.maxMarketCap}
                    partnerData={partnerData[0]}
                    isLoading={isLoading}
                    isCompleted={partnerData[0].isClaimed}
                  />

                </div>
              </div>
              <QrBaseFooter
                ownedNFTCount={ownedNFTCount}
                partnerData={partnerData[1]}
                scanBalance={scanBalance}
                partnerBalance={partnerBalance}
                hasEnoughScan={hasEnoughScan}
                onSuccess={onSuccess}
              />
            </main>
          )}

          {activeSection !== null && (
            <main className="mx-auto flex max-w-7xl grow flex-col">
              <div className="flex grow flex-col md:flex-row containQrBaseFastMode">
                <div className="flex grow flex-col md:flex-row">
                  {activeSection === "token" && (
                    <QrBasePartnerInfo
                      scanBalance={scanBalance}
                      partnerBalance={partnerBalance}
                      partnerData={partnerData[0]}
                      scanData={partnerData[1]}
                      currentRound={currentRound}
                      nftBalance={nftData}
                    />
                  )}


                  {activeSection === "qr" && (
                    <div className="qrMobileFastMode">
                      <div className="qrMobileHeightFastMode">
                        <QrBaseQrcodeItems
                          partnerData={partnerData[0]}
                          piecesState={piecesState}
                          isCompleted={ownedNFTCount === 9}
                          countWatcher={count}
                          unlockedPieces={unlockedPieces}
                          coinInfo={coinInfo}
                          nftBalance={nftData}
                          scanInfo={scanInfo}

                        />
                        <QrBaseFooterMobile
                          ownedNFTCount={ownedNFTCount}
                          partnerData={partnerData[1]}
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
                          marketCap={coinInfo?.maxMarketCap}
                          maxMarketCap={coinInfo?.maxMarketCap}
                          partnerData={partnerData[0]}
                          isLoading={isLoading}
                          isCompleted={partnerData[0].isClaimed}
                        />
                      </div>
                    </div>
                  )}


                </div>
              </div>

              <div className="fixed bottom-0 left-0 w-full bg-white border-t md:hidden flex justify-around items-center p-2">
                <button className="flex flex-col items-center" onClick={() => setActiveSection('token')}>
                  <span className="text-blue-500">
                    <TokenIcon size={20} color={activeSection === 'token' ? partnerData[0].PRIMARY_COLOR : '#6B7280'} />
                  </span>
                  <span className="tabTitle" style={{ color: activeSection === 'token' ? partnerData[0].PRIMARY_COLOR : '#6B7280' }}>Token Info</span>
                </button>
                <button className="flex flex-col items-center" onClick={() => setActiveSection('qr')}>
                  <span>
                    <QrIcon size={20} color={activeSection === 'qr' ? partnerData[0].PRIMARY_COLOR : '#6B7280'} />
                  </span>
                  <span style={{ color: activeSection === 'qr' ? partnerData[0].PRIMARY_COLOR : '#6B7280' }} className="tabTitle">Qrcode</span>
                </button>
                <button className="flex flex-col items-center" onClick={() => setActiveSection('progress')}>
                  <span>
                    <ProgressIcon size={20} color={activeSection === 'progress' ? partnerData[0].PRIMARY_COLOR : '#6B7280'} />
                  </span>
                  <span style={{ color: activeSection === 'progress' ? partnerData[0].PRIMARY_COLOR : '#6B7280' }} className="tabTitle">Progress</span>
                </button>
              </div>
            </main>
          )}

        </div>

      )}
    </QrBaseProvider>
  );
}