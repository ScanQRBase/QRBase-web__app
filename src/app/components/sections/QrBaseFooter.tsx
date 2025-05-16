import {  useMemo} from 'react';
import { BuyButton } from '@/src/app/components/shared/BuyButton';


export default function Footer({
  ownedNFTCount,
  partnerData,
  scanBalance,
  partnerBalance,
  hasEnoughScan,
  onSuccess
}: {
  ownedNFTCount: number;
  partnerData: any;
  scanBalance: number | null;
  partnerBalance: number | null;
  hasEnoughScan: boolean | null;
  onSuccess:() => void;
}) {
  const { pulseColor, balanceStatus } = useMemo(() => {
    const isDualToken = partnerData?.title !== 'Scan';
    const partnerTitle = partnerData?.title.toUpperCase();
 
    let statusText = '';

    if (hasEnoughScan === null) {
      statusText = 'Connect your wallet to view.';
    } else if (hasEnoughScan) {
        statusText = `You have sufficient balance!`;
    } else {
      if (isDualToken) {
        statusText = `You do not have enough $SCAN or $${partnerTitle}.`;
      } else {
        statusText = `You do not have enough $SCAN.`;
      }
    }
    return {
      pulseColor:
        hasEnoughScan === null
          ? 'bg-blue-600'
          : hasEnoughScan
            ? 'bg-green-500'
            : 'bg-red-500',
      balanceStatus: {
        text: statusText,
        color:
          hasEnoughScan === null
            ? 'text-black-500 italic text-xs'
            : hasEnoughScan
              ? 'text-green-500 italic text-xs'
              : 'text-red-500 italic text-xs',
        bg:
          hasEnoughScan === null
            ? 'bg-blue-100'
            : hasEnoughScan
              ? 'bg-green-100'
              : 'bg-red-100',
      },
    };
  }, [hasEnoughScan, scanBalance, partnerBalance, partnerData]);


  return (
    <div className="z-50 fixed right-0 bottom-0 w-full border-gray-200 border-t bg-[white]">
      <div className="flex w-full justify-center py-2 qrNumberInfo" style={{ alignItems: 'center', flexDirection: 'column' }}>
        <h2 className="font-bold text-lg text-center">
          TOTAL PIECES UNLOCKED {ownedNFTCount}/9
        </h2>
        <div
          className={`flex items-center px-3 py-1 rounded-full gap-2 max-w-[90%] md:max-w-[600px] ${balanceStatus.bg}`}
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            key={pulseColor}
            className={`flex-shrink-0 w-3 h-3 rounded-full ${pulseColor} animate-[pulse_0.4s_infinite]`}
          />
          <p
            className={`${balanceStatus.color} font-bold text-center text-sm leading-snug`}
            style={{
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              whiteSpace: 'normal',
              flex: '1 1 auto',
            }}
          >
            {balanceStatus.text}
          </p>
        </div>

      </div>
      <div className="mx-auto max-w-7xl " style={{ zIndex: 1, position: 'relative' }} >
        <div className="flex flex-col justify-between py-4 md:flex-row md:items-center">
          <div className="mb-2 hidden flex-col px-4 text-xs md:flex md:mb-0 md:w-1/3 lg:px-6">
            <span>Built with OnchainKit on Base</span>
            <a className="pt-1 text-[10px] text-gray-600 hover:text-gray-900">
              ⓒ 2025 QRBase. All rights reserved
            </a>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 px-4 sm:flex-row sm:gap-0 md:w-auto lg:px-6 connectButtons">
            <div className="flex justify-center md:justify-start gap-4 w-[300px]">
                <BuyButton  type={{
                  name: partnerData.title,
                  address: partnerData.id,
                  symbol: partnerData.title,
                  decimals: 18,
                  image:partnerData.logo,
                  chainId: 8453,
                }}
                onSuccess={onSuccess}
                 />
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}