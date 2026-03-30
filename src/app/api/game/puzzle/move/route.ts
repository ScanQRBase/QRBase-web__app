/**
 * POST /api/game/puzzle/move
 * Proxy to Worker - Agent puzzle move endpoint
 * 
 * Validates and executes a single tile move. When the puzzle is solved,
 * the worker auto-triggers the win flow. This route then handles the
 * $SCAN payout (same as win route).
 * 
 * SECURITY: API key is kept server-side, never exposed to client
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
import { GAME_WORKER_URL, GAME_API_KEY, SCAN_TOKEN_ADDRESS, TOKEN_DECIMALS, DEFAULT_PRIZE_AMOUNT } from '@/src/app/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = GAME_WORKER_URL;
const API_KEY = GAME_API_KEY;
const SERVER_WALLET_PRIVATE_KEY = process.env.SERVER_WALLET_PRIVATE_KEY || '';

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
        const { userId, tileIndex, walletAddress: clientWalletAddress } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Missing userId' },
                { status: 400 }
            );
        }

        if (tileIndex === undefined || tileIndex === null) {
            return NextResponse.json(
                { success: false, error: 'Missing tileIndex' },
                { status: 400 }
            );
        }

        // ──────────────────────────────────────────────
        // 1. Forward move to worker for validation
        // ──────────────────────────────────────────────
        const response = await fetch(`${WORKER_URL}/puzzle/move`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                tileIndex,
                walletAddress: clientWalletAddress || null,
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            return NextResponse.json(data, { status: response.status });
        }

        // ──────────────────────────────────────────────
        // 2. If solved, trigger $SCAN payout
        // ──────────────────────────────────────────────
        if (data.data?.solved) {
            const walletAddress = clientWalletAddress || data.data?.win?.walletAddress;
            // Use prize from worker response (from D1 partners table), fallback to config default
            const prizeAmount: number = data.data?.win?.prizeAmount ?? DEFAULT_PRIZE_AMOUNT;
            const WIN_REWARD_AMOUNT = BigInt(prizeAmount) * TOKEN_DECIMALS;
            let payoutResult = null;

            if (walletAddress && walletClient && serverAccount) {
                try {
                    const callData = encodeFunctionData({
                        abi: ERC20_TRANSFER_ABI,
                        functionName: 'transfer',
                        args: [walletAddress as Address, WIN_REWARD_AMOUNT],
                    });

                    const txHash = await walletClient.sendTransaction({
                        to: SCAN_TOKEN_ADDRESS,
                        data: callData,
                        chain: base,
                    });

                    console.log(`[puzzle/move] ✅ Payout: ${prizeAmount.toLocaleString()} $SCAN → ${walletAddress} | tx: ${txHash}`);
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
                            gameId: data.data?.win?.gameId,
                        }),
                    }).catch(err => console.error('[puzzle/move] Failed to record payout:', err));

                } catch (payoutErr: any) {
                    console.error('[puzzle/move] ⚠️ Payout failed (win still recorded):', payoutErr.message);
                    payoutResult = { error: payoutErr.message };
                }
            } else if (!walletAddress) {
                console.log(`[puzzle/move] No wallet address for ${userId}, skipping payout`);
            }

            // Return move data + payout info
            return NextResponse.json({
                ...data,
                data: {
                    ...data.data,
                    payout: payoutResult,
                },
            });
        }

        // Not solved — return move result as-is
        return NextResponse.json(data);
    } catch (error) {
        console.error('POST /api/game/puzzle/move error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

