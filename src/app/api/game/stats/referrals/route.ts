import { NextResponse } from 'next/server';
import { GAME_WORKER_URL, GAME_API_KEY } from '@/src/app/lib/config';

const WORKER_URL = GAME_WORKER_URL;

export async function GET() {
    try {
        const response = await fetch(`${WORKER_URL}/stats/referrals`, {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: 'Failed to fetch referrals from worker' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error proxying referrals request:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
