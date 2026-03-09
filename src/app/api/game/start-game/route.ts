/**
 * Start Game API Route
 * Clears currentImageUrl when game starts (so new QR is generated on completion)
 */

// Note: Using Node.js runtime for OpenNext/Cloudflare compatibility

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = process.env.GAME_WORKER_URL;
const API_KEY = process.env.GAME_API_KEY;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return Response.json({ success: false, error: "userId is required" }, { status: 400 });
        }

        if (!WORKER_URL || !API_KEY) {
            return Response.json({ success: false, error: "Server configuration error" }, { status: 500 });
        }

        const response = await fetch(`${WORKER_URL}/start-game`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({ userId }),
        });

        const data = await response.json();

        if (!response.ok) {
            return Response.json(data, { status: response.status });
        }

        return Response.json(data);

    } catch (error) {
        console.error("Start game error:", error);
        return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
