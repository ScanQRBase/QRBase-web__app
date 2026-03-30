import { GAME_WORKER_URL, GAME_API_KEY } from '@/src/app/lib/config';
/**
 * POST /api/game/play
 * Proxy to Worker - Consume 1 chance
 * 
 * SECURITY: API key is kept server-side, never exposed to client
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Note: Using Node.js runtime for OpenNext/Cloudflare compatibility

const WORKER_URL = GAME_WORKER_URL;
const API_KEY = GAME_API_KEY;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const userId = body.userId;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Missing userId' },
                { status: 400 }
            );
        }

        // Call worker with secret API key
        const response = await fetch(`${WORKER_URL}/user/play`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('POST /api/game/play error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
