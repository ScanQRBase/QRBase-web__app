import { NextRequest, NextResponse } from "next/server";
import { createFacilitatorConfig } from "@coinbase/x402";
import { useFacilitator } from "x402/verify";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// --- Configuration Constants ---
const PAYMENT_RECIPIENT = process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT_ADDRESS || "";
const USDC_ADDRESS =
  process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
const CDP_API_KEY_ID = process.env.CDP_API_KEY_ID || "";
const CDP_API_KEY_SECRET = process.env.CDP_API_KEY_SECRET || "";
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "";
const SERVER_WALLET_PRIVATE_KEY = process.env.SERVER_WALLET_PRIVATE_KEY || "";
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY || "";
const NFT_WALLET = process.env.NFT_WALLET || "";

// --- Amount to be charged ---
const AMOUNT = "100000"; // 0.1 USDC (USDC has 6 decimals)

/**
 * Main GET handler (x402 protocol)
 */
export async function GET(request: NextRequest) {
  const headers = new Headers({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
  });

  try {
    // Validate environment configuration
    if (
      !CDP_API_KEY_ID ||
      !CDP_API_KEY_SECRET ||
      !PAYMENT_RECIPIENT ||
      !SERVER_WALLET_PRIVATE_KEY ||
      !THIRDWEB_SECRET_KEY ||
      !NFT_CONTRACT_ADDRESS ||
      !NFT_WALLET
    ) {
      console.error("❌ Missing environment variables.");
      return NextResponse.json(
        {
          success: false,
          error:
            "Server configuration error: Missing CDP/Thirdweb/NFT credentials or addresses",
        },
        { status: 500, headers }
      );
    }

    // Check for payment header
    const paymentData =
      request.headers.get("x-payment") ||
      request.headers.get("X-Payment") ||
      request.headers.get("X-PAYMENT");

    console.log(
      `🔹 Payment request received. Amount: ${AMOUNT}, Header: ${paymentData ? "present" : "missing"}`
    );

    // If no payment header → return challenge (402)
    if (!paymentData) {
      const accepts = [
        {
          scheme: "exact" as const,
          network: "base" as const,
          maxAmountRequired: AMOUNT,
          resource: `${request.url}`,
          description: "Get CA $SCAN - 0.1 USDC",
          mimeType: "application/json",
          payTo: PAYMENT_RECIPIENT,
          maxTimeoutSeconds: 30,
          asset: USDC_ADDRESS,
          discoverable: true,
          category: "NFT Delivery",
          tags: ["NFT", "Coinbase", "USDC", "CDP"],
          inputSchema: {
            type: "object",
            properties: {
              to: { type: "string", description: "User wallet address" },
              amount: { type: "string", description: "Amount of USDC to pay" },
            },
          },
          outputSchema: {
            input: {
              type: "http",
              method: "GET"
            },
            output: {
              message: "string",
              swapTransactionHash: "string | null",
              sendTransactionHash: "string | null",
              tokensReceived: "string",
              usdcAmountPaid: "string"
            },
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              contractAdress: { type: "string" },
              paymentTransaction: { type: "string" },
              recipient: { type: "string" },
              timestamp: { type: "string" },
            },
          },
          extra: {
            recipientAddress: PAYMENT_RECIPIENT,
            name: "USD Coin",
            version: "2",
            primaryType: "TransferWithAuthorization",
            decimals: 6,
          },
        },
      ];

      return NextResponse.json(
        {
          x402Version: 1,
          error: "X-PAYMENT header is required",
          accepts,
        },
        { status: 402, headers }
      );
    }

    // --- Decode & parse payment data ---
    let parsedPaymentData: any;
    try {
      // First, log the raw payment data
      console.log("📨 Raw payment data (first 100 chars):", paymentData.substring(0, 100));

      // Try to decode from base64
      const decoded = Buffer.from(paymentData, "base64").toString("utf-8");
      console.log("📝 Decoded payment data (first 200 chars):", decoded.substring(0, 200));

      parsedPaymentData = JSON.parse(decoded);
      console.log("📦 Parsed payment data structure:", {
        keys: Object.keys(parsedPaymentData),
        hasPayload: !!parsedPaymentData.payload,
        hasSignature: !!parsedPaymentData.signature,
        hasAuthorization: !!parsedPaymentData.authorization,
        hasTransaction: !!parsedPaymentData.transaction,
        fullData: JSON.stringify(parsedPaymentData, null, 2)
      });
    } catch (err: any) {
      console.error("❌ Failed to parse payment data:", err.message);
      // Try parsing without base64 decode in case it's already JSON
      try {
        parsedPaymentData = JSON.parse(paymentData);
        console.log("📦 Parsed payment data (direct JSON):", JSON.stringify(parsedPaymentData, null, 2));
      } catch (err2: any) {
        console.error("❌ Invalid payment data format:", err2.message);
        return NextResponse.json(
          { error: "Invalid payment data format" },
          { status: 400, headers }
        );
      }
    }

    // Log the full structure for debugging
    console.log("🔍 Payment data type:", typeof parsedPaymentData);
    console.log("🔍 Payment data keys:", Object.keys(parsedPaymentData));

    // The payment data structure has the signature nested inside payload
    // Structure: { x402Version, scheme, network, payload: { signature, authorization } }
    const hasValidStructure =
      parsedPaymentData.payload &&
      parsedPaymentData.payload.signature &&
      parsedPaymentData.payload.authorization;

    if (!hasValidStructure) {
      console.error("❌ Unexpected payment data structure:", parsedPaymentData);
      return NextResponse.json(
        {
          error: "Invalid payment data structure",
          received: Object.keys(parsedPaymentData),
          expected: "Should contain 'payload' with nested 'signature' and 'authorization'"
        },
        { status: 400, headers }
      );
    }

    console.log("✅ Payment data structure validated successfully");

    // --- Prepare payment verification requirements ---
    const paymentRequirements = {
      scheme: "exact" as const,
      network: "base" as const,
      maxAmountRequired: AMOUNT,
      resource: request.url,
      description: "Get CA $SCAN - 0.1 USDC",
      mimeType: "application/json",
      payTo: PAYMENT_RECIPIENT,
      maxTimeoutSeconds: 120,
      asset: USDC_ADDRESS,
      discoverable: true,
      extra: {
        recipientAddress: PAYMENT_RECIPIENT,
        name: "USD Coin",
        version: "2",
        primaryType: "TransferWithAuthorization",
        decimals: 6,
      },
    };

    console.log("📋 Payment requirements:", JSON.stringify(paymentRequirements, null, 2));

    // --- Initialize facilitator ---
    let verify, settle;
    try {
      const facilitatorConfig = createFacilitatorConfig(CDP_API_KEY_ID, CDP_API_KEY_SECRET);
      const facilitator = useFacilitator(facilitatorConfig);
      verify = facilitator.verify;
      settle = facilitator.settle;
      console.log("✅ Facilitator initialized successfully");
    } catch (err: any) {
      console.error("❌ Failed to initialize facilitator:", err.message);
      return NextResponse.json(
        { error: "Failed to initialize payment facilitator", message: err.message },
        { status: 500, headers }
      );
    }

    // --- Verify payment ---
    let verificationResult;
    try {
      verificationResult = await verify(parsedPaymentData, paymentRequirements);
      console.log("🧾 Verification result:", JSON.stringify(verificationResult, null, 2));
    } catch (err: any) {
      console.error("❌ Verification error:", err.message);
      return NextResponse.json(
        { error: "Payment verification error", message: err.message },
        { status: 500, headers }
      );
    }

    if (!verificationResult.isValid) {
      console.error("❌ Payment verification failed:", verificationResult);
      return NextResponse.json(
        {
          error:
            verificationResult.invalidReason === "insufficient_funds"
              ? "Insufficient funds"
              : "Payment verification failed",
          reason: verificationResult.invalidReason || "Invalid payment",
        },
        { status: 402, headers }
      );
    }

    // --- Debug info before settlement ---
    console.log("🔍 About to settle with:", {
      paymentDataKeys: Object.keys(parsedPaymentData),
      requirementsKeys: Object.keys(paymentRequirements),
      network: paymentRequirements.network,
      asset: paymentRequirements.asset,
      amount: paymentRequirements.maxAmountRequired,
      payTo: paymentRequirements.payTo,
      hasPayload: !!parsedPaymentData.payload,
      hasSignature: !!parsedPaymentData.signature,
    });

    // --- Attempt settlement ---
    try {
      console.log("💰 Attempting settlement...");

      // Log what we're sending to settle
      console.log("📤 Settlement payload:", {
        paymentData: {
          x402Version: parsedPaymentData.x402Version,
          scheme: parsedPaymentData.scheme,
          network: parsedPaymentData.network,
          hasPayload: !!parsedPaymentData.payload,
          payloadKeys: parsedPaymentData.payload ? Object.keys(parsedPaymentData.payload) : [],
        },
        requirements: {
          scheme: paymentRequirements.scheme,
          network: paymentRequirements.network,
          amount: paymentRequirements.maxAmountRequired,
          payTo: paymentRequirements.payTo,
          asset: paymentRequirements.asset,
        }
      });

      const settlementResult = await settle(
        parsedPaymentData,
        paymentRequirements
      );
      console.log("✅ Settlement successful:", JSON.stringify(settlementResult, null, 2));
      const dataPayload = {
        x402Version: 1,
        success: true,
        message: "Payment successful!",
        timestamp: new Date().toISOString(),
        facilitator: "coinbase-cdp",
        paymentTransaction: settlementResult.transaction || "pending",
        contractAdress: "0x20429F731096e359910921994A267d32ef576720",
        sender: parsedPaymentData.payload?.authorization?.from || "unknown",
        amount: parsedPaymentData.payload?.authorization?.value || AMOUNT,
      }

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
      console.error("❌ Settlement failed:", error);
      console.error("❌ Error name:", error.name);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
      console.error("❌ Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

      // Try to extract more details from the error
      if (error.cause) {
        console.error("🧠 Error cause:", error.cause);
      }

      // Try to get response details if available
      if (error.response) {
        console.error("🧠 Response status:", error.response?.status);
        console.error("🧠 Response statusText:", error.response?.statusText);

        try {
          // Check if response has already been read
          if (error.response.bodyUsed) {
            console.error("🧠 Response body already consumed");
          } else {
            const responseText = await error.response.text();
            console.error("🧠 Coinbase API response body:", responseText);

            // Try to parse as JSON
            try {
              const responseJson = JSON.parse(responseText);
              console.error("🧠 Parsed error response:", JSON.stringify(responseJson, null, 2));
            } catch (parseErr) {
              console.error("🧠 Response is not JSON, raw text:", responseText);
            }
          }
        } catch (readErr: any) {
          console.error("🧠 Could not read response body:", readErr.message);
        }

        // Log response headers if available
        if (error.response.headers) {
          console.error("🧠 Response headers:");
          error.response.headers.forEach((value: string, key: string) => {
            console.error(`   ${key}: ${value}`);
          });
        }
      }

      // Check for specific error properties
      if (error.code) {
        console.error("🧠 Error code:", error.code);
      }
      if (error.errno) {
        console.error("🧠 Error errno:", error.errno);
      }
      if (error.syscall) {
        console.error("🧠 Error syscall:", error.syscall);
      }

      // Check if this is a CDP-specific error
      if (error.details) {
        console.error("🧠 CDP Error details:", error.details);
      }

      return NextResponse.json(
        {
          error: "Payment settlement failed",
          message: error.message || "Failed to settle payment",
          type: error.name || "Unknown",
          details: "Check server logs for full error details",
        },
        { status: 500, headers }
      );
    }
  } catch (error: any) {
    console.error("🔥 UNEXPECTED SERVER ERROR:", error);
    console.error("🔥 Error stack:", error.stack);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || "An unexpected error occurred",
      },
      { status: 500, headers }
    );
  }
}

/**
 * CORS Preflight Handler
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, X-PAYMENT, x-payment, X-Payer-Address, x-payer-address",
    },
  });
}