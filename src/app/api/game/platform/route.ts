/**
 * Unified Platform Data Endpoint
 * Proxies to the Worker's single /platform endpoint.
 * Previously made 6 parallel Worker calls — now just 1.
 */

import { NextResponse } from 'next/server';

const WORKER_URL = process.env.GAME_WORKER_URL || 'https://puzzlegame.bitgrass-crypto.workers.dev';
const API_KEY = process.env.GAME_API_KEY;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(): Promise<NextResponse> {
    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (API_KEY) {
            headers['Authorization'] = `Bearer ${API_KEY}`;
            headers['X-API-Key'] = API_KEY;
        }

        const res = await fetch(`${WORKER_URL}/platform`, {
            headers,
            cache: 'no-store',
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            console.error('[/api/game/platform] Worker error:', data.error);
            return NextResponse.json(
                { success: false, error: data.error || 'Worker returned an error' },
                { status: res.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[/api/game/platform] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch platform data',
            },
            { status: 500 }
        );
    }
}
