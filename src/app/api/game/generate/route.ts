/**
 * Generate QR/Image API Route
 * Idempotent: Returns existing image if unresolved, otherwise generates new.
 * Uses dynamic partner data from Cloudflare KV for QR styling.
 */

// Note: Using Node.js runtime for OpenNext/Cloudflare compatibility

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WORKER_URL = process.env.GAME_WORKER_URL;
const API_KEY = process.env.GAME_API_KEY;
const QRFY_API_URL = "https://api.qrfy.com/api/public/qrs/png";
const REDIRECT_URL = "https://www.qrbase.xyz";
// Default logo as fallback
const DEFAULT_LOGO_URL = "https://ik.imagekit.io/cafu/$SCAN/scan.png?updatedAt=1746620925756&ik-s=83f8422add9570195a66cd510d3f1c5e884a50d1";
// Folder ID for PUZZLE folder in QRFY (828227)
const QRFY_FOLDER_ID = process.env.QRFY_FOLDER_ID || "828227";

// Retry config for QRFY API
const QRFY_TIMEOUT_MS = 30000; // 30 second timeout per attempt
const QRFY_MAX_RETRIES = 3;
const QRFY_RETRY_DELAY_MS = 2000; // Base delay, doubles each retry

async function fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = QRFY_MAX_RETRIES,
    timeoutMs = QRFY_TIMEOUT_MS,
    baseDelay = QRFY_RETRY_DELAY_MS
): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // If it's a server error (5xx), retry
            if (response.status >= 500 && attempt < maxRetries) {
                console.warn(`QRFY API returned ${response.status} on attempt ${attempt}/${maxRetries}, retrying...`);
                await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
                continue;
            }

            return response;
        } catch (error: unknown) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (lastError.name === 'AbortError') {
                console.warn(`QRFY API timed out after ${timeoutMs}ms on attempt ${attempt}/${maxRetries}`);
            } else {
                console.warn(`QRFY API fetch error on attempt ${attempt}/${maxRetries}:`, lastError.message);
            }

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
            }
        }
    }

    throw lastError || new Error('QRFY API request failed after all retries');
}

// Partner interface matching the Cloudflare Worker
interface Partner {
    name: string;
    logo: string;
    ca: string;  // Contract address
    pair?: string;
    prize?: number;  // Prize amount in tokens
    scanMode?: boolean;
    qrStyles: {
        mainColor: string;
        stopColor: string;
    };
}

// Fetch a random partner from the worker
async function getRandomPartner(): Promise<Partner | null> {
    if (!WORKER_URL || !API_KEY) return null;

    try {
        const response = await fetch(`${WORKER_URL}/partner/random`, {
            headers: { "Authorization": `Bearer ${API_KEY}` },
        });
        const data = await response.json();

        if (data.success && data.data) {
            return data.data as Partner;
        }
        return null;
    } catch (error) {
        console.error("Error fetching random partner:", error);
        return null;
    }
}

// Build QR payload with partner styles
function buildQrPayload(qrUrl: string, partner: Partner | null) {
    // Use partner colors or fallback to defaults
    const mainColor = partner?.qrStyles?.mainColor || "#0052ff";
    const stopColor = partner?.qrStyles?.stopColor || "#b568ca";
    const logoUrl = partner?.logo || DEFAULT_LOGO_URL;

    return {
        type: "url-static",
        data: {
            url: qrUrl,
        },
        style: {
            shape: {
                backgroundColor: {
                    type: "linear",
                    rotation: 0,
                    colorStops: [
                        { offset: 0, color: "#ffffff" },
                        { offset: 1, color: "#ffffff" }
                    ]
                },
                color: {
                    type: "linear",
                    rotation: 0,
                    colorStops: [
                        { offset: 0, color: mainColor },
                        { offset: 1, color: stopColor }
                    ]
                },
                style: "dots"
            },
            corners: {
                dotColor: {
                    type: "linear",
                    rotation: 0,
                    colorStops: [
                        { offset: 0, color: mainColor },
                        { offset: 1, color: mainColor }
                    ]
                },
                squareColor: {
                    type: "linear",
                    rotation: 0,
                    colorStops: [
                        { offset: 0, color: mainColor },
                        { offset: 1, color: stopColor }
                    ]
                },
                squareStyle: "shape10",
                dotStyle: "square"
            },
            image: logoUrl,
            errorCorrectionLevel: "H",
            frame: {
                id: null,
                color: "#000000",
                text: "__default__",
                fontSize: 90,
                backgroundColor: null
            },
            logoPreset: null
        },
    };
}

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

        // First check if user already has a saved image
        const stateResponse = await fetch(`${WORKER_URL}/state?userId=${encodeURIComponent(userId)}`, {
            headers: { "Authorization": `Bearer ${API_KEY}` },
        });
        const stateData = await stateResponse.json();

        // If user has a saved image, return it (idempotent)
        if (stateData.success && stateData.data.currentImageUrl) {
            // Return existing image
            return Response.json({
                success: true,
                data: {
                    imageUrl: stateData.data.currentImageUrl,
                    isExisting: true,
                    message: "Returning existing image",
                },
            });
        }

        // Check if user has chances
        if (stateData.data?.totalChances <= 0) {
            return Response.json({ success: false, error: "No chances remaining" }, { status: 402 });
        }

        // Generate new QR via QRFY API
        const qrfyApiKey = process.env.QRFY_API_KEY;
        if (!qrfyApiKey) {
            console.error("QRFY_API_KEY not set in environment");
            return Response.json({ success: false, error: "QR service not configured" }, { status: 500 });
        }

        // Fetch a random partner for dynamic QR styling
        const partner = await getRandomPartner();
        console.log("Selected partner for QR:", partner?.name || "default (no partner found)");

        // Partner is required - cannot generate QR without it
        if (!partner) {
            console.error("No partner available for QR generation");
            return Response.json({ success: false, error: "No partners available" }, { status: 503 });
        }

        const timestamp = Date.now();
        const qrUrl = `${REDIRECT_URL}?uid=${encodeURIComponent(userId)}&t=${timestamp}`;

        // Build QR payload with partner styles
        const qrPayload = buildQrPayload(qrUrl, partner);

        console.log("Calling QRFY API with payload:", JSON.stringify(qrPayload));

        let qrResponse: Response;
        try {
            qrResponse = await fetchWithRetry(QRFY_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "API-KEY": qrfyApiKey,
                },
                body: JSON.stringify(qrPayload),
            });
        } catch (fetchError) {
            console.error("QRFY API failed after all retries:", fetchError);
            return Response.json({
                success: false,
                error: "QR service is temporarily unavailable. Please try again in a few moments.",
            }, { status: 503 });
        }

        // Handle rate limiting specifically
        if (qrResponse.status === 429) {
            const retryAfter = qrResponse.headers.get("Retry-After");
            console.error(`QRFY Rate limited! Wait for ${retryAfter || 'unknown'} seconds.`);
            return Response.json({
                success: false,
                error: "Service is temporarily busy. Please try again in a few seconds.",
                retryAfter: retryAfter
            }, { status: 429 });
        }

        if (!qrResponse.ok) {
            const errorText = await qrResponse.text();
            // Log full error but only return clean message to client
            console.error("QRFY API error:", qrResponse.status, errorText.substring(0, 200));
            return Response.json({
                success: false,
                error: qrResponse.status >= 500
                    ? "QR service is temporarily unavailable. Please try again in a few moments."
                    : `QR generation failed: ${qrResponse.status}`,
            }, { status: 502 });
        }

        const imageBuffer = await qrResponse.arrayBuffer();
        const base64Image = `data:image/png;base64,${Buffer.from(imageBuffer).toString("base64")}`;

        // Save to worker KV (include partner name for game records)
        const saveResponse = await fetch(`${WORKER_URL}/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                userId,
                imageUrl: base64Image,
                partnerName: partner.name,
            }),
        });

        const saveData = await saveResponse.json();

        if (!saveResponse.ok || !saveData.success) {
            return Response.json({ success: false, error: "Failed to save image" }, { status: 500 });
        }

        return Response.json({
            success: true,
            data: {
                imageUrl: base64Image,
                isExisting: false,
                message: "New image generated",
                partner: partner ? { name: partner.name, logo: partner.logo, ca: partner.ca, prize: partner.prize || 10000 } : null,
            },
        });

    } catch (error) {
        console.error("Generate error:", error);
        return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
