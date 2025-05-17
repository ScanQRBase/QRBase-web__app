import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import XIcon from "@/src/app/images/svg/socialMedia/XIcon";
import InfoIcon from "@/src/app/images/svg/utils/InfoIcon";
import WarpcastIcon from "@/src/app/images/svg/socialMedia/WarpcastIcon";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerData: any;
}

export default function ShareModal({ partnerData, onClose, isOpen }: ShareModalProps) {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState('');
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTextTwitter = `Checkout $${partnerData?.title} on @ScanQRBase`;
  const shareTextWarpcast = `Checkout $${partnerData?.title} on @scanqrbase.eth`;


  const encodedTextTwitter = encodeURIComponent(shareTextTwitter);
  const encodedTextWarpcast = encodeURIComponent(shareTextWarpcast);

  const encodedLink = encodeURIComponent(currentUrl);

  const twitterUrl = `https://x.com/intent/post?text=${encodedTextTwitter}%0A%0A${encodedLink}`;
  const warpcastUrl = `https://warpcast.com/~/compose?text=${encodedTextWarpcast}&embeds[]=${encodedLink}`;


  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true)
    fetch(`https://api.microlink.io/?url=${encodeURIComponent(currentUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          const image = data.data.image?.url as string
          setPreview(
            data.data.image?.url,
          );
        }
        setIsLoading(false)
      })
      .catch(() => setPreview(''));
  }, [isOpen, currentUrl]);
  

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" style={{ marginTop: 0 }}>
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md relative border-4 md:max-w-lg lg:max-w-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Share</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEO Card */}
        <div className="rounded-lg mb-6" style={{ width: 'max-content', placeSelf: 'center' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-48 w-full">
              {/* Simple CSS spinner */}
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-gray-900"></div>
            </div>
          ) : (
            preview ? (
              <img
                src={preview}
                alt="SEO Card"
                className="w-full h-48 object-contain rounded-md"
                style={{ borderRadius: "10px" }}
              />
            ) : (
              <div className="w-full h-48 flex justify-center items-center bg-gray-100 rounded-md text-gray-400">
                No preview available
              </div>
            )
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          {/* X.com Button */}
          <button
            onClick={() => window.open(twitterUrl, "_blank")}
            className="flex items-center justify-center gap-2 bg-gray-200 text-gray-900 px-4 py-1.5 rounded-2xl text-sm font-medium transition-colors duration-200 hover:bg-gray-300 w-full sm:w-[136px]"
          >
            <XIcon size={16} color={partnerData.PRIMARY_COLOR} />
            X.com
          </button>

          {/* Warpcast Button */}
          <button
            onClick={() => window.open(warpcastUrl, "_blank")}
            className="flex items-center justify-center gap-2 bg-gray-200 text-gray-900 px-4 py-1.5 rounded-2xl text-sm font-medium transition-colors duration-200 hover:bg-gray-300 w-full sm:w-[136px]"
          >
            <WarpcastIcon size={18} color={partnerData.PRIMARY_COLOR} />
            Warpcast
          </button>

          {/* Copy Link Button */}
          <motion.button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 bg-gray-200 text-gray-900 px-4 py-1.5 rounded-2xl text-sm font-medium transition-colors duration-200 hover:bg-gray-300 w-full sm:w-[136px]"
            whileTap={{ scale: 0.95 }}
          >
            {copied ? (
              <span className="text-green-600 font-medium">Copied! 🎉</span>
            ) : (
              <>
                <InfoIcon size={18} color={partnerData.PRIMARY_COLOR} />
                Copy link
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}