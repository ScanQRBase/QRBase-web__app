'use client';

import { useState, useEffect } from 'react';
import { createThirdwebClient } from "thirdweb";
import { wrapFetchWithPayment } from "thirdweb/x402";
import { createWallet } from "thirdweb/wallets";
import { base } from "thirdweb/chains";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import QrBaseNavbar from '../../components/sections/boostpass/QrBaseNavbar';
import { QrBaseBanner } from '../../components/sections/boostpass/QrBaseBanner';
import QrBaseFooter from '../../components/sections/boostpass/QrBaseFooter';
import king from '@/src/app/images/svg/king.svg';
import prize from '@/src/app/images/svg/prize.svg';
import fast from '@/src/app/images/svg/fast.svg';
import x2 from '@/src/app/images/svg/x2.svg';
import Image from 'next/image';
import Confetti from 'react-confetti-boom';
import { ethers } from "ethers";
import { sdk } from '@farcaster/miniapp-sdk';
import { getNeynarUser } from '../../utils/encrypt_decrypt';
import { HowItWorksModal } from '../../components/puzzle/PuzzleModals';
import { useTheme } from '../../components/provider/ThemeProvider';


const ONBOARDING_KEY = 'qrbase_onboarding_seen';

// Initialize thirdweb client
const thirdwebClient = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || ''
});

function CoinbasePassContent() {
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    // Auto-show How It Works on first visit
    useEffect(() => {
        const hasSeen = localStorage.getItem(ONBOARDING_KEY);
        if (!hasSeen) {
            setShowHowItWorks(true);
        }
    }, []);
    const TOTAL_NFTS = 1000;
    const [loading, setLoading] = useState(false);
    const [apiResponse, setApiResponse] = useState<any>(null);
    const [availableNFTs, setAvailableNFTs] = useState<number | null>(null);
    const [totalSold, setTotalSold] = useState<number | null>(null);
    const [progressPercent, setProgressPercent] = useState<number | null>(null);

    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [currentStep, setCurrentStep] = useState<string>('');
    const [coinsBoughtDisplay, setCoinsBoughtDisplay] = useState<any[]>([]);
    const [address, setAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const { authenticated, login, linkWallet, user, ready } = usePrivy();
    const { wallets } = useWallets();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Fetch Farcaster or Privy-linked address
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
        checkAvailability();
    }, [currentStep]);

    const checkAvailability = async () => {
        setCheckingAvailability(true);
        try {
            const response = await fetch('/api/nft/available');
            const data = await response.json();
            setAvailableNFTs(data.totalNftOwned);

            if (currentStep == '✅ NFT transferred successfully!') {
                const updatedTotalSold = Math.max((totalSold ?? 0) + 1, 0);
                setTotalSold(updatedTotalSold);

                const progressPercent = Math.min((updatedTotalSold / TOTAL_NFTS) * 100, 100);
                setProgressPercent(progressPercent)
            } else {
                const totalSold = TOTAL_NFTS - data.totalNftOwned;
                setTotalSold(totalSold);
                const progressPercent = Math.min((totalSold / TOTAL_NFTS) * 100, 100);
                setProgressPercent(progressPercent)
            }

        } catch (error) {
            console.error('Failed to check availability:', error);
            return null;
        } finally {
            setCheckingAvailability(false);
        }
    };

    const onClick = async () => {

        if (!authenticated) {
            setError("Please login first");
            await login();
            return;
        }

        setLoading(true);
        setApiResponse(null);
        setCurrentStep("");
        setError(null);
        setSuccessMessage(null);

        try {


            // Replace the Farcaster wallet creation section (around line 110-140) with this:

            if (user?.farcaster?.fid) {

                // 1️⃣ Get Farcaster’s injected provider
                const provider = await sdk.wallet.getEthereumProvider();
                if (!provider) {
                    throw new Error("Please open this page in a compatible wallet app.");
                }

                // 2️⃣ Initialize Ethers provider + signer
                const ethersProvider = new ethers.BrowserProvider(provider);
                await ethersProvider.getNetwork(); // Ensures network detection (avoids JsonRpc warning)
                const signer = await ethersProvider.getSigner();
                const walletAddress = await signer.getAddress();


                // 3️⃣ Create a minimal Thirdweb-compatible wallet wrapper
                const wallet = {
                    id: "farcaster-wallet",
                    address: walletAddress as `0x${string}`,

                    getAccount: () => ({
                        address: walletAddress as `0x${string}`,

                        signMessage: async ({ message }: { message: string | { raw: Uint8Array } }) => {
                            const msg = typeof message === "string" ? message : message.raw;
                            return (await signer.signMessage(msg)) as `0x${string}`;
                        },

                        signTypedData: async (typedData: any) => {

                            // EIP-712 typed data signing for USDC authorization
                            const { domain, types, message, primaryType } = typedData;

                            // Remove EIP712Domain from types as ethers handles it automatically
                            const typesWithoutDomain = { ...types };
                            delete typesWithoutDomain.EIP712Domain;

                            try {
                                const signature = await signer.signTypedData(
                                    domain,
                                    typesWithoutDomain,
                                    message
                                );
                                return signature as `0x${string}`;
                            } catch (error: any) {
                                console.error("❌ signTypedData error:", error);
                                throw error;
                            }
                        },

                        sendTransaction: async (tx: any) => {
                            const txResponse = await signer.sendTransaction({
                                to: tx.to,
                                data: tx.data,
                                value: tx.value ? BigInt(tx.value) : undefined,
                                gasLimit: tx.gas ? BigInt(tx.gas) : undefined,
                            });
                            return txResponse.hash as `0x${string}`;
                        },
                    }),

                    getChain: () => base,
                    connect: async () => wallet,
                    autoConnect: async () => wallet,
                    disconnect: async () => { },
                    subscribe: () => () => { },
                    switchChain: async () => base,
                };


                // 4️⃣ Wrap fetch with x402 payment (Thirdweb)
                const fetchWithPay = wrapFetchWithPayment(fetch, thirdwebClient, wallet, BigInt(69_000_000));

                setCurrentStep("💰 Processing x402 payment...");

                // 5️⃣ Execute API call with payment
                const response = await fetchWithPay("/api/x402/buy-boostpass", {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || "x402 transaction failed");
                }

                const result = await response.json();
                if (result.success) {
                    setCurrentStep("✅ NFT transferred successfully!");
                    setSuccessMessage(
                        `✅ Transfer Complete! `
                    );
                    setApiResponse(result);
                } else {
                    throw new Error(result.message || "NFT transfer failed after payment");
                }

                return; // ✅ Stop here to avoid running the in-app wallet fallback
            }
            const privyWallet = wallets.find((w) => w.linked);
            if (!privyWallet) {
                setError("No linked wallet found. Please connect again.");
                await linkWallet();
                return;
            }

            let walletId: any = "io.metamask";
            switch (privyWallet.walletClientType) {
                case "coinbase_wallet":
                    walletId = "com.coinbase.wallet";
                    break;
                case "walletconnect":
                    walletId = "walletConnect";
                    break;
                case "privy":
                    walletId = "inApp";
                    break;
                default:
                    walletId = "io.metamask";
            }


            const wallet = createWallet(walletId);
            await wallet.connect({
                client: thirdwebClient,
                chain: base,
            });



            // 💰 3️⃣ Wrap fetch with x402 payment handling
            const fetchWithPay = wrapFetchWithPayment(
                fetch,
                thirdwebClient,
                wallet,
                BigInt(69_000_000) // 69 USDC
            );

            setCurrentStep("💰 Processing payment...");

            // 🌐 4️⃣ Call your backend
            const response = await fetchWithPay("/api/x402/buy-boostpass", {
                method: "GET",
            });


            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Server error");
            }

            const result = await response.json();

            if (result.success) {
                setCurrentStep("✅ NFT transferred successfully!");
                setSuccessMessage(
                    `✅ Transfer Complete! `
                );
                setApiResponse(result);
            } else {
                throw new Error(result.message || "Payment succeeded but NFT transfer failed.");
            }
        } catch (error: any) {
            console.error("❌ Operation failed:", error);
            setCurrentStep("❌ Operation failed");
            setError(`Payment failed or was cancelled: ${error.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };


    return (
        <>

            {!ready ? (
                <div className="flex justify-center items-center h-screen">
                    <img
                        src="/images/gif/QRbase-claim-links-work.gif"
                        alt="Loading..."
                        className="w-64 h-64 object-contain"
                    />
                </div>
            ) : (
                <div className="relative flex min-h-screen flex-col font-sansMono">
                    <QrBaseBanner />
                    {/* <div
                        className="absolute left-1/2 hidden lg:block border-l border-gray-200 dark:border-gray-700 transition-colors duration-200"
                        style={{
                            transform: "translateX(-50%)",

                            height: '90vh',
                        }}
                    ></div> */}
                    <QrBaseNavbar coinsBoughtDisplay={coinsBoughtDisplay} address={address} loading={loading} />
                    <HowItWorksModal isOpen={showHowItWorks} onClose={() => { setShowHowItWorks(false); localStorage.setItem(ONBOARDING_KEY, 'true'); }} />
                    {successMessage && (
                        <>
                            <Confetti
                                style={{ zIndex: 51 }}
                                mode="fall"
                                particleCount={50}
                                colors={['#0052FF', '#EFF5FF', '#0052FF', '#D1D5DB']}
                            />
                            <Confetti
                                style={{ zIndex: 51 }}
                                mode="boom"
                                effectInterval={100000}
                                particleCount={10}
                                colors={['#0052FF', '#EFF5FF', '#0052FF', '#D1D5DB']}
                                effectCount={1}
                            />
                        </>
                    )}
                    <div style={{ height: '100dvh' }}>
                        <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-6 py-6 sm:py-10" style={{
                            overflow: 'auto',
                            marginTop: '60px'
                        }}>
                            <div className="mx-auto max-w-7xl w-full flex flex-col lg:flex-row gap-8 lg:gap-10 items-center lg:items-start container px-4 py-2 lg:px-6" >
                                {/* LEFT BLOCK — NFT IMAGE */}
                                <div className="w-full lg:w-1/2 flex justify-center">
                                    <img
                                        src="https://ik.imagekit.io/cafu/Boosgt.webp?updatedAt=1762250652409&ik-s=6674d098975a0f7113eb9e068adada6a7763ddb8"
                                        alt="CoinbasePass NFT"
                                        width='auto'
                                        height={671}
                                        className="rounded-2xl w-full lg:max-w-[632px] h-auto object-contain"
                                    />
                                </div>

                                {/* RIGHT BLOCK — vvINFO + PURCHASE */}
                                <div className="w-full lg:w-1/2 backdrop-blur-md py-3 flex flex-col gap-6">
                                    {/* Title + Icon */}
                                    <div className="flex items-center gap-3">
                                        <img
                                            src="https://ik.imagekit.io/cafu/boostpass.png?updatedAt=1761944324552&ik-s=3213d3e00b6a6b7b8e0c2c0c9393e938909d97b3"
                                            alt="CoinbasePass Icon"
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 rounded-md"
                                        />
                                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">BoostPass</h1>
                                    </div>

                                    {/* Description */}
                                    <p className="leading-relaxed text-gray-800 dark:text-gray-200" style={{ fontFamily: 'DM Sans', fontSize: '14px', fontWeight: '400', lineHeight: '22px' }}>
                                        <strong>BoostPass NFT</strong> allows $SCAN holders to <strong>doubles their staking APY (x2 boost)</strong> and <strong>grants exclusive access to Fast Reveal Mode</strong>, where QR pieces unlock on a timer — with a <strong>full QR reveal every 8 hours</strong> ⏳
                                        <br /><br />
                                        <strong>Powered by Coinbase CDP x402 Protocol</strong> - Secure payment processing on Base network.
                                    </p>



                                    {/* Feature Cards (2x2 grid) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex h-[70px] transition-colors duration-200" style={{ borderRadius: '8px' }}>
                                            <div className="bg-blue-50 dark:bg-blue-900/30" style={{ borderRadius: '6px', width: '42px', height: '42px', position: 'relative' }}>
                                                <Image src={fast} alt="fast" style={{
                                                    objectFit: 'none', transform: 'translate(-50%, -50%)',
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                }} />
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center', marginLeft: '5px'
                                            }}>
                                                <span className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-1" style={{ fontSize: '14px', fontFamily: 'inter' }}>Fast Mode Access</span>
                                                <span className="text-gray-500 dark:text-gray-400" style={{ fontSize: '10px', fontFamily: 'inter' }}>Get exclusive access to fast mode</span>
                                            </div>
                                        </div>

                                        <div className="p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex h-[70px] transition-colors duration-200" style={{ borderRadius: '8px' }}>
                                            <div className="bg-blue-50 dark:bg-blue-900/30" style={{ borderRadius: '6px', width: '42px', height: '42px', position: 'relative' }}>
                                                <Image src={prize} alt="prize" style={{
                                                    objectFit: 'none', transform: 'translate(-50%, -50%)',
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                }} />
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center', marginLeft: '5px'
                                            }}>
                                                <span className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-1" style={{ fontSize: '14px', fontFamily: 'inter' }}>Daily Prizes</span>
                                                <span className="text-gray-500 dark:text-gray-400" style={{ fontSize: '10px', fontFamily: 'inter' }}>Up to 300k $SCAN in daily rewards</span>
                                            </div>
                                        </div>

                                        <div className="p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex h-[70px] transition-colors duration-200" style={{ borderRadius: '8px' }}>
                                            <div className="bg-blue-50 dark:bg-blue-900/30" style={{ borderRadius: '6px', width: '42px', height: '42px', position: 'relative' }}>
                                                <Image src={x2} alt="x2" style={{
                                                    objectFit: 'none', transform: 'translate(-50%, -50%)',
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                }} />
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center', marginLeft: '5px'
                                            }}>
                                                <span className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-1" style={{ fontSize: '14px', fontFamily: 'inter' }}>Double Staking APY</span>
                                                <span className="text-gray-500 dark:text-gray-400" style={{ fontSize: '10px', fontFamily: 'inter' }}>Boost your $SCAN staking rewards</span>
                                            </div>
                                        </div>

                                        <div className="p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex h-[70px] transition-colors duration-200" style={{ borderRadius: '8px' }}>
                                            <div className="bg-blue-50 dark:bg-blue-900/30" style={{ borderRadius: '6px', width: '42px', height: '42px', position: 'relative' }}>
                                                <Image src={king} alt="king" style={{
                                                    objectFit: 'none', transform: 'translate(-50%, -50%)',
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                }} />
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center', marginLeft: '5px'
                                            }}>
                                                <span className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-1" style={{ fontSize: '14px', fontFamily: 'inter' }}>$SCAN Buyback & Burn</span>
                                                <span className="text-gray-500 dark:text-gray-400" style={{ fontSize: '10px', fontFamily: 'inter' }}>50% from collected payments</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div
                                        className="p-4 bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 transition-colors duration-200"
                                        style={{
                                            height: '64px',
                                            borderRadius: '8px',
                                        }}
                                    >
                                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                                            <span className="text-gray-500 dark:text-gray-400" style={{ fontFamily: 'DM Sans', fontSize: '14px', fontWeight: 400 }}>
                                                Total sold:{' '}
                                                <b style={{ color: '#0052FF' }}>
                                                    {checkingAvailability ? (
                                                        <span className="inline-block animate-spin">⏳</span>
                                                    ) : (
                                                        totalSold?.toLocaleString()
                                                    )}
                                                </b>
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400" style={{ fontFamily: 'DM Sans', fontSize: '14px', fontWeight: 400 }}>
                                                Available:{' '}
                                                <b style={{ color: '#0052FF' }}>
                                                    {checkingAvailability ? (
                                                        <span className="inline-block animate-spin">⏳</span>
                                                    ) : (
                                                        TOTAL_NFTS.toLocaleString()
                                                    )}
                                                </b>
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700 ease-out"
                                                style={{
                                                    width: `${progressPercent}%`,
                                                    background: 'linear-gradient(90deg, #50DEF5 0%, #0052FF 100%)',
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Price + Button */}
                                    <div
                                        className="flex flex-col sm:flex-row justify-between items-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 transition-colors duration-200"
                                        style={{
                                            width: 'auto',
                                            height: 'auto',
                                            borderRadius: '8px',
                                        }}
                                    >
                                        <div className="flex flex-col justify-between h-full w-full p-4 gap-4">
                                            <div className="flex flex-col sm:flex-row justify-between items-center">

                                                <div className="flex items-center">
                                                    <div
                                                        className="text-gray-800 dark:text-gray-200"
                                                        style={{
                                                            fontFamily: 'Inter',
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            textTransform: 'uppercase',
                                                        }}
                                                    >
                                                        Current Price
                                                    </div>

                                                    <div
                                                        className="text-gray-900 dark:text-white"
                                                        style={{
                                                            fontFamily: 'Inter',
                                                            fontWeight: 700,
                                                            fontSize: '30px',
                                                            marginLeft: '5px'
                                                        }}
                                                    >
                                                        69 <span className="text-sm font-medium text-gray-600 dark:text-gray-400">USDC</span>
                                                    </div>
                                                </div>


                                                <img
                                                    src="/x402-logo.svg"
                                                    alt="x402 Payments"
                                                    width={152}
                                                    height={30}
                                                    className="rounded-md"
                                                />
                                            </div>
                                            <button
                                                onClick={onClick}
                                                disabled={!authenticated || !address || loading || availableNFTs === 0}
                                                style={{ borderRadius: '8px' }}
                                                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 rounded-md mt-4 sm:mt-0"

                                            >
                                                {loading ? currentStep || 'Processing…' : 'Buy BoostPass NFT'}
                                            </button>

                                            {/* Info about wallet display */}
                                            {/* <div className="text-xs text-gray-500 mt-2 text-center">
                                                ⓘ Your wallet may show "69000000" - this is 69 USDC in atomic units
                                            </div> */}
                                        </div>




                                        {/* Loading Step Feedback */}
                                        {/* {loading && (
                            <div className="text-xs text-blue-600 animate-pulse text-center">{currentStep}</div>
                        )} */}


                                    </div>
                                    {error && (
                                        <div style={{ borderRadius: '8px' }} className="mt-2 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-md py-2 px-3 text-center animate-fade-in">
                                            {error}
                                        </div>
                                    )}

                                    {successMessage && (
                                        <div
                                            style={{ borderRadius: '8px' }}
                                            className="mt-2 text-[13px] text-green-700 bg-green-50 border border-green-200 py-2 px-3 text-center animate-fade-in"
                                        >
                                            {successMessage}

                                            <a
                                                href={`https://www.x402scan.com/recipient/0x07737a1fb3863202bcd3c7408b801eed68604d39/transactions`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline break-all"
                                            >
                                                View on X402Scan 🔗
                                            </a>
                                        </div>


                                    )}
                                </div>
                            </div>
                        </main>
                        <QrBaseFooter />
                    </div>
                </div>

            )}
        </>

    );
}


export default function CoinbasePassPage() {
    return <CoinbasePassContent />;
}
