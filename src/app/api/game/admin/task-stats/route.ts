import { GAME_WORKER_URL, GAME_API_KEY } from '@/src/app/lib/config';
/**
 * Admin Task Stats API Route
 * GET /api/game/admin/task-stats - Get task promotion statistics
 */

import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = GAME_WORKER_URL;
const API_KEY = GAME_API_KEY;

export async function GET() {
    try {
        const response = await fetch(`${WORKER_URL}/admin/task-stats`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
            },
            cache: 'no-store',
        });

        const data = await response.json();

        return NextResponse.json(data, {
            status: response.status,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            }
        });
    } catch (error) {
        console.error("Admin task stats API error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
