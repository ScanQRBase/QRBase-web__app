/**
 * POST /api/game/boost/purchase
 * Boost Purchase API Route with USDC on-chain verification
 * 
 * Flow: Frontend sends txHash (USDC transfer) → API verifies receipt → Worker processes boost
 */

import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, parseAbi, decodeEventLog } from 'viem';
import { base } from 'viem/chains';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = process.env.GAME_WORKER_URL || "https://puzzlegame.bitgrass-crypto.workers.dev";
const API_KEY = process.env.GAME_API_KEY || "";
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
        // ──────────────────────────────────────────────
        let receipt;
        try {
            receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
        } catch (err: any) {
            console.error('[boost/purchase] FAIL: Receipt not found:', err.message);
            return NextResponse.json(
                { success: false, error: 'Transaction not found on Base. It may still be pending.' },
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
        // 3. Validate USDC Transfer event
        // ──────────────────────────────────────────────
        // expectedAmount already fetched from DB above (step 1)
        let verified = false;

        console.log('[boost/purchase] Checking logs for USDC transfer. Expected USDC addr:', USDC_ADDRESS, 'expected amount:', expectedAmount.toString());

        for (const log of receipt.logs) {
            console.log('[boost/purchase] Log address:', log.address.toLowerCase(), 'matches USDC?', log.address.toLowerCase() === USDC_ADDRESS);
            if (log.address.toLowerCase() !== USDC_ADDRESS) continue;

            try {
                const decoded = decodeEventLog({
                    abi: erc20TransferAbi,
                    data: log.data,
                    topics: log.topics,
                });

                if (decoded.eventName === 'Transfer') {
                    const { to, value } = decoded.args;
                    console.log('[boost/purchase] Transfer event: to=', to.toLowerCase(), 'value=', value.toString(), 'admin=', ADMIN_WALLET);

                    if (to.toLowerCase() === ADMIN_WALLET && value >= expectedAmount) {
                        verified = true;
                        break;
                    }
                }
            } catch {
                continue;
            }
        }

        if (!verified) {
            console.error('[boost/purchase] FAIL: No valid USDC Transfer found in', receipt.logs.length, 'logs');
            return NextResponse.json(
                { success: false, error: 'Transaction does not contain a valid USDC transfer to the admin wallet with sufficient amount' },
                { status: 400 }
            );
        }

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
