import { NextRequest, NextResponse } from "next/server";
import { createFacilitatorConfig } from "@coinbase/x402";
import { useFacilitator } from "x402/verify";
import type { Address } from 'viem';

// --- Configuration Constants ---
const AMOUNT = "1000"; // 0.01 USDC
const NETWORK = "base" as const;
const USDC_ADDRESS =
  (process.env.NEXT_PUBLIC_USDC_ADDRESS as Address) ||
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const PAYMENT_RECIPIENT = process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT_ADDRESS as Address;
const CDP_API_KEY_ID = process.env.CDP_API_KEY_ID || "";
const CDP_API_KEY_SECRET = process.env.CDP_API_KEY_SECRET || "";


// NOTE: Ensure these environment variables are correctly loaded in your production environment (Railway/Vercel).

// Force dynamic execution for API calls (important for ensuring fresh checks)
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper to construct the x402 payment requirements object
const getPaymentRequirements = (url: string) => ({
  scheme: "exact" as const,
  network: NETWORK,
  maxAmountRequired: AMOUNT,
  resource: url,
  description: "Ping - 0.001 USDC on Base",
  payTo: PAYMENT_RECIPIENT,
  asset: USDC_ADDRESS,
  maxTimeoutSeconds: 60,
  mimeType: "",
  // --- Bazaar Discovery Metadata (Enhanced for AI Agents) ---
  discoverable: true, // Crucial for listing on the x402 Bazaar
  category: "API Access",
  tags: ["API", "Coinbase", "USDC", "CDP", "x402"],
  extra: { name: "USD Coin", version: "2" },
  outputSchema: {
    input: { type: "http", method: "GET" },
    output: {
      type: "object",
      properties: {
        x402Version: { type: "number" },
        success: { type: "boolean" },
        message: { type: "string" },
        paymentTransaction: { type: "string" },
        sender: { type: "string" },
      }
    },
  },
  type: "http",
  x402Version: 1,
  metadata: {},
});

/**
 * Main GET handler (x402 protocol implementation)
 */
export async function GET(request: NextRequest) {
  // Use a simple, minimal set of standard headers for the response.
  // The 'Access-Control-Allow-Origin: *' is critical for the client (x402scan).
  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Access-Control-Allow-Origin": "*",
  };

  const paymentRequirements = getPaymentRequirements(request.url);
  const paymentData = request.headers.get("x-payment");

  try {
    // 1. Check for configuration errors (Optional but helpful check)
    if (!CDP_API_KEY_ID || !CDP_API_KEY_SECRET || !PAYMENT_RECIPIENT) {
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500, headers }
      );
    }

    // 2. If no payment header → return challenge (402)
    if (!paymentData) {
      const accepts = [paymentRequirements];
      return NextResponse.json(
        {
          x402Version: 1,
          error: "X-PAYMENT header is required",
          accepts,
        },
        { status: 402, headers }
      );
    }

    // --- Payment Header Exists: Proceed to Verification & Settlement ---
    let parsedPaymentData: any;
    try {
      const decoded = Buffer.from(paymentData, "base64").toString("utf-8");
      parsedPaymentData = JSON.parse(decoded);
    } catch (err: any) {
      console.error("❌ Failed to decode or parse payment data:", err.message);
      return NextResponse.json(
        { error: "Invalid payment data format" },
        { status: 400, headers }
      );
    }

    // 3. Initialize facilitator and verify payment
    const facilitatorConfig = createFacilitatorConfig(CDP_API_KEY_ID, CDP_API_KEY_SECRET);
    const { verify, settle } = useFacilitator(facilitatorConfig);

    const verificationResult = await verify(parsedPaymentData, paymentRequirements);

    if (!verificationResult.isValid) {
      console.error("❌ Payment verification failed.");
      return NextResponse.json(
        {
          error: "Payment verification failed",
          reason: verificationResult.invalidReason || "Invalid payment",
        },
        { status: 402, headers }
      );
    }

    // 4. Attempt settlement
    const settlementResult = await settle(parsedPaymentData, paymentRequirements);

    // 5. Success: Return the paid resource (Status 200)
    const senderAddress = parsedPaymentData.payload?.authorization?.from || "unknown";

    const dataPayload = {
      x402Version: 1,
      success: true,
      message: `Payment successful! Access granted to resource.`,
      paymentTransaction: settlementResult.transaction || "pending",
      sender: senderAddress,
      data: { premium: true, content: "This is the content you paid for!" }
    };

    // The issue is likely here: ensure your final response is simple and serializable.
    const finalHeaders = {
      // This stops Cloudflare from modifying (compressing/decompressing) the stream.
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, no-transform",
      Pragma: "no-cache",
      Expires: "0",
      "Access-Control-Allow-Origin": "*",
      "Content-Encoding": "identity", // Tells the client there is no compression
      "X-Content-Encoding-Override": "none", // A safety measure for some proxies
      "Content-Type": "application/json",
    };
    return new NextResponse(
      JSON.stringify(dataPayload),
      {
        status: 200,
        headers: finalHeaders,
      }
    );

  } catch (error: any) {
    console.error("🔥 UNEXPECTED SERVER ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500, headers }
    );
  }
}

/**
 * CORS Preflight Handler (Crucial for client-side tools like x402scan)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-PAYMENT", // Ensure X-PAYMENT is allowed
    },
  });
}