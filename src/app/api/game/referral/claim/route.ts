/**
 * POST /api/game/referral/claim
 * Proxy to Worker - Claim pending referral rewards
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.GAME_WORKER_URL || 'https://puzzlegame.bitgrass-crypto.workers.dev';
const API_KEY = process.env.GAME_API_KEY || '';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, txHash } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Missing userId' },
                { status: 400 }
            );
        }

        if (!txHash) {
            return NextResponse.json(
                { success: false, error: 'Missing txHash' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `${WORKER_URL}/referral/claim`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, txHash }),
            }
        );

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('POST /api/game/referral/claim error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
