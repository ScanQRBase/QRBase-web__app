/**
 * Game Profile API Route
 * POST /api/game/profile - Update user profile (photo, name)
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = process.env.GAME_WORKER_URL || "https://puzzlegame.bitgrass-crypto.workers.dev";
const API_KEY = process.env.GAME_API_KEY || "";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, profilePhoto, displayName } = body;

        if (!userId) {
            return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
        }

        const response = await fetch(`${WORKER_URL}/user/profile`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({ userId, profilePhoto, displayName }),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Profile API error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
