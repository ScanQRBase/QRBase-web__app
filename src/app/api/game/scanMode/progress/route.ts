/**
 * Scan Mode Progress API - Proxy to worker /scan-mode/progress/:partnerName
 */

export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.GAME_WORKER_URL;
const API_KEY = process.env.GAME_API_KEY;

const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
};

export async function GET(request: Request) {
    const url = new URL(request.url);
    const partnerName = url.searchParams.get('partnerName');
    if (!partnerName) {
        return Response.json({ success: false, error: 'Missing partnerName' }, { status: 400, headers: noCacheHeaders });
    }

    try {
        const userId = url.searchParams.get('userId');
        let workerUrl = `${WORKER_URL}/scan-mode/progress/${encodeURIComponent(partnerName)}`;
        if (userId) {
            workerUrl += `?userId=${encodeURIComponent(userId)}`;
        }
        const res = await fetch(workerUrl, {
            headers: { 'Authorization': `Bearer ${API_KEY}` },
        });
        if (!res.ok) {
            const text = await res.text();
            console.error(`[scan-mode/progress] Worker returned ${res.status}:`, text);
            return Response.json({ success: false, error: `Worker error: ${res.status}` }, { status: res.status, headers: noCacheHeaders });
        }
        const data = await res.json();
        return Response.json(data, { headers: noCacheHeaders });
    } catch (error: any) {
        console.error('[scan-mode/progress] Error:', error?.message || error);
        return Response.json({ success: false, error: 'Failed to fetch scan mode progress' }, { status: 500, headers: noCacheHeaders });
    }
}
