import { GAME_WORKER_URL, GAME_API_KEY } from '@/src/app/lib/config';
/**
 * POST /api/game/tasks/create
 * Proxy to Worker - Create a promoted task
 * 
 * SECURITY: Verifies on-chain USDC transfer before forwarding to worker.
 * Flow: Frontend sends txHash → API verifies USDC receipt on Base → Worker creates task.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, fallback, parseAbi, decodeEventLog } from 'viem';
import { base } from 'viem/chains';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = GAME_WORKER_URL;
const API_KEY = GAME_API_KEY;
const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913').toLowerCase();
const ADMIN_WALLET = (process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT_GAME_ADDRESS || '').toLowerCase();

// viem public client for Base mainnet
const publicClient = createPublicClient({
    chain: base,
    transport: fallback([
        http(process.env.NEXT_PUBLIC_RPC_SITE1_URL),
        http(process.env.NEXT_PUBLIC_RPC_SITE2_URL),
    ]),
});

// ERC-20 Transfer event ABI
const erc20TransferAbi = parseAbi([
    'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

// USDC has 6 decimals
const USDC_DECIMALS = 6;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const { userId, taskType, targetLink, txHash } = body;

        console.log('[tasks/create] Received:', { userId, taskType, targetLink, txHash: txHash ? `${txHash.substring(0, 10)}...` : 'MISSING' });

        if (!userId || !taskType || !targetLink) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: userId, taskType, targetLink' },
                { status: 400 }
            );
        }

        if (!txHash || !txHash.startsWith('0x')) {
            return NextResponse.json(
                { success: false, error: 'Missing or invalid transaction hash' },
                { status: 400 }
            );
        }

        // ──────────────────────────────────────────────
        // 1. Verify USDC transaction receipt on Base mainnet
        // ──────────────────────────────────────────────
        let receipt;
        const maxAttempts = 10;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
                console.log(`[tasks/create] Receipt found on attempt ${attempt}`);
                break;
            } catch (err: any) {
                console.log(`[tasks/create] Receipt not yet available (attempt ${attempt}/${maxAttempts})`);
                if (attempt === maxAttempts) {
                    return NextResponse.json(
                        { success: false, error: 'Transaction not found on Base after 20s. It may still be pending.' },
                        { status: 400 }
                    );
                }
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
        // 2. Find and validate USDC Transfer event
        // ──────────────────────────────────────────────
        let verified = false;
        let buyerWalletAddress: string | null = null;
        let usdcAmount = 0;

        for (const log of receipt.logs) {
            if (log.address.toLowerCase() !== USDC_ADDRESS) continue;

            try {
                const decoded = decodeEventLog({
                    abi: erc20TransferAbi,
                    data: log.data,
                    topics: log.topics,
                });

                if (decoded.eventName === 'Transfer') {
                    const { from, to, value } = decoded.args as { from: string; to: string; value: bigint };

                    // Verify recipient is admin wallet
                    if (to.toLowerCase() !== ADMIN_WALLET) continue;

                    // Any USDC amount is valid (task type determines the price)
                    usdcAmount = Number(value) / (10 ** USDC_DECIMALS);
                    if (usdcAmount > 0) {
                        verified = true;
                        buyerWalletAddress = from;
                        break;
                    }
                }
            } catch {
                continue;
            }
        }

        if (!verified) {
            return NextResponse.json(
                { success: false, error: 'Transaction does not contain a valid USDC transfer to the admin wallet' },
                { status: 400 }
            );
        }

        // ──────────────────────────────────────────────
        // 3. Forward verified task creation to worker
        // ──────────────────────────────────────────────
        console.log('[tasks/create] Forwarding to worker:', { userId, taskType, targetLink, txHash: txHash.substring(0, 10) + '...', usdcAmount });
        const response = await fetch(`${WORKER_URL}/tasks/create`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                taskType,
                targetLink,
                txHash,
                walletAddress: buyerWalletAddress,
            }),
        });

        const data = await response.json();
        console.log('[tasks/create] Worker response:', { status: response.status, success: data.success });
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('POST /api/game/tasks/create error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
