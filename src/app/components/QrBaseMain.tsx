"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QrBaseProvider } from "./provider/QrBaseProvider";
import { QrBaseBanner } from './sections/QrBaseBanner';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { erc20Abi } from 'viem';
import { lockedImages, unlockedImages } from "@/src/app/types/imageAssets";
import scanData from '@/src/app/data/partnerData.json';
import QrBaseFooter from './sections/QrBaseFooter';
import QrBaseQrcodeItems from './sections/QrBaseQrcodeItems';
import QrBasePartnerInfo from './sections/QrBasePartnerInfo';
import QrBaseCoinInfo from './sections/QrBaseCoinInfo';
import QrBaseNavbar from './sections/QrBaseNavbar';
import QrBasePartnerList from './sections/QrBasePartnerList';
import { useAccount } from "wagmi";
import {PieceState , CoinDisplay , TokenData } from "@/src/app/types"
import { decryptObject , decryptObjectFullImage } from "@/src/app/utils/encrypt_decrypt"


// Config for environment variables
const config = {
  API_KEY_CLOUD: process.env.NEXT_PUBLIC_API_KEY ?? "",
  COIN_INFO_ENDPOINT: "/api/coinInfo",
  POLL_INTERVAL: 5000,
  API_COIN_SECRET: process.env.NEXT_PUBLIC_RPC_URL,
  WORKER_PROXY_URL: "/api/proxyFullImages",
  CHAIN_ID: "0x2105",
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
};

// Initialize Viem public client
const client = createPublicClient({
  chain: base as any,
  transport: http(config.RPC_URL),
});


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
  const { address } = useAccount();
  const [coinsBoughtDisplay, setCoinsBoughtDisplay] = useState<CoinDisplay[]>([]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const prevIsSuccess = useRef<boolean | null>(null);
  const isPoolReset = useRef<boolean>(false); 
  const isBalanceFetched = useRef<boolean>(false); 

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
        const response = await fetch(config.COIN_INFO_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": config.API_KEY_CLOUD,
          },
          body: JSON.stringify({ pool: partnerData.pool, id: partnerData.id }),
        });

        if (!response.ok) {
          console.error("Failed to fetch coin info");
          return;
        }

        const data = await response.json();
        const decryptData = decryptObject(data);
        setCoinInfo({
          priceInUsd: decryptData.lastPrice,
          volumeUsd: decryptData.volumeUsd,
          maxMarketCap: decryptData.maxMarketCap,
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
  }, [fetchPrice, partnerData.pool, address]);

  useEffect(() => {
    const intervalId = setInterval(() => fetchPrice(false), config.POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchPrice]);

  const marketCap = useMemo(
    () => (coinInfo?.volumeUsd ? parseFloat(coinInfo.volumeUsd) : 0),
    [coinInfo?.volumeUsd]
  );

  const unlockedPieces = useMemo(() => {
    const maxCap = Number(coinInfo?.maxMarketCap ?? 0);
    return Math.max(0, partnerData.MILESTONES.filter((cap: any) => maxCap >= cap).length - 1);
  }, [coinInfo?.maxMarketCap, partnerData.MILESTONES]);

  useEffect(() => {
    setOwnedNFTCount(unlockedPieces + 1);
  }, [unlockedPieces]);

  const onSuccess = () => {
    setIsSuccess(true);
  };

  useEffect(() => {
    const was = prevIsSuccess.current;
    const is = isSuccess;
    prevIsSuccess.current = is;

    // Block the case of true ➝ false
    const blocked = was === true && is === false;
    if (blocked) return;

    async function fetchUserBalance() {
      try {
        if (!address) {
          setHasEnoughScan(null);
          setScanBalance(null);
          setPartnerBalance(null);
          isBalanceFetched.current = true; // Mark balance fetch as complete
          return;
        }

        const isDualToken = partnerData?.title !== "Scan";
        const scanTokenId = scanData[0].id.toLowerCase();
        const partnerTokenId = partnerData?.id?.toLowerCase();
        const tokenAddresses = isDualToken ? [scanTokenId, partnerTokenId] : [scanTokenId];

        const balances: Record<string, number> = {};
        const coinDisplay: CoinDisplay[] = [];

        for (const tokenAddress of tokenAddresses) {
          // Fetch balance
          const balance = await client.readContract({
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address],
          });

          const decimals = await client.readContract({
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: 'decimals',
          });

          const normalizedBalance = Number(balance) / Math.pow(10, decimals);
          balances[tokenAddress] = normalizedBalance;

          const logo = tokenAddress === scanTokenId ? scanLogo : partnerData.logo;
          coinDisplay.push({ balance: normalizedBalance, logo });
        }

        const scanBal = balances[scanTokenId] ?? 0;
        setScanBalance(scanBal);
        setCoinsBoughtDisplay(coinDisplay);

        let hasEnough = scanBal >= scanData[0]?.MIN_TOKEN_BALANCE;

        if (isDualToken) {
          const partnerBal = balances[partnerTokenId] ?? 0;
          setPartnerBalance(partnerBal);
          hasEnough = hasEnough && partnerBal >= (partnerData?.MIN_TOKEN_BALANCE ?? 0);
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
        ? {
            image: fullImages[i],
            reached: true,
          }
        : {
            image: filteredUnlockedImages[0]?.images[index]?.src || "",
            link: partnerData.link,
            pulse: true,
          };
    }
    setPiecesState(updatedPieces);
  }, [fullImages, unlockedPieces, hasEnoughScan, partnerData.pool]);

  return (
    <QrBaseProvider>
      <div className="relative flex h-full max-h-screen max-w-full flex-col font-sansMono">
        <QrBaseBanner />
        <QrBaseNavbar coinsBoughtDisplay={coinsBoughtDisplay} />
        <QrBasePartnerList />
        <main className="mx-auto flex max-w-7xl grow flex-col">
          <div className="flex grow flex-col md:flex-row containQrBase">
            <div className="flex grow flex-col md:flex-row ">
              <QrBasePartnerInfo
                scanBalance={scanBalance}
                partnerBalance={partnerBalance}
                partnerData={partnerData}
                scanData={scanData[0]}
              />
              <QrBaseQrcodeItems partnerData={partnerData} piecesState={piecesState} />
              <QrBaseCoinInfo
                coinInfo={coinInfo}
                marketCap={marketCap}
                maxMarketCap={coinInfo?.maxMarketCap}
                partnerData={partnerData}
                isLoading={isLoading}
              />
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
      </div>
    </QrBaseProvider>
  );
}