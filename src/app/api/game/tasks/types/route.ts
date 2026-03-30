import { GAME_WORKER_URL, GAME_API_KEY } from '@/src/app/lib/config';
/**
 * GET /api/game/tasks/types
 * Proxy to Worker - Get available task type configurations
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = GAME_WORKER_URL;
const API_KEY = GAME_API_KEY;

export async function GET() {
    try {
        const response = await fetch(`${WORKER_URL}/tasks/types`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('GET /api/game/tasks/types error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
