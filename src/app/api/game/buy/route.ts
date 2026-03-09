/**
 * POST /api/game/buy
 * Proxy to Worker - Buy paid chances
 * 
 * SECURITY: Verifies on-chain ERC-20 transfer before forwarding to worker.
 * Flow: Frontend sends txHash → API verifies receipt on Base → Worker adds chances.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi, decodeEventLog } from 'viem';
import { base } from 'viem/chains';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = process.env.GAME_WORKER_URL || 'https://puzzlegame.bitgrass-crypto.workers.dev';
const API_KEY = process.env.GAME_API_KEY || '';
const SCAN_TOKEN_ADDRESS = '0x20429F731096e359910921994A267d32ef576720';
const ADMIN_WALLET = (process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT_GAME_ADDRESS || '').toLowerCase();
const SCAN_PRICE_PER_ATTEMPT = BigInt('5000000000000000000000'); // 5000 * 10^18 (18 decimals)

// viem public client for Base mainnet
const publicClient = createPublicClient({
    chain: base,
    transport: http(),
});

// ERC-20 Transfer event ABI
const erc20TransferAbi = parseAbi([
    'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const { userId, amount, txHash } = body;

        console.log('[buy] Received:', { userId, amount, txHash: txHash ? `${txHash.substring(0, 10)}...` : 'MISSING' });

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Missing userId' },
                { status: 400 }
            );
        }

        if (!amount || amount < 1) {
            return NextResponse.json(
                { success: false, error: 'Invalid amount' },
                { status: 400 }
            );
        }

        if (!txHash || !txHash.startsWith('0x')) {
            console.error('[buy] txHash validation failed:', { txHash, type: typeof txHash, bodyKeys: Object.keys(body) });
            return NextResponse.json(
                { success: false, error: 'Missing or invalid transaction hash' },
                { status: 400 }
            );
        }

        // ──────────────────────────────────────────────
        // 1. Verify transaction receipt on Base mainnet
        //    Poll up to 10 times (20s) for the tx to be mined
        // ──────────────────────────────────────────────
        let receipt;
        const maxAttempts = 10;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
                console.log(`[buy] Receipt found on attempt ${attempt}`);
                break;
            } catch (err: any) {
                console.log(`[buy] Receipt not yet available (attempt ${attempt}/${maxAttempts})`);
                if (attempt === maxAttempts) {
                    console.error('[buy] Failed to get tx receipt after all attempts:', err.message);
                    return NextResponse.json(
                        { success: false, error: 'Transaction not found on Base after 20s. It may still be pending — please try again.' },
                        { status: 400 }
                    );
                }
                // Wait 2 seconds before retrying
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (!receipt || receipt.status !== 'success') {
            return NextResponse.json(
                { success: false, error: 'Transaction failed on chain' },
                { status: 400 }
            );
        }

        // ──────────────────────────────────────────────
        // 2. Find and validate ERC-20 Transfer event
        // ──────────────────────────────────────────────
        const expectedValue = SCAN_PRICE_PER_ATTEMPT * BigInt(amount);
        let verified = false;
        let buyerWalletAddress: string | null = null;

        for (const log of receipt.logs) {
            // Only look at logs from the $SCAN token contract
            if (log.address.toLowerCase() !== SCAN_TOKEN_ADDRESS.toLowerCase()) continue;

            try {
                const decoded = decodeEventLog({
                    abi: erc20TransferAbi,
                    data: log.data,
                    topics: log.topics,
                });

                if (decoded.eventName === 'Transfer') {
                    const { from, to, value } = decoded.args as { from: string, to: string, value: bigint };

                    // Verify recipient is admin wallet
                    if (to.toLowerCase() !== ADMIN_WALLET) {
                        continue;
                    }

                    // Verify amount is sufficient
                    if (value >= expectedValue) {
                        verified = true;
                        buyerWalletAddress = from;
                        break;
                    }
                }
            } catch {
                // Not a Transfer event from this log, skip
                continue;
            }
        }

        if (!verified) {
            return NextResponse.json(
                { success: false, error: 'Transaction does not contain a valid $SCAN transfer to the admin wallet with sufficient amount' },
                { status: 400 }
            );
        }

        // ──────────────────────────────────────────────
        // 3. Forward verified purchase to worker
        // ──────────────────────────────────────────────
        console.log('[buy] Forwarding to worker:', { userId, amount, txHash: txHash.substring(0, 10) + '...', walletAddress: buyerWalletAddress });
        const response = await fetch(`${WORKER_URL}/user/buy`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, amount, txHash, walletAddress: buyerWalletAddress }),
        });

        const data = await response.json();
        console.log('[buy] Worker response:', { status: response.status, success: data.success, error: data.error });
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('POST /api/game/buy error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
