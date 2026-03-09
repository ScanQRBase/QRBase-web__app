/**
 * API Route: /api/game/loss
 * Records a game loss for the user
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, moves, timeMs, abandoned } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Missing userId' },
                { status: 400 }
            );
        }

        const workerUrl = process.env.GAME_WORKER_URL;
        const apiKey = process.env.GAME_API_KEY;

        if (!workerUrl || !apiKey) {
            console.error('Missing GAME_WORKER_URL or GAME_API_KEY');
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const response = await fetch(`${workerUrl}/user/loss`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ userId, moves, timeMs, abandoned }),
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Loss API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
