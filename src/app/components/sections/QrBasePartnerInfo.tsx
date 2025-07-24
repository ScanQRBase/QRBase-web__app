import { ExternalLinkSvg } from '@/src/app/images/svg/utils/ExternalLinkSvg';
import React, { useState } from 'react';
import { Tooltip } from '@mui/material';
import InfoIcon from '@/src/app/images/svg/utils/InfoIcon';
import XIcon from '@/src/app/images/svg/socialMedia/XIcon';
import TelegramIcon from '@/src/app/images/svg/socialMedia/TelegramIcon';
import ZoraIcon from '@/src/app/images/svg/socialMedia/ZoraIcon';
import WebsiteIcon from '@/src/app/images/svg/socialMedia/WebsiteIcon';
import ShareIcon from '@/src/app/images/svg/socialMedia/ShareIcon';
import WarpcastIcon from '@/src/app/images/svg/socialMedia/WarpcastIcon';

import ShareModal from "./modals/ShareModal";

export default function QrBasePartnerInfo({ partnerData, scanData, scanBalance, partnerBalance }: any) {
  const [isModalOpen, setModalOpen] = useState(false);


  const StatusIcon = ({ status }: { status: 'unknown' | 'rejected' | 'accepted' }) => {
    switch (status) {
      case 'accepted':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M8.5 12.5l2.5 2.5l5 -5" />
          </svg>

        );
      case 'rejected':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="16" y1="8" x2="8" y2="16" />
            <line x1="8" y1="8" x2="16" y2="16" />
          </svg>

        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
          </svg>);
    }
  };

  const getStatus = (balance: number | null, min: number) => {
    if (balance === null) return 'unknown';
    return balance >= min ? 'accepted' : 'rejected';
  };


  const formatLargeValue = (value: number) => {
    if (value >= 1_000_000_000) {
      const num = Math.round(value / 100_000_000) / 10;
      return `${Number.isInteger(num) ? num.toFixed(0) : num}B`;
    } else if (value >= 1_000_000) {
      const num = Math.round(value / 100_000) / 10;
      return `${Number.isInteger(num) ? num.toFixed(0) : num}M`;
    } else {
      const num = Math.round(value / 100) / 10;
      return `${Number.isInteger(num) ? num.toFixed(0) : num}K`;
    }
  };


  return (
    <div className="zoraClass flex flex-col justify-center border-gray-200 border-b p-4 py-8 pb-12 md:w-1/3 md:border-r md:border-b-0 md:py-22 lg:border-r lg:p-6 lg:pb-22 md:pt-8" style={{ marginTop: '50px' }}>

      <div className="space-y-4 text-left">
        <h2 className="font-bold text-2xl leading-tight"
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontStretch: 'condensed',
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{display:'flex' , alignItems:'center'}}> <img
            src={partnerData.partnerLogo}
            alt="Logo"
            width={38}
            height={38}
          />
          <span style={{fontWeight:'bold' , marginLeft:'6px' , fontSize : partnerData.title =='Base is for everyone' ? '18px' : ''}}>{partnerData.title.toUpperCase()}</span></div>
         
          <Tooltip title={`Share`}>

            <div onClick={() => setModalOpen(true)} className="relative group" style={{ border: '1px solid #D0E1FF', borderRadius: '50%', width: '30px', height: "30px", position: 'relative', cursor: 'pointer' }}>
              <ShareIcon size={20} color={partnerData.PRIMARY_COLOR} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} />
            </div>
          </Tooltip>
        </h2>
        <p className="text-[0.75rem] leading-relaxed" dangerouslySetInnerHTML={{ __html: partnerData.description }} />

        {/* ✅ Social Media Links */}
        <div className="flex flex-wrap gap-3 items-center relative" style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700' }}>Social :</span>

          {partnerData.x_link && (
            <Tooltip title={`X`}>
              <a href={partnerData.x_link} target="_blank" rel="noopener noreferrer" className="relative group" style={{ border: '1px solid #D0E1FF', borderRadius: '50%', width: '30px', height: "30px", position: 'relative' }}>
                <XIcon size={15} color={partnerData.PRIMARY_COLOR} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} />
              </a>

            </Tooltip>
          )}
          {partnerData.website_link && (
            <Tooltip title={`Website`}>
              <a href={partnerData.website_link} target="_blank" rel="noopener noreferrer" className="relative group" style={{ border: '1px solid #D0E1FF', borderRadius: '50%', width: '30px', height: "30px", position: 'relative' }}>
                <WebsiteIcon size={20} color={partnerData.PRIMARY_COLOR} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} />
              </a>
            </Tooltip>
          )}
          {partnerData.telegram_link && (
            <Tooltip title={`Telegram`}>
              <a href={partnerData.telegram_link} target="_blank" rel="noopener noreferrer" className="relative group" style={{ border: '1px solid #D0E1FF', borderRadius: '50%', width: '30px', height: "30px", position: 'relative' }}>
                <TelegramIcon size={20} color={partnerData.PRIMARY_COLOR} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} />
              </a>
            </Tooltip>
          )}
          {partnerData.warpcast_link && (
            <Tooltip title={`Warpcast`}>
              <a href={partnerData.warpcast_link} target="_blank" rel="noopener noreferrer" className="relative group" style={{ border: '1px solid #D0E1FF', borderRadius: '50%', width: '30px', height: "30px", position: 'relative' }}>
                <WarpcastIcon size={20} color={partnerData.PRIMARY_COLOR} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} />
              </a>
            </Tooltip>
          )}
          {partnerData.zora_link && (
            <Tooltip title={`Zora`}>
              <a href={partnerData.zora_link} target="_blank" rel="noopener noreferrer" className="relative group" style={{ border: '1px solid #D0E1FF', borderRadius: '50%', width: '30px', height: "30px", position: 'relative' }}>
                <ZoraIcon size={20} color={partnerData.PRIMARY_COLOR} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} />
              </a>
            </Tooltip>
          )}


        </div>

        <ShareModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          partnerData={partnerData}
        />



        {/* ✅ Holding Requirement Title */}
        <div style={{ maxWidth: '280px', minWidth: '220px', maxHeight: '130px', background: '#F6F6F6', placeContent: 'center', paddingLeft: '10px', borderRadius: '8px', marginBottom: '20px', padding: '10px 5px 10px 10px' }}>
          <h3 className="font-semibold text-lg" style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontStretch: 'condensed',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',

          }}>


            Holder Requirement:
            <Tooltip title="Holder Requirement" placement="top" >
              <span>
                <InfoIcon size={20} color={partnerData.PRIMARY_COLOR} style={{ objectFit: 'none', cursor: 'pointer' }} />
              </span>
            </Tooltip>
          </h3>

          <div className="flex flex-col space-y-1  mt-2">
            {/* ✅ Pulse Indicator */}
            <div className="flex items-center space-x-2">
              <p className="text-[0.75rem] leading-relaxed" style={{ display: 'flex', flexDirection: 'column' }}>
                <span>To reveal unlocked pieces:</span>
                <div className="flex items-center space-x-2" style={{ marginTop: '10px', marginBottom: '5px' }}>
                  <StatusIcon status={getStatus(scanBalance, scanData.MIN_TOKEN_BALANCE)} />
                  <span className="font-bold">
                    {formatLargeValue(scanData.MIN_TOKEN_BALANCE)} $SCAN
                  </span>
                </div>
                {partnerData.title !== 'SCAN' && (
                  <div className="flex items-center space-x-2">
                    <StatusIcon status={getStatus(partnerBalance, partnerData.MIN_TOKEN_BALANCE)} />
                    <span className="font-bold">
                      {formatLargeValue(partnerData.MIN_TOKEN_BALANCE)} ${partnerData.title.toUpperCase()}
                    </span>
                  </div>
                )}


              </p>
            </div>


          </div>
        </div>


        <div style={{ maxWidth: '280px', minWidth: '220px', height: '130px', background: '#F6F6F6', placeContent: 'center', paddingLeft: '10px', borderRadius: '8px', padding: '10px 5px 10px 10px' }}>
          <h3 className="font-semibold text-lg" style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontStretch: 'condensed',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>


            Reward Tiers
            <Tooltip title="Reward Tiers" placement="top">
              <span>
                <InfoIcon size={20} color={partnerData.PRIMARY_COLOR} style={{ objectFit: 'none', cursor: 'pointer' }} />
              </span>
            </Tooltip>
          </h3>

          <div className="flex flex-col space-y-1">
            {/* ✅ Updated Content with New Text */}
            <p className="text-[0.75rem] leading-relaxed mt-2" dangerouslySetInnerHTML={{ __html: partnerData.prizes }} />
          </div>
        </div>



        <div className="flex flex-col pt-6">
          <p className="pt-2 pb-2 font-bold text-[0.75rem] leading-relaxed">
            Useful Links :
          </p>

          {/* ✅ Button for opening modal */}
          <button
            type="button"
            onClick={() => alert('VIEW QRPAPER')}
            className="flex cursor-pointer items-center text-[0.75rem] leading-relaxed hover:underline"
          >
            VIEW QRPAPER
            <span className="pl-1">
              <ExternalLinkSvg />
            </span>
          </button>

          {/* ✅ External link remains as <a> */}
          <a
            href="https://docs.qrbase.xyz/"
            className="flex cursor-pointer items-center pt-1 hover:underline"
            target="_blank"
            rel="noreferrer"

          >
            <p className="text-[0.75rem] leading-relaxed">VIEW DOCS</p>
            <span className="pl-1">
              <ExternalLinkSvg />
            </span>
          </a>
        </div>

      </div>
    </div>
  );
}
