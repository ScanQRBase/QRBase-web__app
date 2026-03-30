"use client";
import { useEffect, useMemo, useState } from "react";
import Logo from "@/src/app/images/logo/logo-first.png";
import LogoWhite from "@/src/app/images/logo/logo-first-white.png";
import Image from "next/image";
import CoinsBoughtDisplay from '@/src/app/components/shared/CoinsBoughtDisplay';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import ProfilePopupModal from '@/src/app/components/puzzle/ProfilePopupModal';
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, HelpCircle } from 'lucide-react';
import { HowItWorksModal } from "@/src/app/components/puzzle/PuzzleModals";
import { useTheme } from "@/src/app/components/providers/ThemeProvider";

const NAV_LINKS = [
  {
    name: "Winners",
    path: "/winners",
    iconUrl: 'https://ik.imagekit.io/cafu/winner.svg?updatedAt=null&ik-s=19eb6d652dfb09aae1039b6ccfd8f6947765a18a'
  },
  {
    name: "Stake $SCAN",
    path: "https://staking.qrbase.xyz/",
    iconUrl: 'https://ik.imagekit.io/cafu/staking.svg?updatedAt=null&ik-s=b66154c412fa43e4130bd96dfe3aa9498542d292'
  },
];

export default function QrBaseNavbar({ coinsBoughtDisplay, address, loading, scanModeAddress }: any) {
  const { authenticated, login, linkWallet, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const [showModal, setShowModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const twitter = user?.twitter?.username || user?.twitter?.name || user?.farcaster?.username || user?.farcaster?.displayName;
  const twitterImage = user?.twitter?.profilePictureUrl?.replace('_normal', '') || user?.farcaster?.pfp;
  const [displayCoins, setDisplayCoins] = useState(true);

  // Generate userId for profile popup API calls
  const userId = user?.farcaster?.fid
    ? `fc:${user.farcaster.fid}`
    : user?.twitter?.username
      ? `x:${user.twitter.username}`
      : null;

  const buttonStyle: React.CSSProperties = {
    width: "140px",
    minWidth: "140px",
    height: "38px",
    borderRadius: "4px",
    backgroundColor: "#0052FF",
    color: "white",
    fontFamily: "Inter, sans-serif",
    fontWeight: 500,
    fontSize: "14px",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };

  const mobileButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    width: "auto",
    minWidth: "80px",
    padding: "0 15px",
    fontSize: "12px",
  };

  const handleLogin = async () => {
    if (!authenticated) {
      await login();
    }
  };

  useEffect(() => {
    if (user?.twitter && !user?.wallet)
      setShowModal(true);
  }, [user]);

  const handleLogout = async () => {
    if (wallets.length > 0)
      for (const wallet of wallets) {
        if (wallet.linked) await wallet.unlink();
      }
    await logout();
    setDisplayCoins(false);
    setShowModal(false);
    setIsMenuOpen(false);
  };

  const handleWalletConnect = async () => {
    await linkWallet();
    setShowModal(false);
  };

  const reversedCoins = useMemo(() => {
    return coinsBoughtDisplay.slice().reverse();
  }, [coinsBoughtDisplay]);

  const AuthButton = ({ isMobile = false }) => (
    <>
      {!authenticated && (
        <button
          onClick={handleLogin}
          className="ti-btn cursor-pointer !rounded-full shadow-sm hover:opacity-90 transition-opacity"
          style={isMobile ? mobileButtonStyle : buttonStyle}
        >
          Sign In
        </button>
      )}

      {authenticated && user?.twitter && !user?.wallet && (
        <button
          className="ti-btn cursor-pointer !rounded-full shadow-sm hover:opacity-90 transition-opacity"
          onClick={() => setShowModal(true)}
          style={isMobile ? mobileButtonStyle : buttonStyle}
        >
          {isMobile ? "Wallet" : "Connect Wallet"}
        </button>
      )}

      {authenticated && ((user?.twitter && user?.wallet) || user?.farcaster) && (
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <img
            src={twitterImage || "/web-app-manifest-192x192.png"}
            className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
            alt="User"
          />
        </div>
      )}
    </>
  );

  return (
    <>
      <header className="fixed top-0 left-0 w-full border-gray-200 dark:border-gray-700 border-b bg-white dark:bg-gray-900 z-[100] mt-10 transition-colors duration-200">
        <div className="container mx-auto flex h-full items-center px-4 py-2 lg:px-6 relative">

          {/* MOBILE VIEW (< md) */}
          <div className="flex items-center md:hidden">
            <Link href="/">
              <Image
                src={isDark ? LogoWhite : Logo}
                alt="Logo"
                width={100}
                height={28}
                className="w-24"
              />
            </Link>
          </div>



          {/* Mobile Right Side: Coins + Auth */}
          <div className="flex items-center space-x-2 md:hidden ml-auto">
            {/* 🪙 COINS DISPLAY: Now visible on mobile */}
            {reversedCoins.map((item: any) => (
              displayCoins && <CoinsBoughtDisplay
                key={item.logo}
                coins={item.balance}
                coinLogoUrl={item.logo}
              />
            ))}
            <AuthButton isMobile={true} />

            <button
              className="md:hidden p-2 min-w-[44px] min-h-[44px] text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-colors text-[#0052FF]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>


          {/* DESKTOP VIEW (>= md) */}
          <div className="hidden md:flex w-full items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/">
                <Image
                  src={isDark ? LogoWhite : Logo}
                  alt="Logo"
                  width={150}
                  height={42.75}
                  className="w-36"
                />
              </Link>

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
              <button
                onClick={() => setShowHowItWorks(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-150 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600"
              >
                <HelpCircle size={16} />
                How it Works
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* 🪙 COINS DISPLAY: Visible on desktop */}
              <div className="flex items-center space-x-2">
                {reversedCoins.map((item: any) => (
                  displayCoins && <CoinsBoughtDisplay
                    key={item.logo}
                    coins={item.balance}
                    coinLogoUrl={item.logo}
                  />
                ))}
              </div>
              <AuthButton isMobile={false} />
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
            {/* Section Label */}
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-2">
              Scan Mode
            </div>

            {NAV_LINKS.map((link) => {
              const isExternal = link.path.startsWith('http');
              const isActive = !isExternal && pathname === link.path;
              const LinkComponent = isExternal ? 'a' : Link;
              const linkProps = isExternal
                ? { href: link.path, target: '_blank', rel: 'noopener noreferrer' }
                : { href: link.path };

              return (
                <LinkComponent
                  key={link.path}
                  {...linkProps}
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
                  {isExternal && (
                    <svg className="w-3 h-3 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  )}
                </LinkComponent>
              );
            })}

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-3" />

            {/* More Section Label */}
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-2">
              More
            </div>

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

      {/* Profile Popup Modal */}
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
