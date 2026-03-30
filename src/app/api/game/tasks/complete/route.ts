import { GAME_WORKER_URL, GAME_API_KEY } from '@/src/app/lib/config';
/**
 * POST /api/game/tasks/complete
 * Proxy to Worker - Complete a task and earn +1 attempt
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = GAME_WORKER_URL;
const API_KEY = GAME_API_KEY;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const { taskId, userId, walletAddress, miniappAdded } = body;

        if (!taskId || !userId) {
            return NextResponse.json(
                { success: false, error: 'Missing taskId or userId' },
                { status: 400 }
            );
        }

        const response = await fetch(`${WORKER_URL}/tasks/complete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ taskId, userId, walletAddress, miniappAdded }),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('POST /api/game/tasks/complete error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
