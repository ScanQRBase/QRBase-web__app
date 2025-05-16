
import Logo from "@/src/app/images/logo/logo-first.png";
import Image from "next/image";
import { WalletIsland } from '@coinbase/onchainkit/wallet';
import CoinsBoughtDisplay from '@/src/app/components/shared/CoinsBoughtDisplay';



export default function Navbar({ coinsBoughtDisplay }: any) {

  return (
    <header className="fixed top-0 left-0 w-full border-gray-200 border-b bg-white z-50 mt-10">
      <div className="container mx-auto flex h-full items-center px-4 py-2 lg:px-6">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src={Logo}
              alt="Logo"
              width={150}
              height={42.75}
              className="md:w-36 w-24" 
            />
            <span className="ock-bg-alternate ock-text-foreground rounded-sm px-2 py-0.5 font-regular mt-1 md:text-sm hidden sm:block">
              $SCAN
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {coinsBoughtDisplay.map((item: any, index: any) => (
              <CoinsBoughtDisplay
                key={index}
                coins={item.balance}
                coinLogoUrl={item.logo}
              />
            ))}

            <div className="flex">
              <WalletIsland />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
