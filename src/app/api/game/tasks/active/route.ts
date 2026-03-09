/**
 * GET /api/game/tasks/active
 * Proxy to Worker - Get active tasks for community
 * Supports ?platform=x|farcaster filter
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = process.env.GAME_WORKER_URL || 'https://puzzlegame.bitgrass-crypto.workers.dev';
const API_KEY = process.env.GAME_API_KEY || '';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const platform = searchParams.get('platform');
        const userId = searchParams.get('userId');

        const workerUrl = new URL(`${WORKER_URL}/tasks/active`);
        if (platform) workerUrl.searchParams.set('platform', platform);
        if (userId) workerUrl.searchParams.set('userId', userId);

        const response = await fetch(workerUrl.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json(data, {
            status: response.status,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache',
            },
        });
    } catch (error) {
        console.error('GET /api/game/tasks/active error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
