/**
 * SCAN Token Price API
 * Fetches the current SCAN token price from Moralis
 */

import { SCAN_TOKEN_ADDRESS } from '@/src/app/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MORALIS_API_KEY = process.env.MORALIS_API_KEY_BACK;

export async function GET() {
    try {
        if (!MORALIS_API_KEY) {
            console.error("MORALIS_API_KEY not set");
            return Response.json({
                success: false,
                error: "API key not configured"
            }, { status: 500 });
        }

        // Fetch SCAN token price from Moralis
        const url = `https://deep-index.moralis.io/api/v2.2/erc20/${SCAN_TOKEN_ADDRESS}/price?chain=base&include=percent_change`;

        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "X-API-Key": MORALIS_API_KEY,
            },
        });

        if (!response.ok) {
            console.error("Moralis API error:", response.status, await response.text());
            return Response.json({
                success: false,
                error: "Failed to fetch price"
            }, { status: 500 });
        }

        const data = await response.json();

        // Calculate USD value for 5K SCAN
        const pricePerToken = data.usdPrice || 0;
        const fiveKScanUsd = pricePerToken * 5000;

        return Response.json({
            success: true,
            data: {
                tokenAddress: SCAN_TOKEN_ADDRESS,
                pricePerToken: pricePerToken,
                fiveKScanUsd: fiveKScanUsd,
                fiveKScanUsdFormatted: `~$${fiveKScanUsd.toFixed(2)}`,
                percentChange24h: data["24hrPercentChange"] || null,
            }
        }, {
            headers: { "Cache-Control": "public, max-age=60" } // Cache for 1 minute
        });

    } catch (error) {
        console.error("SCAN price API error:", error);
        return Response.json({
            success: false,
            error: "Internal server error"
        }, { status: 500 });
    }
}
