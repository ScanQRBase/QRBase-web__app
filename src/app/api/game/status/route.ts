/**
 * GET /api/game/status
 * Proxy to Worker - Get user game status
 * 
 * SECURITY: API key is kept server-side, never exposed to client
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Note: Using Node.js runtime for OpenNext/Cloudflare compatibility

// Server-side only env vars (NO NEXT_PUBLIC_ prefix)
const WORKER_URL = process.env.GAME_WORKER_URL || 'https://puzzlegame.bitgrass-crypto.workers.dev';
const API_KEY = process.env.GAME_API_KEY || '';

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Missing userId parameter' },
                { status: 400 }
            );
        }

        // Call worker with secret API key (server-side only)
        const response = await fetch(
            `${WORKER_URL}/user?userId=${encodeURIComponent(userId)}`,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
            }
        );

        const data = await response.json();

        return NextResponse.json(data, {
            status: response.status,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
            },
        });
    } catch (error) {
        console.error('GET /api/game/status error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
