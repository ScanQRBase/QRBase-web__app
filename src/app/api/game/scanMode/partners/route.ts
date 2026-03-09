/**
 * Scan Mode Partners API - Proxy to worker /scan-mode/partners
 */

export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.GAME_WORKER_URL;
const API_KEY = process.env.GAME_API_KEY;

export async function GET() {
    try {
        const res = await fetch(`${WORKER_URL}/scan-mode/partners`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` },
        });
        const data = await res.json();
        return Response.json(data);
    } catch (error) {
        console.error('[scan-mode/partners] Error:', error);
        return Response.json({ success: false, error: 'Failed to fetch scan mode partners' }, { status: 500 });
    }
}
