/**
 * Prize Pool API Route
 * Fetches token balances from Moralis for all partners.
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = process.env.GAME_WORKER_URL;
const API_KEY = process.env.GAME_API_KEY;
const MORALIS_API_KEY = process.env.MORALIS_API_KEY_BACK;
// Wallet address holding the prize pool tokens
const PRIZE_POOL_WALLET = process.env.PRIZE_POOL_WALLET;

interface Partner {
    name: string;
    logo: string;
    ca: string;  // Contract address
    pair?: string;
    scanMode?: boolean;
    qrStyles: {
        mainColor: string;
        stopColor: string;
    };
}

interface MoralisTokenBalance {
    token_address: string;
    symbol: string;
    name: string;
    logo: string | null;
    thumbnail: string | null;
    decimals: number;
    balance: string;
    balance_formatted: string;
    usd_price: number | null;
    usd_value: number | null;
}

interface PrizeData {
    token: string;
    icon: string;
    remaining: number;
    usdValue: string;
    usdPrice: number;
    tokenAddress: string;
}

// Fetch all partners from the worker
async function getAllPartners(): Promise<Partner[]> {
    if (!WORKER_URL || !API_KEY) {
        console.error("WORKER_URL or API_KEY not set", { WORKER_URL: !!WORKER_URL, API_KEY: !!API_KEY });
        return [];
    }

    try {
        console.log("Fetching partners from:", `${WORKER_URL}/partners`);
        const response = await fetch(`${WORKER_URL}/partners`, {
            headers: { "Authorization": `Bearer ${API_KEY}` },
        });
        const data = await response.json();
        console.log("Partners response:", JSON.stringify(data));

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
async function getTokenBalance(tokenAddress: string): Promise<MoralisTokenBalance | null> {
    if (!MORALIS_API_KEY) {
        console.error("MORALIS_API_KEY not set");
        return null;
    }

    try {
        const url = `https://deep-index.moralis.io/api/v2.2/wallets/${PRIZE_POOL_WALLET}/tokens?chain=base&token_addresses[]=${tokenAddress}`;

        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "X-API-Key": MORALIS_API_KEY,
            },
        });

        if (!response.ok) {
            console.error("Moralis API error:", response.status, await response.text());
            return null;
        }

        const data = await response.json();

        // Handle both response formats: direct array or { result: [...] } wrapper
        const tokens = Array.isArray(data) ? data : (data.result ?? []);

        if (tokens.length > 0) {
            return tokens[0] as MoralisTokenBalance;
        }
        return null;
    } catch (error) {
        console.error("Error fetching token balance:", error);
        return null;
    }
}

// Fetch token price directly from Moralis (works even with 0 wallet balance)
async function getTokenPrice(tokenAddress: string): Promise<number> {
    if (!MORALIS_API_KEY) return 0;

    try {
        const url = `https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/price?chain=base`;
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "X-API-Key": MORALIS_API_KEY,
            },
        });

        if (!response.ok) return 0;

        const data = await response.json();
        return data.usdPrice ?? data.usd_price ?? 0;
    } catch {
        return 0;
    }
}

export async function GET(request: Request) {
    try {
        // Fetch all partners
        const partners = await getAllPartners();

        if (partners.length === 0) {
            // Return empty prizes if no partners configured
            return Response.json({
                success: true,
                data: {
                    prizes: [],
                    wallet: PRIZE_POOL_WALLET,
                    debug: "No partners found. Check worker /partners endpoint and ensure partners are stored with 0x... keys in KV_PUZZLE_PARTNER.",
                },
            }, {
                headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }
            });
        }

        // Fetch token balances and prices for each partner
        const prizePromises = partners.map(async (partner): Promise<PrizeData | null> => {
            const balance = await getTokenBalance(partner.ca);

            // Get price from balance data, or fall back to dedicated price endpoint
            let usdPrice = balance?.usd_price ?? 0;
            if (!usdPrice && partner.ca) {
                usdPrice = await getTokenPrice(partner.ca);
            }

            if (!balance) {
                return {
                    token: partner.name,
                    icon: partner.logo,
                    remaining: 0,
                    usdValue: "$0.00",
                    usdPrice,
                    tokenAddress: partner.ca,
                };
            }

            // Format balance
            const formattedBalance = balance.balance_formatted
                ? parseFloat(balance.balance_formatted)
                : Number(BigInt(balance.balance) / BigInt(10 ** (balance.decimals || 18)));

            // Use usd_value directly from Moralis response
            const usdValue = balance.usd_value ?? 0;

            return {
                token: `$${balance.symbol}`,
                icon: partner.logo || balance.logo || "",
                remaining: Math.floor(formattedBalance),
                usdValue: `$${usdValue.toFixed(2)}`,
                usdPrice,
                tokenAddress: partner.ca,
            };
        });

        const prizes = (await Promise.all(prizePromises)).filter((p): p is PrizeData => p !== null);

        // Sort prizes by remaining balance from highest to lowest
        prizes.sort((a, b) => b.remaining - a.remaining);

        return Response.json({
            success: true,
            data: {
                prizes,
                partners: partners.map(p => ({ name: p.name, logo: p.logo, ca: p.ca })),
                wallet: PRIZE_POOL_WALLET,
            },
        }, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }
        });

    } catch (error) {
        console.error("Prizes API error:", error);
        return Response.json({ success: false, error: "Internal server error" }, {
            status: 500,
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }
        });
    }
}
