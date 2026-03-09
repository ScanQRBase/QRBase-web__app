/**
 * Game Leaderboard API Route
 * GET /api/game/leaderboard - Get top winners
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = process.env.GAME_WORKER_URL || "https://puzzlegame.bitgrass-crypto.workers.dev";
const API_KEY = process.env.GAME_API_KEY || "";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') || '20';
        const offset = searchParams.get('offset') || '0';
        const tab = searchParams.get('tab') || 'wins';
        const userId = searchParams.get('userId') || '';

        let workerUrl = `${WORKER_URL}/leaderboard?limit=${limit}&offset=${offset}&tab=${tab}`;
        if (userId) workerUrl += `&userId=${encodeURIComponent(userId)}`;

        const response = await fetch(workerUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
            },
            cache: 'no-store',
        });

        const data = await response.json();

        // Prevent browser caching - always fetch fresh data
        return NextResponse.json(data, {
            status: response.status,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (error) {
        console.error("Leaderboard API error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
