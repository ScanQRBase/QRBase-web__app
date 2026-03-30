import { GAME_WORKER_URL, GAME_API_KEY } from '@/src/app/lib/config';
/**
 * GET /api/game/tasks/my
 * Proxy to Worker - Get promoter's task history
 * Requires ?userId=... query param
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = GAME_WORKER_URL;
const API_KEY = GAME_API_KEY;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Missing userId query parameter' },
                { status: 400 }
            );
        }

        const workerUrl = new URL(`${WORKER_URL}/tasks/my`);
        workerUrl.searchParams.set('userId', userId);

        const response = await fetch(workerUrl.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('GET /api/game/tasks/my error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
