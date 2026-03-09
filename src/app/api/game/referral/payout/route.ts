/**
 * POST /api/game/referral/payout
 * Server-side $SCAN payout for referral claim rewards.
 * 
 * Flow:
 * 1. Query worker for user's pending referral earnings
 * 2. Transfer pending $SCAN from admin wallet to user's wallet (Base chain)
 * 3. Call /referral/claim on worker with txHash to record the claim
 * 
 * Works for web, Farcaster, and any platform — payout is server-side.
 */

import { NextRequest, NextResponse } from 'next/server';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { createThirdwebClient, getContract, sendTransaction, prepareContractCall } from 'thirdweb';
import { base } from 'thirdweb/chains';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = process.env.GAME_WORKER_URL || 'https://puzzlegame.bitgrass-crypto.workers.dev';
const API_KEY = process.env.GAME_API_KEY || '';
const SCAN_TOKEN_ADDRESS = '0x20429F731096e359910921994A267d32ef576720';
const SERVER_WALLET_PRIVATE_KEY = process.env.SERVER_WALLET_PRIVATE_KEY || '';
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY || '';
const MINIMUM_CLAIM = 10000; // 10,000 raw units = 10 $SCAN

const client = createThirdwebClient({
    secretKey: THIRDWEB_SECRET_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const { userId, recipientAddress } = body;

        // Validate inputs
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
        }
        if (!recipientAddress || !recipientAddress.startsWith('0x') || recipientAddress.length !== 42) {
            return NextResponse.json({ success: false, error: 'Invalid recipient address. Please connect your wallet.' }, { status: 400 });
        }

        // Validate server config
        if (!SERVER_WALLET_PRIVATE_KEY || !THIRDWEB_SECRET_KEY) {
            console.error('[referral-payout] Missing SERVER_WALLET_PRIVATE_KEY or THIRDWEB_SECRET_KEY');
            return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
        }

        // ──────────────────────────────────────────────
        // 1. Query pending referral earnings from worker
        // ──────────────────────────────────────────────
        const statsResponse = await fetch(
            `${WORKER_URL}/referral/stats?userId=${encodeURIComponent(userId)}`,
            {
                headers: { 'Authorization': `Bearer ${API_KEY}` },
                cache: 'no-store',
            }
        );
        const statsData = await statsResponse.json() as { success: boolean; data?: { pendingEarnings?: number } };

        if (!statsData.success || !statsData.data) {
            return NextResponse.json({ success: false, error: 'Failed to fetch referral stats' }, { status: 500 });
        }

        const pendingAmount = statsData.data.pendingEarnings ?? 0;

        if (pendingAmount < MINIMUM_CLAIM) {
            return NextResponse.json({
                success: false,
                error: `Minimum claim is ${MINIMUM_CLAIM} $SCAN. You have ${pendingAmount} pending.`,
                pendingAmount,
            }, { status: 400 });
        }

        // ──────────────────────────────────────────────
        // 2. Transfer $SCAN from admin wallet → user wallet
        // ──────────────────────────────────────────────
        // Convert raw amount to token amount (18 decimals)
        // pendingAmount is in raw units (e.g. 10000 = 10,000 $SCAN)
        // Token has 18 decimals, so multiply by 10^18
        const tokenAmount = BigInt(pendingAmount) * BigInt('1000000000000000000');

        const account = privateKeyToAccount({
            client,
            privateKey: SERVER_WALLET_PRIVATE_KEY,
        });

        const scanContract = getContract({
            client,
            chain: base,
            address: SCAN_TOKEN_ADDRESS,
        });

        const transferTx = prepareContractCall({
            contract: scanContract,
            method: 'function transfer(address to, uint256 amount) returns (bool)',
            params: [recipientAddress, tokenAmount],
        });

        const result = await sendTransaction({
            transaction: transferTx,
            account,
        });

        const txHash = result.transactionHash;
        console.log(`[referral-payout] ✅ Sent ${pendingAmount} $SCAN to ${recipientAddress} | tx: ${txHash}`);

        // ──────────────────────────────────────────────
        // 3. Record claim in worker's D1 database
        // ──────────────────────────────────────────────
        try {
            const claimResponse = await fetch(`${WORKER_URL}/referral/claim`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, txHash }),
            });

            const claimData = await claimResponse.json() as { success: boolean; data?: { claimedAmount?: number } };

            if (!claimData.success) {
                // Payout went through but claim record failed — log but don't fail
                console.error('[referral-payout] Claim record failed after successful payout:', claimData);
            }
        } catch (recordErr: any) {
            console.error('[referral-payout] Failed to record claim in D1:', recordErr.message);
        }

        // ──────────────────────────────────────────────
        // 4. Record in payouts table too
        // ──────────────────────────────────────────────
        try {
            await fetch(`${WORKER_URL}/payout/record`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    txHash,
                    amount: pendingAmount,
                    type: 'referral_claim',
                    recipientAddress,
                }),
            });
        } catch (recordErr: any) {
            console.error('[referral-payout] Failed to record payout in D1:', recordErr.message);
        }

        return NextResponse.json({
            success: true,
            data: {
                txHash,
                claimedAmount: pendingAmount,
                recipientAddress,
            },
        });
    } catch (error: any) {
        console.error('POST /api/game/referral/payout error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Referral payout failed' },
            { status: 500 }
        );
    }
}
