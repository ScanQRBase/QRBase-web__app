/**
 * Partners API — Proxy to game-api worker to get all active partners
 * Returns partner data including qr_logo, qr_main_color, qr_stop_color
 */

export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.GAME_WORKER_URL;
const API_KEY = process.env.GAME_API_KEY;

export async function GET() {
    try {
        const res = await fetch(`${WORKER_URL}/partners`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` },
        });
        const data = await res.json();
        return Response.json(data);
    } catch (error) {
        console.error('[partners] Error:', error);
        return Response.json({ success: false, error: 'Failed to fetch partners' }, { status: 500 });
    }
}
