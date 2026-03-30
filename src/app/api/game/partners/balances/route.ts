/**
 * Partner Balances API Route
 * Fetches wallet balance for each partner to verify boost eligibility
 */

import { GAME_WORKER_URL, GAME_API_KEY, DEFAULT_PRIZE_AMOUNT } from '@/src/app/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = GAME_WORKER_URL;
const API_KEY = GAME_API_KEY;
const MORALIS_API_KEY = process.env.MORALIS_API_KEY_BACK;
const PRIZE_POOL_WALLET = process.env.PRIZE_POOL_WALLET;

interface Partner {
    name: string;
    logo: string;
    ca: string;
    prize?: number;
    scanMode?: boolean;
}

interface MoralisTokenBalance {
    token_address: string;
    balance: string;
    balance_formatted: string;
    decimals: number;
}

interface PartnerBalance {
    ca: string;
    name: string;
    logo: string;
    balance: number;
    prize: number;
    hasEnoughFunds: boolean;
}

// Fetch all partners from the worker
async function getAllPartners(): Promise<Partner[]> {
    if (!WORKER_URL || !API_KEY) return [];

    try {
        const response = await fetch(`${WORKER_URL}/partners`, {
            headers: { "Authorization": `Bearer ${API_KEY}` },
            cache: 'no-store',
        });
        const data = await response.json();
        if (data.success && data.data) {
            return data.data as Partner[];
        }
        return [];
    } catch (error) {
        console.error("Error fetching partners:", error);
        return [];
    }
}

// Fetch token balance from Moralis
async function getTokenBalance(tokenAddress: string): Promise<number> {
    if (!MORALIS_API_KEY || !PRIZE_POOL_WALLET) return 0;

    try {
        const url = `https://deep-index.moralis.io/api/v2.2/wallets/${PRIZE_POOL_WALLET}/tokens?chain=base&token_addresses[]=${tokenAddress}`;

        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "X-API-Key": MORALIS_API_KEY,
            },
            cache: 'no-store',
        });

        if (!response.ok) return 0;

        const data = await response.json();
        const tokens = Array.isArray(data) ? data : (data.result ?? []);

        if (tokens.length > 0) {
            const token = tokens[0] as MoralisTokenBalance;
            return parseFloat(token.balance_formatted) || 0;
        }
        return 0;
    } catch (error) {
        console.error("Error fetching balance for", tokenAddress, error);
        return 0;
    }
}

export async function GET() {
    try {
        const partners = await getAllPartners();

        if (partners.length === 0) {
            return Response.json({
                success: false,
                error: "No partners found",
            }, { status: 404 });
        }

        // Fetch balances in parallel
        const balancePromises = partners.map(async (partner): Promise<PartnerBalance> => {
            const balance = await getTokenBalance(partner.ca);
            const prize = partner.prize || DEFAULT_PRIZE_AMOUNT;

            return {
                ca: partner.ca,
                name: partner.name,
                logo: partner.logo,
                balance,
                prize,
                hasEnoughFunds: balance >= prize,
            };
        });

        const balances = await Promise.all(balancePromises);

        return Response.json({
            success: true,
            data: balances,
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });

    } catch (error) {
        console.error("Partner balances error:", error);
        return Response.json({
            success: false,
            error: "Failed to fetch balances",
        }, { status: 500 });
    }
}
