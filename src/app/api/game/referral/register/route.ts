/**
 * POST /api/game/referral/register
 * Proxy to Worker - Register a referral relationship
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.GAME_WORKER_URL || 'https://puzzlegame.bitgrass-crypto.workers.dev';
const API_KEY = process.env.GAME_API_KEY || '';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { referrerId, referredId } = body;

        if (!referrerId || !referredId) {
            return NextResponse.json(
                { success: false, error: 'Missing referrerId or referredId' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `${WORKER_URL}/referral/register`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ referrerId, referredId }),
            }
        );

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('POST /api/game/referral/register error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
