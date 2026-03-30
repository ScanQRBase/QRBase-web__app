import { GAME_WORKER_URL, GAME_API_KEY } from '@/src/app/lib/config';
/**
 * GET /api/game/admin/referrals - Get all referrers for admin dashboard
 */

import { NextResponse } from 'next/server';

const WORKER_URL = GAME_WORKER_URL;
const API_KEY = GAME_API_KEY;

export async function GET() {
    try {
        const response = await fetch(`${WORKER_URL}/admin/referrals`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        const data = await response.json();

        return NextResponse.json(data, {
            status: response.status,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });
    } catch (error) {
        console.error('GET /api/game/admin/referrals error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch referrals' },
            { status: 500 }
        );
    }
}
