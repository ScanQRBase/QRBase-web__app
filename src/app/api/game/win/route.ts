/**
 * POST /api/game/win
 * Proxy to Worker - Record a win with moves and time tracking
 * 
 * After the worker confirms the win, this route triggers a $SCAN payout
 * to the user's connected wallet (if available).
 * 
 * SECURITY: API key is kept server-side, never exposed to client
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    createPublicClient,
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
const SERVER_WALLET_PRIVATE_KEY = process.env.SERVER_WALLET_PRIVATE_KEY || '';
const DECIMALS = TOKEN_DECIMALS;

// Moralis RPC fallback transport (site1 primary, site2 backup)
const moralisTransport = fallback([
    http(process.env.NEXT_PUBLIC_RPC_SITE1_URL),
    http(process.env.NEXT_PUBLIC_RPC_SITE2_URL),
]);

// viem wallet client for signing + broadcasting payout transactions
const serverAccount = SERVER_WALLET_PRIVATE_KEY
    ? privateKeyToAccount(`0x${SERVER_WALLET_PRIVATE_KEY.replace(/^0x/, '')}` as `0x${string}`)
    : null;

const walletClient = serverAccount
    ? createWalletClient({ account: serverAccount, chain: base, transport: moralisTransport, dataSuffix: BUILDER_DATA_SUFFIX })
    : null;

const publicClient = createPublicClient({ chain: base, transport: moralisTransport });

// ERC-20 transfer ABI
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
        const { userId, moves, timeMs, walletAddress: clientWalletAddress } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Missing userId' },
                { status: 400 }
            );
        }

        // ──────────────────────────────────────────────
        // 1. Call worker to confirm and record the win
        // ──────────────────────────────────────────────
        const response = await fetch(`${WORKER_URL}/user/win`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                moves: moves != null ? moves : null,
                timeMs: timeMs != null ? timeMs : null,
                walletAddress: clientWalletAddress || null,
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            return NextResponse.json(data, { status: response.status });
        }

        // ──────────────────────────────────────────────
        // 2. Trigger $SCAN payout if wallet is available
        // ──────────────────────────────────────────────
        // Prefer client-provided wallet (current connected wallet) over DB-stored wallet
        const walletAddress = clientWalletAddress || data.data?.walletAddress;
        const gameId = data.data?.gameId;
        // Use the prize amount from the worker (from D1 partners table)
        const prizeAmount: number = data.data?.prizeAmount ?? 2000;
        const WIN_REWARD_AMOUNT = BigInt(prizeAmount) * DECIMALS;
        let payoutResult = null;

        if (walletAddress && walletClient && serverAccount) {
            try {
                // Encode ERC-20 transfer(to, amount)
                const callData = encodeFunctionData({
                    abi: ERC20_TRANSFER_ABI,
                    functionName: 'transfer',
                    args: [walletAddress as Address, WIN_REWARD_AMOUNT],
                });

                // Send the transaction via Moralis RPC (with Builder Code attribution)
                const txHash = await walletClient.sendTransaction({
                    to: SCAN_TOKEN_ADDRESS,
                    data: callData,
                    chain: base,
                });

                // Wait for confirmation (non-blocking log, but we have the hash)
                console.log(`[win] ✅ Payout: ${prizeAmount.toLocaleString()} $SCAN → ${walletAddress} | tx: ${txHash}`);
                payoutResult = { txHash, amount: prizeAmount, recipientAddress: walletAddress };

                // Record payout in D1 (non-blocking)
                fetch(`${WORKER_URL}/payout/record`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId,
                        txHash,
                        amount: prizeAmount,
                        type: 'win',
                        recipientAddress: walletAddress,
                        gameId,
                    }),
                }).catch(err => console.error('[win] Failed to record payout:', err));

            } catch (payoutErr: any) {
                console.error('[win] ⚠️ Payout failed (win still recorded):', payoutErr.message);
                payoutResult = { error: payoutErr.message };
            }
        } else if (!walletAddress) {
            console.log(`[win] No wallet address for ${userId}, skipping payout`);
        }

        // Return win data + payout info
        return NextResponse.json({
            ...data,
            data: {
                ...data.data,
                payout: payoutResult,
            },
        });
    } catch (error) {
        console.error('POST /api/game/win error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
