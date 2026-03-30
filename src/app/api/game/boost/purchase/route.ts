import { GAME_WORKER_URL, GAME_API_KEY } from '@/src/app/lib/config';
/**
 * POST /api/game/boost/purchase
 * Boost Purchase API Route with USDC on-chain verification
 * 
 * Flow: Frontend sends txHash (USDC transfer) → API verifies receipt → Worker processes boost
 * 
 * Uses shared verify-tx.ts utility for polling receipt + ERC-20 Transfer verification.
 */

import { NextRequest, NextResponse } from "next/server";
import { waitForReceipt, verifyERC20Transfer } from '@/src/app/lib/verify-tx';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = GAME_WORKER_URL;
const API_KEY = GAME_API_KEY;
const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913').toLowerCase();
const ADMIN_WALLET = (process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT_GAME_ADDRESS || '').toLowerCase();

// BOOST_PRICES removed — pricing is now fetched from D1 via /boost/tiers

// Helper: fetch the USD price for a given boost duration from the worker
async function getBoostPriceFromDB(durationHours: number): Promise<bigint | null> {
    try {
        const res = await fetch(`${WORKER_URL}/boost/tiers`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
            },
            cache: 'no-store',
        });
        const data = await res.json() as { success: boolean; data?: { duration_hours: number; price_usd: number }[] };
        if (!data.success || !data.data) return null;
        const tier = data.data.find(t => t.duration_hours === durationHours);
        if (!tier) return null;
        // Convert USD price to USDC wei (6 decimals)
        return BigInt(Math.round(tier.price_usd * 1_000_000));
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { txHash, durationHours } = body;

        console.log('[boost/purchase] Request body:', JSON.stringify({ txHash, durationHours, allKeys: Object.keys(body) }));
        console.log('[boost/purchase] USDC_ADDRESS:', USDC_ADDRESS);
        console.log('[boost/purchase] ADMIN_WALLET:', ADMIN_WALLET);

        // ──────────────────────────────────────────────
        // 1. Validate inputs
        // ──────────────────────────────────────────────
        if (!txHash || !txHash.startsWith('0x')) {
            console.error('[boost/purchase] FAIL: Missing or invalid txHash:', txHash);
            return NextResponse.json(
                { success: false, error: 'Missing or invalid transaction hash' },
                { status: 400 }
            );
        }

        // Fetch expected price from DB (single source of truth)
        const expectedAmount = await getBoostPriceFromDB(durationHours);
        if (!expectedAmount) {
            console.error('[boost/purchase] FAIL: Invalid durationHours or failed to fetch tier:', durationHours);
            return NextResponse.json(
                { success: false, error: `Invalid boost duration: ${durationHours}` },
                { status: 400 }
            );
        }

        // ──────────────────────────────────────────────
        // 2. Verify transaction receipt on Base
        //    Polls up to 10 times (20s) via shared utility
        // ──────────────────────────────────────────────
        let receipt;
        try {
            receipt = await waitForReceipt(txHash);
        } catch (err: any) {
            console.error('[boost/purchase] FAIL: Receipt not found:', err.message);
            return NextResponse.json(
                { success: false, error: err.message || 'Transaction not found on Base. It may still be pending.' },
                { status: 400 }
            );
        }

        console.log('[boost/purchase] Receipt status:', receipt.status, 'logs count:', receipt.logs.length);

        if (receipt.status !== 'success') {
            console.error('[boost/purchase] FAIL: Tx failed on chain');
            return NextResponse.json(
                { success: false, error: 'Transaction failed on chain' },
                { status: 400 }
            );
        }

        // ──────────────────────────────────────────────
        // 3. Validate USDC Transfer event via shared utility
        // ──────────────────────────────────────────────
        console.log('[boost/purchase] Checking logs for USDC transfer. Expected USDC addr:', USDC_ADDRESS, 'expected amount:', expectedAmount.toString());

        const transfer = verifyERC20Transfer(receipt, USDC_ADDRESS, ADMIN_WALLET, expectedAmount);

        if (!transfer) {
            console.error('[boost/purchase] FAIL: No valid USDC Transfer found in', receipt.logs.length, 'logs');
            return NextResponse.json(
                { success: false, error: 'Transaction does not contain a valid USDC transfer to the admin wallet with sufficient amount' },
                { status: 400 }
            );
        }

        console.log('[boost/purchase] Verified on-chain USDC transfer:', {
            from: transfer.from,
            value: transfer.value.toString(),
            expectedAmount: expectedAmount.toString(),
        });

        // ──────────────────────────────────────────────
        // 4. Forward verified boost to worker
        // ──────────────────────────────────────────────
        const response = await fetch(`${WORKER_URL}/boost/purchase`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({ ...body, txHash }),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Boost purchase API error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
