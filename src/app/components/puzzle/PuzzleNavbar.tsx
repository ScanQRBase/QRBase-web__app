"use client";
import { useEffect, useState } from "react";
import Logo from "@/src/app/images/logo/logo-first.png";
import LogoWhite from "@/src/app/images/logo/logo-first-white.png";
import Image from "next/image";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAuth } from '../../lib/context/AuthContext';
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Menu, X, HelpCircle } from 'lucide-react';
import { HowItWorksModal } from "@/src/app/components/puzzle/PuzzleModals";
import ProfilePopupModal from '@/src/app/components/puzzle/ProfilePopupModal';
import { useTheme } from "@/src/app/components/providers/ThemeProvider";
import ScanCoinBalance from "@/src/app/puzzle/components/ScanCoinBalance";

// Local puzzle icons
const PUZZLE_ICONS = {
    boost: '/images/puzzle/navbar/Lightning.svg',
    leaderboard: '/images/puzzle/navbar/Ranking.svg',
    puzzle: '/images/puzzle/navbar/Puzzle.svg',
    tasks: '/images/puzzle/navbar/CheckSquareOffset.svg',
    prizes: '/images/puzzle/navbar/TreasureChest.svg',
};

const NAV_LINKS = [
    // Puzzle navigation
    { name: "Puzzle", path: "/puzzle", iconUrl: PUZZLE_ICONS.puzzle },
    { name: "Prizes", path: "/puzzle/prizes", iconUrl: PUZZLE_ICONS.prizes },
    { name: "Boost", path: "/puzzle/boost", iconUrl: PUZZLE_ICONS.boost },
    { name: "Leaderboard", path: "/puzzle/leaderboard", iconUrl: PUZZLE_ICONS.leaderboard },
    { name: "Tasks", path: "/puzzle/tasks", iconUrl: PUZZLE_ICONS.tasks },
];


export default function QrBaseNavbar({ address: propAddress }: any) {
    const { authenticated, login, linkWallet, logout, user } = usePrivy();
    const { wallets } = useWallets();

    // Use safe address from AuthContext (filters out unlinked browser wallets for X users)
    const { address: authAddress, handleLinkWallet } = useAuth();

    // Prefer prop address, then auth-resolved address
    const address = propAddress || authAddress;
    const [showModal, setShowModal] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const twitter = user?.twitter?.username || user?.twitter?.name || user?.farcaster?.username || user?.farcaster?.displayName
    const twitterImage = user?.twitter?.profilePictureUrl?.replace('_normal', '') || user?.farcaster?.pfp
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showHowItWorks, setShowHowItWorks] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Generate userId for API calls
    const userId = user?.farcaster?.fid
        ? `fc:${user.farcaster.fid}`
        : user?.twitter?.username
            ? `x:${user.twitter.username}`
            : null;

    // Handle referral registration from URL params
    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref && userId && ref !== userId) {
            // Register referral relationship
            fetch('/api/game/referral/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referrerId: ref, referredId: userId }),
            }).catch(console.error);
        }
    }, [searchParams, userId]);


    const buttonStyle: React.CSSProperties = {
        width: "140px",
        minWidth: "140px",
        height: "38px",
        paddingTop: "10px",
        paddingBottom: "10px",
        borderRadius: "4px",
        backgroundColor: "#0052FF",
        color: "white",
        fontFamily: "Inter, sans-serif",
        fontWeight: 500,
        fontSize: "14px",
        textAlign: "center",
    };


    const mobileButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        width: "auto",
        minWidth: "80px",
        padding: "0 15px",
        fontSize: "12px",
    };


    // Step 1: Twitter login only
    const handleLogin = async () => {
        if (!authenticated) {
            await login(); // Twitter login
        }
    };

    // Auto-show wallet connection popup for X users without linked wallet
    useEffect(() => {
        if (authenticated && user?.twitter && !user?.wallet) {
            setShowModal(true);
        }
    }, [authenticated, user?.twitter, user?.wallet]);

    const handleLogout = async () => {
        if (wallets.length > 0)
            for (const wallet of wallets) {
                if (wallet.linked)
                    await wallet.unlink();
            }
        await logout();
        setShowModal(false);
        setIsMenuOpen(false); // Close menu on logout
        window.location.reload();
    };
    // Step 2: Force WalletConnect
    const handleWalletConnect = async () => {
        await handleLinkWallet();
        setShowModal(false);
    };

    // const reversedCoins = useMemo(() => {
    //   return coinsBoughtDisplay.slice().reverse(); // create a reversed copy and take only the first once
    // }, [coinsBoughtDisplay]);



    const AuthButton = ({ isMobile = false }) => (
        <>
            {/* 1. NOT AUTHENTICATED */}
            {!authenticated && (
                <button
                    onClick={handleLogin}
                    className="ti-btn cursor-pointer !rounded-full shadow-sm hover:opacity-90 transition-opacity"
                    style={isMobile ? mobileButtonStyle : buttonStyle}
                >
                    Sign In
                </button>
            )}

            {/* 2. AUTHENTICATED NO WALLET */}
            {authenticated && user?.twitter && !user?.wallet && (
                <button
                    className="ti-btn cursor-pointer !rounded-full shadow-sm hover:opacity-90 transition-opacity"
                    onClick={() => setShowModal(true)}
                    style={isMobile ? mobileButtonStyle : buttonStyle}
                >
                    {isMobile ? "Wallet" : "Connect Wallet"}
                </button>
            )}

            {/* 3. FULLY AUTHENTICATED (Show Image) */}
            {authenticated && ((user?.twitter && user?.wallet) || user?.farcaster) && (
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setShowModal(true)}
                >
                    {twitterImage ? (
                        <img
                            src={twitterImage}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                            alt="User"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse border border-gray-200 dark:border-gray-600" />
                    )}
                </div>
            )}
        </>
    );

    return (
        <>
            <header className="fixed top-0 left-0 w-full border-gray-200 dark:border-gray-700 border-b bg-white dark:bg-gray-900 z-50 mt-10 transition-colors duration-200">
                <div className="container mx-auto flex h-full items-center px-4 py-2 lg:px-6">
                    <div className="flex w-full items-center justify-between">

                        {/* Logo + Name */}
                        <div className="flex items-center space-x-3 w-[160px] max-[425px]:w-[140px]">
                            <Link href="/">
                                <Image
                                    src={isDark ? LogoWhite : Logo}
                                    alt="Logo"
                                    width={150}
                                    height={42.75}
                                    className="md:w-36 w-24"
                                />
                            </Link>
                            {/* <span className="ock-bg-alternate ock-text-foreground rounded-sm px-2 py-0.5 font-regular mt-1 md:text-sm hidden sm:block">
                $SCAN
              </span> */}



                        </div>


                        <div className="hidden md:flex flex-1 gap-2 items-center justify-center">
                            {NAV_LINKS.map((link) => {
                                const isExternal = link.path.startsWith("http");
                                const isActive = pathname === link.path;

                                const linkClasses = `flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-150 ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600'
                                    }`;

                                const iconStyle = {
                                    filter: isActive
                                        ? 'invert(22%) sepia(99%) saturate(4700%) hue-rotate(213deg) brightness(100%) contrast(101%)'
                                        : undefined
                                };

                                return isExternal ? (
                                    <a
                                        key={link.path}
                                        href={link.path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={linkClasses}
                                    >
                                        <img src={link.iconUrl} alt="" className="w-4 h-4" style={iconStyle} />
                                        {link.name}
                                    </a>
                                ) : (
                                    <Link
                                        key={link.path}
                                        href={link.path}
                                        className={linkClasses}
                                    >
                                        <img src={link.iconUrl} alt="" className="w-4 h-4" style={iconStyle} />
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* 3. RIGHT: Auth Button/Image (Visible on all screens) */}
                        <div
                            className="flex items-center space-x-2 flex-shrink-0"
                            style={{ justifyContent: "end" }}
                        >
                            {/* $SCAN Balance - only show when authenticated */}
                            <ScanCoinBalance walletAddress={authenticated ? address : null} />
                            {/* Desktop Auth */}
                            <div className="hidden md:block">
                                <AuthButton isMobile={false} />
                            </div>
                            {/* Mobile Auth (simplified) */}
                            <div className="md:hidden">
                                <AuthButton isMobile={true} />
                            </div>
                            {/* 2. CENTER: Hamburger (Mobile Only) */}
                            <button
                                className="md:hidden p-2 min-w-[44px] min-h-[44px] text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-colors text-[#0052FF]"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                aria-label="Toggle menu"
                            >
                                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 🖤 OVERLAY */}
                {isMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 z-[90] top-[100px] "
                        onClick={() => setIsMenuOpen(false)}
                    />
                )}

                {/* 📱 MOBILE DROPDOWN MENU (Slide From Left + top:100px) */}
                <div
                    className={`md:hidden fixed left-0 top-[100px] h-[calc(100vh-100px)] w-64 bg-white dark:bg-gray-900 
    border-r border-gray-200 dark:border-gray-700 shadow-lg transition-transform duration-300 ease-in-out z-[99]
    ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
  `}
                >
                    <div className="flex flex-col p-4 space-y-1 text-left overflow-y-auto">
                        {/* Puzzle Section Label */}
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-2">
                            Puzzle
                        </div>

                        {/* Puzzle Links */}
                        {NAV_LINKS.slice(0, 5).map((link) => {
                            const isActive = pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    href={link.path}
                                    className={`flex items-center space-x-3 text-base font-medium py-2.5 px-3 rounded-lg transition-all duration-150 group
                                        ${isActive
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <img
                                        src={link.iconUrl}
                                        alt={`${link.name} Icon`}
                                        className="w-5 h-5 object-contain flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                                        style={{
                                            filter: isActive
                                                ? 'invert(22%) sepia(99%) saturate(4700%) hue-rotate(213deg) brightness(100%) contrast(101%)'
                                                : undefined
                                        }}
                                    />
                                    <span>{link.name}</span>
                                </Link>
                            );
                        })}

                        {/* Divider */}
                        <div className="border-t border-gray-200 dark:border-gray-700 my-3" />

                        {/* More Section Label */}
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-2">
                            More
                        </div>

                        {/* External Links */}
                        {NAV_LINKS.slice(5).map((link) => {
                            const isExternal = link.path.startsWith('http');
                            const LinkComponent = isExternal ? 'a' : Link;
                            const linkProps = isExternal
                                ? { href: link.path, target: '_blank', rel: 'noopener noreferrer' }
                                : { href: link.path };

                            return (
                                <LinkComponent
                                    key={link.path}
                                    {...linkProps}
                                    className="flex items-center space-x-3 text-base font-medium py-2.5 px-3 rounded-lg transition-all duration-150 group text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <img
                                        src={link.iconUrl}
                                        alt={`${link.name} Icon`}
                                        className="w-5 h-5 object-contain rounded-md flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                                    />
                                    <span>{link.name}</span>
                                    {isExternal && (
                                        <svg className="w-3 h-3 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    )}
                                </LinkComponent>
                            );
                        })}

                        {/* How it Works */}
                        <button
                            onClick={() => { setShowHowItWorks(true); setIsMenuOpen(false); }}
                            className="flex items-center space-x-3 text-base font-medium py-2.5 px-3 rounded-lg transition-all duration-150 group text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <HelpCircle size={20} className="flex-shrink-0 group-hover:scale-105 transition-transform duration-200" />
                            <span>How it Works</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* 🔹 Profile Popup Modal - Enhanced with Level and Referral UI */}
            <ProfilePopupModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                userId={userId}
                twitter={twitter || null}
                twitterImage={twitterImage || null}
                address={address}
                onWalletConnect={handleWalletConnect}
                onLogout={handleLogout}
                isFarcaster={!!user?.farcaster}
            />

            {/* How It Works Modal */}
            {showHowItWorks && (
                <HowItWorksModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
            )}
        </>
    );
}
