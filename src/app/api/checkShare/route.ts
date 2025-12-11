import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const apiKey = request.headers.get("api-key");
    const apiKeyCloud = process.env.NEXT_PUBLIC_API_KEY as string;
    const workerBaseUrl = process.env.API_WORKER_SHARE_URL as string;


    if (!apiKey || apiKey !== apiKeyCloud) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const contentType = request.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            return NextResponse.json(
                { message: "Content-Type must be application/json" },
                { status: 400 }
            );
        }

        // ---- Parse incoming body ----
        const body = await request.json();
        const { action, address } = body;

        if (!address) {
            return NextResponse.json(
                { message: "Address parameter is required" },
                { status: 400 }
            );
        }

        if (!action || !["check", "share"].includes(action)) {
            return NextResponse.json(
                { message: "Action must be 'check' or 'share'" },
                { status: 400 }
            );
        }

        // ---- Build Worker URL ----
        const workerUrl =
            action === "check"
                ? `${workerBaseUrl}/check/${address}`
                : `${workerBaseUrl}/share/${address}`;


        // ---- Fetch from Worker ----
        const workerResponse = await fetch(workerUrl, {
            method: action === "share" ? "POST" : "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!workerResponse.ok) {
            const errorText = await workerResponse.text();
            console.error("Worker error:", workerResponse.status, errorText);
            return NextResponse.json(
                { message: `Worker error: ${workerResponse.status}` },
                { status: 500 }
            );
        }

        const data = await workerResponse.json();

        return new NextResponse(JSON.stringify(data), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// ---- OPTIONS (CORS) ----
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, api-key",
        },
    });
}
