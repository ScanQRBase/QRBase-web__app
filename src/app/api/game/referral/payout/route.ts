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
import {
    createWalletClient,
    http,
    fallback,
    encodeFunctionData,
    type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { BUILDER_DATA_SUFFIX } from '@/src/app/lib/builder-code';

import { GAME_WORKER_URL, GAME_API_KEY, SCAN_TOKEN_ADDRESS, TOKEN_DECIMALS } from '@/src/app/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = GAME_WORKER_URL;
const API_KEY = GAME_API_KEY;
// SCAN_TOKEN_ADDRESS is imported from config
const SERVER_WALLET_PRIVATE_KEY = process.env.SERVER_WALLET_PRIVATE_KEY || '';
const MINIMUM_CLAIM = 10000; // 10,000 raw units = 10 $SCAN

// Moralis RPC fallback transport (site1 primary, site2 backup)
const moralisTransport = fallback([
    http(process.env.NEXT_PUBLIC_RPC_SITE1_URL),
    http(process.env.NEXT_PUBLIC_RPC_SITE2_URL),
]);

const serverAccount = SERVER_WALLET_PRIVATE_KEY
    ? privateKeyToAccount(`0x${SERVER_WALLET_PRIVATE_KEY.replace(/^0x/, '')}` as `0x${string}`)
    : null;

const walletClient = serverAccount
    ? createWalletClient({ account: serverAccount, chain: base, transport: moralisTransport, dataSuffix: BUILDER_DATA_SUFFIX })
    : null;

const ERC20_TRANSFER_ABI = [{
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
}] as const;

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
        if (!serverAccount || !walletClient) {
            console.error('[referral-payout] Missing SERVER_WALLET_PRIVATE_KEY');
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
        const tokenAmount = BigInt(pendingAmount) * TOKEN_DECIMALS;

        const callData = encodeFunctionData({
            abi: ERC20_TRANSFER_ABI,
            functionName: 'transfer',
            args: [recipientAddress as Address, tokenAmount],
        });

        const txHash = await walletClient.sendTransaction({
            to: SCAN_TOKEN_ADDRESS,
            data: callData,
            chain: base,
        });

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

