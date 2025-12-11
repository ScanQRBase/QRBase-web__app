import { Tooltip } from '@mui/material';
import XIcon from '@/src/app/images/svg/socialMedia/XIcon';
import TelegramIcon from '@/src/app/images/svg/socialMedia/TelegramIcon';
import WarpcastIcon from '@/src/app/images/svg/socialMedia/WarpcastIcon';
import ZoraIcon from '@/src/app/images/svg/socialMedia/ZoraIcon';
import Logo from "@/src/app/images/logo/logo-first.png";
import Image from 'next/image';

const partnerData = {
  telegram_link: "https://t.me/ScanQRBase",
  warpcast_link: "https://warpcast.com/~/channel/qrbase",
  zora_link: "https://zora.co/@scanqrbase",
  x_link: "https://x.com/ScanQRBase",
  PRIMARY_COLOR: "#0052FF",
};

export default function Footer() {
  return (
    <footer className="z-50 w-full border-t border-gray-200 bg-white" style={{width:"100dvw"}}>
      <div className="mx-auto max-w-7xl px-4 py-3  flex flex-col md:flex-row items-center md:justify-between gap-4">
        
        {/* Logo + text (visible on all screens, centered on mobile) */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left text-xs">
          <Image
            src={Logo}
            alt="Logo"
            width={120}
            height={34}
            className="w-24 md:w-32"
          />
         
          <span className="pt-1 text-[10px] text-gray-600">
            ⓒ 2025 QRBase. All rights reserved
          </span>
        </div>

        {/* Social Icons */}
        <div className="flex flex-wrap justify-center gap-3">
          {partnerData.x_link && (
            <Tooltip title="X">
              <a
                href={partnerData.x_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-full border border-[#D0E1FF]"
              >
                <XIcon size={15} color={partnerData.PRIMARY_COLOR} />
              </a>
            </Tooltip>
          )}

          {partnerData.telegram_link && (
            <Tooltip title="Telegram">
              <a
                href={partnerData.telegram_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-full border border-[#D0E1FF]"
              >
                <TelegramIcon size={20} color={partnerData.PRIMARY_COLOR} />
              </a>
            </Tooltip>
          )}

          {partnerData.warpcast_link && (
            <Tooltip title="Farcaster">
              <a
                href={partnerData.warpcast_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-full border border-[#D0E1FF]"
              >
                <WarpcastIcon size={20} color={partnerData.PRIMARY_COLOR} />
              </a>
            </Tooltip>
          )}

          {partnerData.zora_link && (
            <Tooltip title="Zora">
              <a
                href={partnerData.zora_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-full border border-[#D0E1FF]"
              >
                <ZoraIcon size={20} color={partnerData.PRIMARY_COLOR} />
              </a>
            </Tooltip>
          )}
        </div>
      </div>
    </footer>
  );
}
