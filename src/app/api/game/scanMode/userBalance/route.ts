/**
 * User's $SCAN token balance API
 * Fetches the user's balance directly from the Base chain via RPC (no Moralis indexer lag)
 * Uses non-Moralis public RPCs as primary to avoid cached eth_call results
 */

import { createPublicClient, http, fallback, formatUnits, type Address } from 'viem';
import { base } from 'viem/chains';
import { SCAN_TOKEN_ADDRESS } from '@/src/app/lib/config';

export const dynamic = 'force-dynamic';

// $SCAN token contract address on Base — from config

const ERC20_BALANCE_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
] as const;

export async function GET(request: Request) {
    const url = new URL(request.url);
    const address = url.searchParams.get('address');

    if (!address) {
        return Response.json({ success: false, error: 'Missing address' }, { status: 400 });
    }

    try {
        // Fresh client per request — non-Moralis public RPCs first to avoid stale eth_call caching
        const client = createPublicClient({
            chain: base,
            cacheTime: 0,
            transport: fallback([
                http('https://mainnet.base.org', { fetchOptions: { cache: 'no-store' } }),
                http('https://base.publicnode.com', { fetchOptions: { cache: 'no-store' } }),
                http(process.env.NEXT_PUBLIC_RPC_SITE1_URL, { fetchOptions: { cache: 'no-store' } }),
                http(process.env.NEXT_PUBLIC_RPC_SITE2_URL, { fetchOptions: { cache: 'no-store' } }),
            ]),
        });

        // Direct on-chain balanceOf — real-time, no indexer lag
        const rawBalance = await client.readContract({
            address: SCAN_TOKEN_ADDRESS,
            abi: ERC20_BALANCE_ABI,
            functionName: 'balanceOf',
            args: [address as Address],
            blockTag: 'latest',
        });

        const balance = parseFloat(formatUnits(rawBalance, 18));
        console.log('[user-scan-balance] RPC balance for', address, ':', balance);

        return Response.json(
            { success: true, balance },
            { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
        );
    } catch (error) {
        console.error('[user-scan-balance] RPC error:', error);
        return Response.json({ success: true, balance: 0 });
    }
}
