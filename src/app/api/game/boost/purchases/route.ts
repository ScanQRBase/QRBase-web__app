/**
 * Boost Purchases API Route
 * GET /api/game/boost/purchases - Get all boost purchases with user & token details
 */

import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = process.env.GAME_WORKER_URL || "https://puzzlegame.bitgrass-crypto.workers.dev";
const API_KEY = process.env.GAME_API_KEY || "";

export async function GET() {
    try {
        const response = await fetch(`${WORKER_URL}/boost/purchases`, {
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
            },
            cache: "no-store",
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Boost purchases API error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
