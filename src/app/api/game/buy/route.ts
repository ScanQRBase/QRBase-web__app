/**
 * POST /api/game/buy
 * Proxy to Worker - Buy paid chances
 * 
 * SECURITY: Verifies on-chain ERC-20 transfer before forwarding to worker.
 * Flow: Frontend sends txHash → API verifies receipt on Base → Worker adds chances.
 * 
 * Defense-in-depth: The amount forwarded to the worker is derived from the
 * on-chain Transfer value, NOT from the frontend request body.
 */

import { NextRequest, NextResponse } from 'next/server';
import { waitForReceipt, verifyERC20Transfer } from '@/src/app/lib/verify-tx';
import { GAME_WORKER_URL, GAME_API_KEY, SCAN_TOKEN_ADDRESS, TOKEN_DECIMALS } from '@/src/app/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = GAME_WORKER_URL;
const API_KEY = GAME_API_KEY;
const ADMIN_WALLET = (process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT_GAME_ADDRESS || '').toLowerCase();

// Valid attempt prices per level (in raw token units with 18 decimals)
// Level 1: 1,000 $SCAN, Level 2: 2,000, Level 3: 3,000, Level 4: 4,000, Level 5-10: 5,000
const VALID_ATTEMPT_PRICES = [1000, 2000, 3000, 4000, 5000];
const SCAN_DECIMALS = TOKEN_DECIMALS;

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
        //    Polls up to 10 times (20s) via shared utility
        // ──────────────────────────────────────────────
        let receipt;
        try {
            receipt = await waitForReceipt(txHash);
        } catch (err: any) {
            return NextResponse.json(
                { success: false, error: err.message || 'Transaction not found on Base after 20s.' },
                { status: 400 }
            );
        }

        if (receipt.status !== 'success') {
            return NextResponse.json(
                { success: false, error: 'Transaction failed on chain' },
                { status: 400 }
            );
        }

        // ──────────────────────────────────────────────
        // 2. Verify ERC-20 Transfer event via shared utility
        //    Use the minimum valid price (1000 $SCAN) × quantity as the minimum expected value.
        //    The actual price depends on user level and is verified server-side by the worker.
        // ──────────────────────────────────────────────
        const minPricePerAttempt = BigInt(VALID_ATTEMPT_PRICES[0]) * SCAN_DECIMALS;
        const expectedMinValue = minPricePerAttempt * BigInt(amount);
        const transfer = verifyERC20Transfer(receipt, SCAN_TOKEN_ADDRESS, ADMIN_WALLET, expectedMinValue);

        if (!transfer) {
            return NextResponse.json(
                { success: false, error: 'Transaction does not contain a valid $SCAN transfer to the admin wallet with sufficient amount' },
                { status: 400 }
            );
        }

        // ──────────────────────────────────────────────
        // 3. Derive verified amount from on-chain value
        //    Try each valid price tier to find the best match for the transfer value.
        //    (defense-in-depth: don't trust frontend amount)
        // ──────────────────────────────────────────────
        const transferredTokens = transfer.value / SCAN_DECIMALS;
        let verifiedAmount = 0;
        // Find the valid price that matches: transferValue / price = requested amount
        for (const price of [...VALID_ATTEMPT_PRICES].reverse()) {
            const derived = Number(transferredTokens / BigInt(price));
            if (derived >= amount && transferredTokens === BigInt(price) * BigInt(derived)) {
                verifiedAmount = derived;
                break;
            }
        }
        // Fallback: at minimum, use the lowest price tier
        if (verifiedAmount === 0) {
            verifiedAmount = Number(transferredTokens / BigInt(VALID_ATTEMPT_PRICES[0]));
        }
        const buyerWalletAddress = transfer.from;

        console.log('[buy] On-chain verified:', {
            requestedAmount: amount,
            verifiedAmount,
            transferredTokens: Number(transferredTokens),
            match: amount === verifiedAmount,
            wallet: buyerWalletAddress,
        });

        // ──────────────────────────────────────────────
        // 4. Forward verified purchase to worker
        // ──────────────────────────────────────────────
        console.log('[buy] Forwarding to worker:', { userId, amount: verifiedAmount, txHash: txHash.substring(0, 10) + '...', walletAddress: buyerWalletAddress });
        const response = await fetch(`${WORKER_URL}/user/buy`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, amount: verifiedAmount, txHash, walletAddress: buyerWalletAddress }),
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
