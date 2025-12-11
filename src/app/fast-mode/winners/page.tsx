"use client";
import { use, useEffect, useState } from "react";
import Image from "next/image";
import { QrBaseBanner } from "../../components/sections/winners/QrBaseBanner";
import { QrBaseProvider } from "../../components/provider/QrBaseProvider";
import QrBaseNavabrFastMode from "../../components/sections/winners/QrBaseNavabrFastMode";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import QrBasePartnerList from "../../components/sections/winners/QrBasePartnerList";
import { decryptObject } from "../../utils/encrypt_decrypt";
import QrBaseFooter from '../../components/sections/winners/QrBaseFooter';
import { FaTrophy } from "react-icons/fa";
import winner from '@/src/app/images/svg/winner.svg';
import link from '@/src/app/images/svg/link.svg';
import { Tooltip } from "@mui/material";
import { FaCopy } from "react-icons/fa";
import StatsCard from "./StatsCard";
import winnersIcon from '@/src/app/fast-mode/winners/Winners.svg'
import QR from '@/src/app/fast-mode/winners/QR.svg'
import SCANRewards from '@/src/app/fast-mode/winners/SCANRewards.svg'
import USDCRewards from '@/src/app/fast-mode/winners/USDCRewards.svg'



import XIcon from '@/src/app/images/svg/socialMedia/XIcon';
import WarpcastIcon from '@/src/app/images/svg/socialMedia/WarpcastIcon';
import { TokenData } from "../../types";


type Winner = {
  id: number;
  image?: string;
  name?: string;
  address: string | null;
  token: string;
  prize: string;
  txLink: string;
  socialLink?: string;
  socialType?: string;
  totalWin?: number;
  lastImageKey?: string;
};

type ApiResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  results: Winner[];
};

// Config for environment variables
const config = {
  API_KEY_CLOUD: process.env.NEXT_PUBLIC_API_KEY ?? "",
  COIN_INFO_ENDPOINT: "/api/coinInfo",
  COIN_INFO_FASTMODE_ENDPOINT: "/api/fastmodeCoinInfo",

};


export default function WinnerTable() {
  const [address, setAddress] = useState<string | null>(null);
  const { ready, authenticated, user } = usePrivy();


  const [winners, setWinners] = useState<Winner[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { wallets } = useWallets();
  const [coinInfo, setCoinInfo] = useState<TokenData | null>(null);
  const [lastImageKey, setlastImageKey] = useState('')
  const [isLastWinnersList, setIsLastWinnersList] = useState(false)
  const [winnerInfo, setWinnerInfo] = useState(null)



  const getSocialIcon = (socialType?: string) => {
    if (!socialType) return null;
    if (socialType.toLowerCase() === "x" || socialType.toLowerCase() === "twitter") {
      return <XIcon size={10} />
        ;
    }
    if (socialType.toLowerCase() === "farcaster") {
      return <WarpcastIcon size={10} />;
    }
    return null;
  };



  useEffect(() => {
    async function fetchCoinInfo() {
      try {
        const coinInforesponse = await fetch(config.COIN_INFO_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": config.API_KEY_CLOUD,
          },
          body: JSON.stringify({ pool: '0x2a0f410422951f53cd2f3e9f6d0f29fccb1426e9', id: '0x20429F731096e359910921994A267d32ef576720' }),
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
      }


      try {
        const coinInforesponse = await fetch(config.COIN_INFO_FASTMODE_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": config.API_KEY_CLOUD,
          },
          body: JSON.stringify({ pool: 'light_mode_scan', id: 'light_mode_scan' }),
        });

        if (!coinInforesponse.ok) {
          console.error("Failed to fetch coin info");
          return;
        }

        const coinInfoData = await coinInforesponse.json();
        const decryptCoinInfoData = decryptObject(coinInfoData);
        setlastImageKey(decryptCoinInfoData.lastImageKey)
      } catch (error) {
        console.error("Fetch coin info error:", error);
      }
    }
    fetchCoinInfo();
  }, []);




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


  const formatCoins = (coins: any): string => {
    const value = Number(coins);

    if (isNaN(value)) return '0';

    // Helper to avoid rounding up
    const formatNoRound = (num: number, divisor: number, suffix: string) => {
      const v = num / divisor;
      const truncated = Math.floor(v * 100) / 100; // keep 2 decimals, no rounding
      return truncated.toString().replace(/\.0+$/, '') + suffix;
    };

    if (value >= 1_000_000_000)
      return formatNoRound(value, 1_000_000_000, 'B');

    if (value >= 1_000_000)
      return formatNoRound(value, 1_000_000, 'M');

    if (value >= 1_000)
      return formatNoRound(value, 1_000, 'K');

    // For < 1000: just truncate, no rounding
    const truncated = Math.floor(value * 10) / 10;
    return truncated.toString().replace(/\.0+$/, '');
  };





  useEffect(() => {
    async function fetchFarcasterAddress() {
      if (user?.farcaster?.fid) {
        setLoading(true);
        setError(null);
        try {
          const fid = user.farcaster.fid;
          const protocol = "ethereum"; // Use "solana" if needed

          const res = await fetch(
            `https://api.farcaster.xyz/fc/primary-address?fid=${fid}&protocol=${protocol}`
          );

          if (!res.ok) {
            throw new Error(`Fetch failed: ${res.statusText}`);
          }

          const json = await res.json();
          const fetchedAddress = json.result?.address?.address ?? null;

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

  const fetchWinners = async (page: number) => {
    setWinners([])
    try {
      if (page === 1) setLoading(true);
      const res = await fetch(`/api/winnersFastMode?page=${page}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.NEXT_PUBLIC_API_KEY as string,

        }
      });





      if (!res.ok) throw new Error("Failed to fetch winners");

      const dataCrypted: ApiResponse = await res.json();
      const data = decryptObject(dataCrypted);
      setWinnerInfo(data)
      if (isLastWinnersList) {
        const onlyLast = data.results.filter(w => {
          return w.lastImageKey === lastImageKey;
        });
        setWinners(onlyLast)
      } else {
        setWinners(data.results || []);
      }


      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching winners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinners(page);
  }, [page, isLastWinnersList]);

  return (
    <QrBaseProvider>

      <div className="relative flex h-full max-h-screen max-w-full flex-col font-sansMono">
        <QrBaseBanner />
        <QrBaseNavabrFastMode address={address} />


        <div>

          <div className="w-full max-w-4xl mx-auto p-4" style={{
            marginTop: "120px",
          }}>
            {/* Header */}
            <div className="text-center mb-4">
              <div className="flex justify-center items-center mb-4 gap-2">
                <div className="text-white p-2" style={{ background: '#0052FF', borderRadius: '6px' }}><FaTrophy style={{ color: '#fff' }} className="text-xl" /></div>
                <div style={{ fontWeight: 'bold', fontSize: '24px', color: '#000000' }}>Winners</div>
              </div>
              <h2 className="font-semibold" style={{ color: "#4B5563", fontSize: '14px' }}>
                {isLastWinnersList ? "list of last qrcode prize winners" : 'Complete list of all our qrcodes prize winners'}
              </h2>
              <br />
              <div
                className="grid grid-cols-2 gap-4 justify-items-center sm:flex sm:justify-center sm:grid-cols-4" 
                style={{
                  marginBottom: '25px',
                  maxWidth: '640px',
                  margin: '0 auto'
                }}
              >
                <StatsCard icon={winnersIcon} value={`${winnerInfo?.total}`} label="Total Winners" loading={loading} />
                <StatsCard icon={SCANRewards} value={`${formatCoins(winnerInfo?.allTotalPrize)}`} label="Total $SCAN Claimed" loading={loading} />
                <StatsCard icon={USDCRewards} value={`${formatCompactUSD(winnerInfo?.allTotalPrize * coinInfo?.priceInUsd)} $`} label="Total Rewards Value ($)" loading={loading} />
                <StatsCard icon={QR} value={`${winnerInfo?.scannedQr}`} label="Total QRs Claimed" loading={loading} />
              </div>
              <br />

              <h2 onClick={() => setIsLastWinnersList(!isLastWinnersList)} className="font-bold" style={{ color: "#4B5563", fontSize: '10px', cursor: 'pointer', textDecoration: 'underline' }}>
                {isLastWinnersList
                  ? "Click to view complete list"
                  : "Click to view the last winners"}
              </h2>
            </div>

            {/* Table */}
            {/* Table wrapper */}

            {loading ? <div className="flex justify-center items-center">
              <img
                src="/images/gif/QRbase-claim-links-work.gif"
                alt="Loading..."
                className="w-64 h-64 object-contain"
              />
            </div> :
              <div className="overflow-x-auto rounded-2xl shadow-md">
                <table className="min-w-full text-sm text-gray-700 bg-white hidden sm:table">
                  <thead className="font-semibold bg-[#EFF5FF] text-[#6B7280] text-xs">
                    <tr>
                      <th className="px-3 py-3 text-left">
                        <div className="flex">
                          <Image src={winner} alt="winner" width={20} height={20} style={{ objectFit: 'none', margin: '0 2px 2px 0' }} />
                          <span>Winner</span></div>
                      </th>
                      <th className="px-8 py-3 text-left">Address</th>
                      <th className="px-8 py-3">Token</th>
                      <th className="px-8 py-3">Prize</th>
                      <th className="px-8 py-3">Win(s)</th>

                      <th className="px-3 py-3">TX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {winners.map((w) => (
                      <tr key={w.id} className="border-b hover:bg-gray-50">
                        <td className="flex items-center gap-2 px-3 py-3">
                          <a
                            href={w.socialLink || "#"}
                            target="_blank"
                            className={`flex items-center space-x-2 ${w.socialLink ? "hover:underline cursor-pointer" : "pointer-events-none cursor-default text-gray-700"
                              }`}
                          >
                            {w.image && <Image src={w.image} alt={w.name || "logo"} width={28} height={28} className="rounded-full" style={{ height: '28px' }} />}
                            <span className="font-semibold">{w.name || "@Anon"}</span>
                            {getSocialIcon(w.socialType)}
                          </a>
                        </td>
                        <td className="px-8 py-3">{w.address ? (
                          <Tooltip title={w.address}>
                            <span>{`${w.address.slice(0, 6)}...${w.address.slice(-6)}`}</span>
                          </Tooltip>
                        ) : (
                          "Hidden"
                        )}</td>
                        <td className="px-8 py-3">
                          <Image src={w.token} alt="token" width={22} height={22} className="mx-auto" />
                        </td>
                        <td className="px-8 py-3 font-medium text-blue-500">
                          <div className="text-xs px-2 py-1 rounded-full bg-[#EFF5FF] font-bold text-center">
                            {coinInfo && coinInfo.priceInUsd
                              ? `${w.prize} (~${formatCompactUSD(parsePrize(w.prize) * coinInfo?.priceInUsd)}$)`
                              : w.prize
                            }

                          </div>
                        </td>
                        <td className="px-8 py-3 font-medium text-blue-500">
                          <div className="text-xs px-2 py-1 rounded-full bg-[#EFF5FF] font-bold text-center">
                            {w.totalWin || 0}

                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <a href={w.txLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                            <Image src={link} alt="link" width={14} height={14} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile card view */}
                <table className="min-w-full text-sm text-gray-700 bg-white table sm:hidden">
                  <thead className="font-semibold bg-[#EFF5FF] text-[#6B7280] text-xs">
                    <tr>
                      <th className="px-2 py-3 text-left">
                        <div className="flex">
                          <Image src={winner} alt="winner" width={20} height={20} style={{ objectFit: 'none', margin: '0 2px 2px 0' }} />
                          <span>Winner</span></div>
                      </th>
                      <th className="px-1 py-3">Token</th>
                      <th className="px-2 py-3">Prize</th>
                      <th className="px-1 py-3">Win(s)</th>
                      <th className="px-2 py-3">TX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {winners.map((w) => (
                      <tr key={w.id} className="border-b hover:bg-gray-50">
                        {/* Winner Name */}
                        <td className="flex items-center gap-1 px-1 py-1 whitespace-nowrap">
                          <a
                            href={w.socialLink || "#"}
                            target="_blank"
                            className={`flex items-center space-x-1 ${w.socialLink ? "hover:underline cursor-pointer" : "pointer-events-none cursor-default text-gray-700"}`}
                          >
                            {w.image && (
                              <Image
                                src={w.image}
                                alt={w.name || "logo"}
                                width={20}
                                height={20}
                                className="rounded-full"
                                style={{ height: '20px' }}
                              />
                            )}
                            <Tooltip title={w.name || "@Anon"}>
                              <span className="font-semibold" style={{ fontSize: '0.6rem' }}>{w.name ? `${w.name.slice(0, 3)}...` : "@Anon"}</span>
                            </Tooltip>
                            {getSocialIcon(w.socialType, 14)} {/* Pass smaller size if your function supports it */}
                          </a>
                        </td>

                        {/* Address with copy icon */}
                        <td className="px-1 py-1 whitespace-nowrap flex items-center gap-1" style={{ fontSize: '0.6rem' }}>
                          {w.address ? (
                            <Tooltip title={w.address}>
                              <span>{`${w.address.slice(0, 6)}...${w.address.slice(-4)}`}</span>
                            </Tooltip>
                          ) : (
                            "Hidden"
                          )}
                          {w.address && (
                            <button
                              onClick={() => navigator.clipboard.writeText(w.address)}
                              className="text-gray-400 hover:text-gray-700"
                            >
                              <FaCopy size={12} />
                            </button>
                          )}
                        </td>

                        {/* Token */}
                        <td className="py-1 whitespace-nowrap">
                          <Image src={w.token} alt="token" width={15} height={15} className="mx-auto" />

                        </td>

                        {/* Prize */}
                        <td className="py-1 font-medium text-blue-500 whitespace-nowrap">
                          <div className="px-1 py-1 rounded-full bg-[#EFF5FF] font-bold text-center" style={{ fontSize: '0.6rem' }}>
                            {coinInfo && coinInfo.priceInUsd
                              ? `${w.prize} (~${formatCompactUSD(parsePrize(w.prize) * coinInfo.priceInUsd)}$)`
                              : w.prize
                            }
                          </div>
                        </td>

                        <td className="px-1 py-3 font-medium text-blue-500">
                          <div className="px-1 py-1 rounded-full bg-[#EFF5FF] font-bold text-center" style={{ fontSize: '0.6rem' }}>
                            {w.totalWin || 0}

                          </div>
                        </td>

                        {/* TX */}
                        <td className="px-2 py-1 text-center whitespace-nowrap">
                          <a href={w.txLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                            <Image src={link} alt="link" width={14} height={14} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 border-[#E1E1E1] text-[#0052FF]"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                &lt;
              </button>
              <span className="px-2" style={{ color: "#6B7280", fontSize: "10px" }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 border-[#E1E1E1] text-[#0052FF]"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
        <QrBaseFooter />
      </div>

    </QrBaseProvider>
  );
}
