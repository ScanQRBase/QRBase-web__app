/**
 * Admin Purchases API Route
 * GET /api/game/admin/purchases - Get paginated attempt purchases
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = process.env.GAME_WORKER_URL || "https://puzzlegame.bitgrass-crypto.workers.dev";
const API_KEY = process.env.GAME_API_KEY || "";

export async function GET(request: NextRequest) {
    try {
        // Forward query parameters (page, limit)
        const searchParams = request.nextUrl.searchParams;
        const queryString = searchParams.toString();

        const url = `${WORKER_URL}/attempt/purchases${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
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
        console.error("Admin purchases API error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
