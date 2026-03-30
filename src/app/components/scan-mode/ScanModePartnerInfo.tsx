'use client';

import React, { useState } from 'react';
import { Tooltip } from '@mui/material';
import InfoIcon from '@/src/app/images/svg/utils/InfoIcon';
import { ExternalLinkSvg } from '@/src/app/images/svg/utils/ExternalLinkSvg';
import XIcon from '@/src/app/images/svg/socialMedia/XIcon';
import TelegramIcon from '@/src/app/images/svg/socialMedia/TelegramIcon';
import ZoraIcon from '@/src/app/images/svg/socialMedia/ZoraIcon';
import WebsiteIcon from '@/src/app/images/svg/socialMedia/WebsiteIcon';
import WarpcastIcon from '@/src/app/images/svg/socialMedia/WarpcastIcon';
import DiscordIcon from '@/src/app/images/svg/socialMedia/DiscordIcon';
import ShareIcon from '@/src/app/images/svg/socialMedia/ShareIcon';
import ShareModalScanMode from './ShareModalScanMode';
import StatusIcon from '../ui/StatusIcon';
import SocialLinkButton from '../ui/SocialLinkButton';
import InfoCard from '../ui/InfoCard';
import { formatLargeValue, getAccessStatus } from '../../lib/utils';

interface ScanModePartnerInfoProps {
    progress: {
        partnerName: string;
        description: string | null;
        partnerLogo: string;
        contractAddress: string | null;
        primaryColor: string;
        gradientStart: string;
        gradientEnd: string;
        link: string | null;
        xLink: string | null;
        telegramLink: string | null;
        warpcastLink: string | null;
        discordLink?: string | null;
        zoraLink?: string | null;
        minPuzzleWins: number;
        reward: number;
        minScanBalance?: number;
        minPartnerPuzzles?: number;
        rewardTiers?: { place: number; label: string; amount: number }[] | null;
        usefulLinks?: { label: string; url: string }[] | null;
        shareImages?: string | null;
        prizes?: string | null;
    };
    address: string | null;
    authenticated: boolean;
    userPartnerWins?: number;
    scanBalance?: number | null;
    piecesUnlocked?: number;
    totalPieces?: number;
    totalWins?: number;
    id?: string;
}

/**
 * Left sidebar — exact match to QrBasePartnerInfo layout/structure.
 */
export default function ScanModePartnerInfo({
    progress,
    address,
    authenticated,
    userPartnerWins = 0,
    scanBalance = null,
    piecesUnlocked = 0,
    totalPieces = 9,
    totalWins = 0,
    id,
}: ScanModePartnerInfoProps) {
    const {
        partnerName,
        description,
        partnerLogo,
        primaryColor,
        link,
        xLink,
        telegramLink,
        warpcastLink,
        discordLink,
        zoraLink,
        minScanBalance = 100000,
        minPuzzleWins = 0,
        rewardTiers,
        usefulLinks,
    } = progress;

    const isScanPartner = partnerName.toUpperCase() === 'SCAN';
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // Share image: API now returns only the active image based on piecesUnlocked
    const shareImageUrl = progress.shareImages || null;

    // Build prizes text from rewardTiers
    const prizesHtml = rewardTiers && rewardTiers.length > 0
        ? rewardTiers.map((t, i) => {
            const medals = ['🥇', '🥈', '🥉', '🏅', '🎖️'];
            return `${medals[i] || '🏅'} ${t.label}: <strong>$${t.amount.toLocaleString()}</strong>`;
        }).join('<br/>')
        : '';

    return (
        <>
            <div id={id} className="zoraClass flex flex-col justify-center border-gray-200 dark:border-gray-700 border-b p-4 py-8 pb-12 md:w-1/3 md:border-r md:border-b-0 md:py-22 md:pt-[50px] lg:border-r lg:p-6 lg:pb-22 lg:pt-[50px] transition-colors duration-200">
                <div className="space-y-4 text-left">

                    {/* ── Header: Logo + Name + Share ── */}
                    <h2 className="font-bold text-2xl leading-tight text-gray-900 dark:text-white"
                        style={{
                            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                            fontWeight: 700,
                            fontStretch: 'condensed',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <img
                                src={partnerLogo}
                                alt="Logo"
                                width={38}
                                height={38}
                            />
                            <span style={{ fontWeight: 'bold', marginLeft: '6px' }}>{partnerName.toUpperCase()}</span>
                        </div>

                        <SocialLinkButton
                            onClick={() => setIsShareModalOpen(true)}
                            tooltip="Share"
                            icon={<ShareIcon size={20} color={primaryColor} />}
                        />
                    </h2>

                    {/* ── Description ── */}
                    {description && (
                        <p className="text-[0.75rem] leading-relaxed text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: description }} />
                    )}

                    {/* ── Social Media Links ── */}
                    <div className="flex flex-wrap gap-3 items-center relative" style={{ marginBottom: '20px' }}>
                        <span className="text-gray-800 dark:text-gray-200" style={{ fontSize: '12px', fontWeight: '700' }}>Social :</span>

                        <SocialLinkButton href={xLink ?? undefined} tooltip="X" icon={<XIcon size={15} color={primaryColor} />} />
                        {link && <SocialLinkButton href={link} tooltip="Website" icon={<WebsiteIcon size={20} color={primaryColor} />} />}
                        {telegramLink && <SocialLinkButton href={telegramLink} tooltip="Telegram" icon={<TelegramIcon size={20} color={primaryColor} />} />}
                        {warpcastLink && <SocialLinkButton href={warpcastLink} tooltip="Farcaster" icon={<WarpcastIcon size={20} color={primaryColor} />} />}
                        {discordLink && <SocialLinkButton href={discordLink} tooltip="Discord" icon={<DiscordIcon size={20} color={primaryColor} />} />}
                        {zoraLink && <SocialLinkButton href={zoraLink} tooltip="Zora" icon={<ZoraIcon size={20} color={primaryColor} />} />}
                    </div>

                    {/* ── Access Requirements ── */}
                    <InfoCard
                        title="Access Requirements :"
                        tooltip="Gain access by holding $SCAN and Solving QR Puzzles for this token."
                        className="bg-gray-100 dark:bg-gray-800 transition-colors duration-200"
                    >
                        <p className="text-[0.75rem] leading-relaxed text-gray-700 dark:text-gray-300" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>To reveal unlocked pieces:</span>
                            <div className="flex items-center space-x-2" style={{ marginTop: '10px', marginBottom: '5px' }}>
                                <StatusIcon status={getAccessStatus(scanBalance, minScanBalance)} />
                                <span className="font-bold">
                                    Hold {formatLargeValue(minScanBalance)} $SCAN
                                </span>
                            </div>
                            {minPuzzleWins > 0 && (
                                <div className="flex items-center space-x-2">
                                    <StatusIcon status={userPartnerWins >= minPuzzleWins ? 'accepted' : (address ? 'rejected' : 'unknown')} />
                                    <span className="font-bold">
                                        Solve {minPuzzleWins} ${partnerName.toUpperCase()} PUZZLES
                                    </span>
                                </div>
                            )}
                        </p>
                    </InfoCard>

                    {/* ── Reward Tiers ── */}
                    {prizesHtml && (
                        <InfoCard
                            title="Reward Tiers"
                            tooltip="Reward Tiers"
                            className="bg-gray-100 dark:bg-gray-800 transition-colors duration-200"
                        >
                            <p className="text-[0.75rem] leading-relaxed mt-2 text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: prizesHtml }} />
                        </InfoCard>
                    )}

                    {/* ── Useful Links ── */}
                    <div className="flex flex-col pt-6">
                        <p className="pt-2 pb-2 font-bold text-[0.75rem] leading-relaxed text-gray-800 dark:text-gray-200">
                            Useful Links :
                        </p>

                        <button
                            type="button"
                            onClick={() => window.open('https://listing.qrbase.xyz/submit-application', '_blank')}
                            className="flex cursor-pointer items-center text-[0.75rem] leading-relaxed hover:underline text-gray-700 dark:text-gray-300"
                        >
                            LIST YOUR TOKEN
                            <span className="pl-1">
                                <ExternalLinkSvg />
                            </span>
                        </button>

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

                        {usefulLinks && usefulLinks.length > 0 && usefulLinks.map((ul, i) => (
                            <a
                                key={i}
                                href={ul.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex cursor-pointer items-center pt-1 hover:underline"
                            >
                                <p className="text-[0.75rem] leading-relaxed">{ul.label}</p>
                                <span className="pl-1">
                                    <ExternalLinkSvg />
                                </span>
                            </a>
                        ))}
                    </div>

                </div>
            </div>

            {/* Share Modal */}
            <ShareModalScanMode
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                partnerName={partnerName}
                primaryColor={primaryColor}
                shareImageUrl={shareImageUrl}
                stage={piecesUnlocked}
                totalPieces={totalPieces}
                prizes={progress.prizes || null}
            />
        </>
    );
}
