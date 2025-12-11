import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import XIcon from "@/src/app/images/svg/socialMedia/XIcon";
import InfoIcon from "@/src/app/images/svg/utils/InfoIcon";
import WarpcastIcon from "@/src/app/images/svg/socialMedia/WarpcastIcon";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: any;
  dollarPrize:any
}


const config = {
  API_KEY_CLOUD: process.env.NEXT_PUBLIC_API_KEY ?? "",
  SHARE_API: "/api/checkShare"
};

export default function ShareModalFastmode({ shareData, onClose, isOpen , dollarPrize }: ShareModalProps) {
  if (!isOpen) return null;

  const [isLoading, setIsLoading] = useState(false)
  const shareTextTwitter = ` I won ${shareData?.lastPrice} $SCAN | ~${dollarPrize}$ on @ScanQRBase`;
  const shareTextWarpcast = ` I won ${shareData?.lastPrice} $SCAN |~${dollarPrize}$ on @scanqrbase.eth`;
  const encodedTextTwitter = encodeURIComponent(shareTextTwitter);
  const encodedTextWarpcast = encodeURIComponent(shareTextWarpcast);
  const twitterUrl = `https://x.com/intent/post?text=${encodedTextTwitter}%0A%0Ahttps://www.qrbase.xyz/fast-mode?ref=twitter_4R1`;
  const warpcastUrl = `https://farcaster.xyz/~/compose?text=${encodedTextWarpcast}&embeds[]=https://farcaster.xyz/miniapps/pSTSE9GDxQA7/qrbase?path=/fast-mode`;




      const handleXClick = async () => {
  try {
    // 1️⃣ Call your API
    const response = await fetch("/api/checkShare", {
      method: "POST",
       headers: {
              "Content-Type": "application/json",
              "api-key": config.API_KEY_CLOUD,
            },
       body: JSON.stringify({
              action: "share",
              address:shareData.address,
            }),
    });

    const data = await response.json();

    // 2️⃣ Open new window/tab
    window.open(twitterUrl, "_blank");
    onClose()


  } catch (error) {
    console.error("Error calling API:", error);
  }
};

const handleWarpcastClick = async () => {
  try {
    // 1️⃣ Call your API
    const response = await fetch("/api/checkShare", {
      method: "POST",
       headers: {
              "Content-Type": "application/json",
              "api-key": config.API_KEY_CLOUD,
            },
       body: JSON.stringify({
              action: "share",
              address:shareData.address,
            }),
    });

    // const data = await response.json();

    // 2️⃣ Open new window/tab
    window.open(warpcastUrl, "_blank");

    onClose()

  } catch (error) {
    console.error("Error calling API:", error);
  }
};
  


  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" style={{ marginTop: 0 }}>
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md relative border-4 m-5 md:m-0 md:max-w-lg lg:max-w-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Share</h2>
          {/* <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button> */}
        </div>

        {/* SEO Card */}
        <div className="rounded-lg mb-6" style={{ placeSelf: 'center' }}>
          {isLoading ? (
            <div className="flex justify-center items-center w-full">
              {/* Simple CSS spinner */}
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-gray-900"></div>
            </div>
          ) : (
           
              <img
                src='https://ik.imagekit.io/cafu/Share_Fast_Mode.jpg?updatedAt=null&ik-s=877f60e5991aa39fa0b9722fd4b2cda05646c23e'
                alt="Share Card"
                className="w-full object-contain rounded-md"
                style={{ borderRadius: "10px" }}
              />
            
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-evenly">
          {/* X.com Button */}
          <button
            onClick={handleXClick}
            className="flex items-center justify-center gap-2 bg-gray-200 text-gray-900 px-4 py-1.5 rounded-2xl text-sm font-medium transition-colors duration-200 hover:bg-gray-300 w-full sm:w-[136px]"
          >
            <XIcon size={16}  />
            X.com
          </button>

          {/* Warpcast Button */}
          <button
            onClick={handleWarpcastClick}
            className="flex items-center justify-center gap-2 bg-gray-200 text-gray-900 px-4 py-1.5 rounded-2xl text-sm font-medium transition-colors duration-200 hover:bg-gray-300 w-full sm:w-[136px]"
          >
            <WarpcastIcon size={18}  />
            Farcaster
          </button>

          {/* Copy Link Button */}
        </div>
      </div>
    </div>
  );
}