"use client";
import { useEffect, useState } from "react";
import Logo from "@/src/app/images/logo/logo-first.png";
import Image from "next/image";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X } from 'lucide-react'; // Import icons


const NAV_LINKS = [
    { 
    name: "Winners", 
    path: "/fast-mode/winners", 
    iconUrl: "https://ik.imagekit.io/cafu/winner.svg?updatedAt=null&ik-s=19eb6d652dfb09aae1039b6ccfd8f6947765a18a" 
  },
  { 
    name: "Boostpass", 
    path: "/x402/boostpass", 
    iconUrl: "https://ik.imagekit.io/cafu/Boosgt.webp?updatedAt=1762250652409&ik-s=6674d098975a0f7113eb9e068adada6a7763ddb8" 
  },
];


export default function QrBaseNavbar({ address }: any) {
  const { authenticated, login, linkWallet, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const [showModal, setShowModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const router = useRouter();
  const twitter = user?.twitter?.username || user?.twitter?.name || user?.farcaster?.username || user?.farcaster?.displayName
  const twitterImage = user?.twitter?.profilePictureUrl?.replace('_normal', '') || user?.farcaster?.pfp
  const [isMenuOpen, setIsMenuOpen] = useState(false); // New state for mobile menu


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

  useEffect(() => {
    if (user?.twitter && !user?.wallet)
      setShowModal(true)
  }, [user])

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
    await linkWallet();
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
          <img
            src={twitterImage || "/web-app-manifest-192x192.png"}
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
            alt="User"
          />
        </div>
      )}
    </>
  );

  return (
    <>
      <header className="fixed top-0 left-0 w-full border-gray-200 border-b bg-white z-50 mt-10">
        <div className="container mx-auto flex h-full items-center px-4 py-2 lg:px-6">
          <div className="flex w-full items-center justify-between">

            {/* Logo + Name */}
            <div className="flex items-center space-x-3 w-[160px] max-[425px]:w-[140px]">
              <Link href="/">
                <Image
                  src={Logo}
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


            <div className="hidden md:flex w-[160px] max-[425px]:w-[200px] gap-4 justify-between" style={{ marginRight: '80px' }}>


              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className="font-medium text-sm hover:text-blue-600 transition-colors"
                  style={{ color: 'inherit' }} // Use style from old component
                >
                  {link.name}
                </Link>
              ))}

            </div>

            {/* 3. RIGHT: Auth Button/Image (Visible on all screens) */}
            <div
              className="flex items-center space-x-2 flex-shrink-0"
              style={{ justifyContent: "end" }}
            >

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
                className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors text-[#0052FF]"
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
          className={`md:hidden fixed left-0 top-[100px] h-[calc(100vh-100px)] w-64 bg-white 
    border-r border-gray-200 shadow-lg transition-transform duration-300 ease-in-out z-[99]
    ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
  `}
        >
          <div className="flex flex-col p-4 space-y-4 text-left">
             {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className="flex items-center space-x-3 text-lg font-medium text-gray-800 hover:text-blue-600 py-3 px-2 rounded-lg transition-colors duration-150 group hover:bg-blue-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <img
                  src={link.iconUrl}
                  alt={`${link.name} Icon`}
                  // Fixed size, object-contain for aspect ratio, and rounded corners
                  className="w-6 h-6 object-contain rounded-md flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                />
                {/* Link Name */}
                <span className="truncate">
                  {link.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* 🔹 Custom Popup */}
      {showModal && (
        <div className={`fixed inset-0 flex justify-center bg-black bg-opacity-40 ${user?.farcaster ? "items-end" : "items-center"
          }`} style={{ zIndex: 51 }}>
          <div className={`relative bg-white shadow-xl p-6 w-96 ${user?.farcaster ? "rounded-t-2xl" : "rounded-2xl"
            }`}>
            <div className="flex flex-col items-center text-center">
              <img
                src={twitterImage || "/web-app-manifest-192x192.png"}
                className="w-16 h-16 rounded-full object-cover mb-3"
                alt="Twitter"
              />
              <h2 className="text-lg font-semibold">@{twitter}</h2>
              <h3 className="mt-2 text-md font-bold">
                {address ? "Wallet connected" : "Connect your wallet"}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {address ?
                  <div className="relative flex-1" >
                    <button onClick={() => {
                      navigator.clipboard.writeText(address);
                      setShowTooltip(true);
                      setTimeout(() => setShowTooltip(false), 1200);
                    }}
                      className="w-full flex items-center justify-center px-3 py-1.5  rounded-md hover:bg-camel10 dark:hover:bg-[#FFFFFF0D] transition ti-btn"
                      style={{ color: "#666666", fontSize: "12px", padding: "6px", marginTop: "12px" }}  >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 16h8M8 12h8m-8-4h8M16 4H8a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2z"
                        />
                      </svg>

                      {address}
                    </button>

                    {showTooltip && (
                      <span
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-50 py-0.5 px-2 rounded bg-[#00382B] text-white text-[10px] font-medium shadow dark:bg-slate-700"
                        role="tooltip"
                      >
                        Copied!
                      </span>
                    )}
                  </div>
                  : "Connect your wallet to see the QR"}
              </p>




              <div className="mt-5 flex flex-col gap-2 w-full">
                {!address ? (
                  <button
                    onClick={handleWalletConnect}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg w-full"
                  >
                    Connect Wallet
                  </button>
                ) : null}

                {!user?.farcaster && (
                  <button
                    onClick={handleLogout}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg w-full"
                  >
                    Sign out
                  </button>
                )}
              </div>
            </div>

            <button
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
          </div >
        </div >
      )
      }

    </>
  );
}
