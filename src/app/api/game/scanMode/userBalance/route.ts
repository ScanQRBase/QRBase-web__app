/**
 * User's $SCAN token balance API
 * Fetches the user's balance of the $SCAN token using Moralis
 */

export const dynamic = 'force-dynamic';

const MORALIS_API_KEY = process.env.MORALIS_API_KEY_BACK;
// $SCAN token contract address on Base
const SCAN_TOKEN_CA = '0x20429F731096e359910921994A267d32ef576720';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const address = url.searchParams.get('address');

    if (!address) {
        return Response.json({ success: false, error: 'Missing address' }, { status: 400 });
    }

    if (!MORALIS_API_KEY) {
        return Response.json({ success: false, error: 'Server config error' }, { status: 500 });
    }

    // Add address to moralis stream if configured
    const streamId = process.env.MORALIS_STREAM_ID;
    if (streamId) {
        try {
            await fetch(`https://api.moralis-streams.com/streams/evm/${streamId}/address`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'x-api-key': MORALIS_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({ address })
            });
            // We ignore the response. If it's already added, Moralis returns an error we can safely ignore
            // or we might successfully add it. Either way, we don't want to block the balance check.
        } catch (e) {
            console.error('[Moralis Stream] Failed to add address:', e);
        }
    }

    try {
        const moralisUrl = `https://deep-index.moralis.io/api/v2.2/wallets/${address}/tokens?chain=base&token_addresses[]=${SCAN_TOKEN_CA}`;
        const res = await fetch(moralisUrl, {
            headers: {
                'Accept': 'application/json',
                'X-API-Key': MORALIS_API_KEY,
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            return Response.json({ success: true, balance: 0 });
        }

        const data = await res.json() as any;
        const tokens = Array.isArray(data) ? data : (data.result ?? []);

        let balance = 0;
        if (tokens.length > 0) {
            balance = parseFloat(tokens[0].balance_formatted) || 0;
        }

        return Response.json(
            { success: true, balance },
            { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
        );
    } catch (error) {
        console.error('[user-scan-balance] Error:', error);
        return Response.json({ success: true, balance: 0 });
    }
}
