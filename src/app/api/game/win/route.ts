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
const WIN_REWARD_AMOUNT = BigInt('10000000000000000000000'); // 10,000 $SCAN (18 decimals)

const client = THIRDWEB_SECRET_KEY ? createThirdwebClient({ secretKey: THIRDWEB_SECRET_KEY }) : null;

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
                moves: moves || null,
                timeMs: timeMs || null,
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
        let payoutResult = null;

        if (walletAddress && client && SERVER_WALLET_PRIVATE_KEY) {
            try {
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
                    params: [walletAddress, WIN_REWARD_AMOUNT],
                });

                const result = await sendTransaction({
                    transaction: transferTx,
                    account,
                });

                const txHash = result.transactionHash;
                console.log(`[win] ✅ Payout: 10,000 $SCAN → ${walletAddress} | tx: ${txHash}`);
                payoutResult = { txHash, amount: 10000, recipientAddress: walletAddress };

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
                        amount: 10000,
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
