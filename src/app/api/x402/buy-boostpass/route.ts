import { NextRequest, NextResponse } from "next/server";
import { createFacilitatorConfig } from "@coinbase/x402";
import { useFacilitator } from "x402/verify";
import { privateKeyToAccount } from "thirdweb/wallets";
import { createThirdwebClient, getContract, sendTransaction, prepareContractCall } from "thirdweb";
import { base } from "thirdweb/chains";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// --- Configuration Constants (No Change) ---
const PAYMENT_RECIPIENT = process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT_ADDRESS;
const USDC_ADDRESS =
  process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const CDP_API_KEY_ID = process.env.CDP_API_KEY_ID || "";
const CDP_API_KEY_SECRET = process.env.CDP_API_KEY_SECRET || "";
const MORALIS_API_KEY = process.env.MORALIS_API_KEY_BACK || "";
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "";
const NFT_COLLECTION_NAME = process.env.NFT_COLLECTION_NAME || "BoostPass by QRBase";
const SERVER_WALLET_PRIVATE_KEY = process.env.SERVER_WALLET_PRIVATE_KEY || "";
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY || "";
const NFT_WALLET = process.env.NFT_WALLET || "";

const client = createThirdwebClient({
  secretKey: THIRDWEB_SECRET_KEY
});

// --- Enhanced Helper Functions ---

/**
 * Get available NFTs from Moralis API
 * 🔥 FIX: Added a try/catch block and enhanced error logging for Moralis API calls.
 */
async function getAvailableNFTs(): Promise<any[]> {
  if (!MORALIS_API_KEY || !NFT_CONTRACT_ADDRESS || !NFT_WALLET) {
    console.error("❌ Moralis/NFT config missing.");
    return []; // Return empty array to gracefully fail
  }

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'X-API-Key': MORALIS_API_KEY
    },
  };

  try {
    const url = `https://deep-index.moralis.io/api/v2.2/${NFT_WALLET}/nft?chain=base&format=decimal&token_addresses%5B0%5D=${NFT_CONTRACT_ADDRESS}`;
    const response = await fetch(url, options);

    if (!response.ok) {
      // Log the full response status and text for better debugging
      const errorText = await response.text();
      console.error(`❌ Moralis API error (Status: ${response.status}): ${errorText}`);
      // Throw a specific error for the main handler to catch
      throw new Error(`Moralis API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`🔍 Moralis API returned ${data.result?.length || 0} NFTs.`);

    // Filter by collection name and owner for robustness
    const nftsFromCollection = data.result?.filter(
      (nft: any) =>
        nft.name === NFT_COLLECTION_NAME &&
        nft.owner_of.toLowerCase() === NFT_WALLET.toLowerCase()
    ) || [];

    console.log(`Available NFTs in collection: ${nftsFromCollection}`);
    return nftsFromCollection;

  } catch (e: any) {
    // Catch fetch/JSON parsing errors
    console.error("❌ Error in getAvailableNFTs:", e.message);
    throw new Error(`NFT availability check failed: ${e.message}`);
  }
}

/**
 * Transfer NFT with retry logic for concurrent transfers
 * 🔥 FIX: Added checks for essential keys before attempting blockchain ops.
 */
async function transferNFTWithRetry(
  recipientAddress: string,
  maxRetries: number = 3
): Promise<{ success: boolean; tokenId?: string; transactionHash?: string; error?: string }> {

  if (!SERVER_WALLET_PRIVATE_KEY || !NFT_CONTRACT_ADDRESS) {
    return {
      success: false,
      error: 'Server/NFT configuration missing for transfer'
    };
  }

  const account = privateKeyToAccount({
    client,
    privateKey: SERVER_WALLET_PRIVATE_KEY,
  });

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Transfer attempt ${attempt + 1}/${maxRetries}`);

      const availableNFTs = await getAvailableNFTs();

      if (availableNFTs.length === 0) {
        return {
          success: false,
          error: 'No NFTs available to transfer in the vault wallet'
        };
      }

      // Select the NFT to transfer
      const randomIndex = Math.floor(Math.random() * availableNFTs.length);
      const selectedNFT = availableNFTs[randomIndex];
      const tokenId = selectedNFT.token_id;

      console.log(`Selected NFT token ID: ${tokenId} for transfer to ${recipientAddress}`);

      const contract = getContract({
        client,
        chain: base,
        address: NFT_CONTRACT_ADDRESS,
      });

      const transaction = prepareContractCall({
        contract,
        method: "function transferFrom(address from, address to, uint256 tokenId)",
        // 🔥 FIX: Ensure recipientAddress is passed correctly
        params: [account.address, recipientAddress, BigInt(tokenId)],
      });

      const { transactionHash } = await sendTransaction({
        transaction,
        account,
      });

      console.log(`✅ NFT transferred successfully. Token ID: ${tokenId}, TX: ${transactionHash}`);

      return {
        success: true,
        tokenId: tokenId,
        transactionHash: transactionHash
      };

    } catch (error: any) {
      console.error(`❌ Transfer attempt ${attempt + 1} failed`, error.message);

      // 🔥 Enhancement: Check for known blockchain/Thirdweb errors for faster failure
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('nonce') || errorMessage.includes('gas') || errorMessage.includes('insufficient funds')) {
        console.error('⚠️ Critical blockchain error, stopping retries.');
        return {
          success: false,
          error: `Critical blockchain error: ${error.message}`
        }
      }

      if (attempt === maxRetries - 1) {
        return {
          success: false,
          error: `Failed after ${maxRetries} attempts: ${error.message}`
        };
      }

      // Exponential backoff
      const delay = 1000 * (attempt + 1);
      console.log(`Retrying NFT transfer in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: 'Transfer failed after all retry attempts'
  };
}

/**
 * Settle payment with retry logic for timeout issues
 * 🔥 Enhancement: Increased the settlement timeout to 30s for better resilience.
 * 🔥 FIX: Ensured the original error object is thrown/returned for non-timeout failures.
 */
async function settlePaymentWithRetry(
  settle: any,
  parsedPaymentData: any,
  paymentRequirements: any,
  maxRetries: number = 2
): Promise<any> {
  let lastError: any = null;
  const SETTLEMENT_TIMEOUT = 30000; // Increased to 30 seconds

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Settlement attempt ${attempt + 1}/${maxRetries}`);

      // Use the increased timeout
      const settlementResult = await Promise.race([
        settle(parsedPaymentData, paymentRequirements),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Settlement timeout after 30s')), SETTLEMENT_TIMEOUT)
        )
      ]);

      if (settlementResult.success) {
        console.log(`✅ Settlement successful on attempt ${attempt + 1}`);
        return settlementResult;
      }

      console.warn(`⚠️ Settlement attempt ${attempt + 1} returned unsuccessful:`, settlementResult);
      lastError = settlementResult;

      // Check for expired authorization - don't retry
      if (settlementResult.errorReason?.includes('valid_before') ||
        settlementResult.errorReason?.includes('expired') ||
        settlementResult.errorReason?.includes('authorization')) {
        console.error('❌ Payment authorization expired or invalid');
        // Throw a specific error object that can be caught and handled with a 402
        throw new Error('PAYMENT_EXPIRED: Payment authorization has expired. Please initiate a new payment.');
      }

      if (attempt < maxRetries - 1) {
        const delay = 1500;
        console.log(`Retrying settlement in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // If unsuccessful on the last attempt, rethrow the result for the main handler to handle as a 500
        throw new Error(`Settlement failed: ${settlementResult.errorReason || 'Unknown failure'}`);
      }

    } catch (error: any) {
      console.error(`❌ Settlement attempt ${attempt + 1} failed:`, error.message);

      // If it's an expired payment error, throw immediately
      if (error.message.includes('PAYMENT_EXPIRED')) {
        throw error;
      }

      lastError = error;

      if (attempt === maxRetries - 1) {
        throw error; // Throw the last error to be caught by the main POST function
      }

      const delay = 1500;
      console.log(`Retrying settlement in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This line should ideally not be reached, but is a fallback
  throw lastError || new Error('Settlement failed after all retry attempts');
}


// --- Main API Handler (Enhanced Error Handling) ---

export async function GET(request: NextRequest) {
  try {

    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    headers.set('Surrogate-Control', 'no-store');
    // Get all variants of the header for robust parsing
    const paymentData =
      request.headers.get("x-payment") ||
      request.headers.get("X-Payment") ||
      request.headers.get("X-PAYMENT");
    const amount = '69000000'
    let to = ''
    // const { to = "69000000" } = body;

    // 🔥 FIX: Added checks for all critical environment variables
    if (!CDP_API_KEY_ID || !CDP_API_KEY_SECRET || !PAYMENT_RECIPIENT || !SERVER_WALLET_PRIVATE_KEY || !THIRDWEB_SECRET_KEY || !NFT_CONTRACT_ADDRESS || !NFT_WALLET) {
      console.error("❌ Critical server configuration missing: One or more environment variables are unset.");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: Missing CDP/Thirdweb/NFT credentials or addresses",
        },
        { status: 500, headers }
      );
    }

    // console.log(`🔹 Payment request received. Recipient: ${to}, Amount: ${amount}. Payment header: ${paymentData ? "present" : "missing"}`);

    const cdpFacilitator = createFacilitatorConfig(
      CDP_API_KEY_ID,
      CDP_API_KEY_SECRET
    );
    const { verify, settle } = useFacilitator(cdpFacilitator);

    // ---------------------------
    // 1️⃣ Return payment challenge
    // ---------------------------
    if (!paymentData) {
      const accepts = [
        {
          scheme: "exact" as const,
          network: "base" as const,
          maxAmountRequired: amount,
          resource: request.url,
          description: "Purchase boostpass NFT - 69 USDC",
          mimeType: "application/json",
          payTo: PAYMENT_RECIPIENT,
          maxTimeoutSeconds: 30, // Max recommended timeout for CDP
          asset: USDC_ADDRESS,
          discoverable: true,
          category: "NFT Delivery",
          tags: ["NFT", "Coinbase", "USDC", "CDP"],
          // Optional input/output schemas for x402scan indexing
          inputSchema: {
            type: "object",
            properties: {
              to: { type: "string", description: "User wallet address" },
              amount: { type: "string", description: "Amount of USDC to pay" },
            },
            required: ["to"],
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
              paymentTransaction: { type: "string" },
              facilitator: { type: "string" },
              nftTokenId: { type: "string" },
              nftTransactionHash: { type: "string" },
              nftRecipient: { type: "string" },

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

    // ---------------------------
    // 2️⃣ Parse and verify payment
    // ---------------------------
    let parsedPaymentData;
    try {
      const decoded = Buffer.from(paymentData, "base64").toString("utf-8");
      parsedPaymentData = JSON.parse(decoded);
      // console.log("✅ Parsed payment data successfully" , parsedPaymentData);
      to = parsedPaymentData.payload.authorization.from
    } catch (err: any) {
      console.error("❌ Failed to parse payment data:", err.message);
      return NextResponse.json(
        { error: "Invalid payment data format" },
        { status: 400, headers }
      );
    }

    const paymentRequirements = {
      scheme: "exact" as const,
      network: "base" as const,
      maxAmountRequired: amount,
      resource: request.url,
      description: "Purchase boostpass NFT - 69 USDC",
      mimeType: "application/json",
      payTo: PAYMENT_RECIPIENT,
      maxTimeoutSeconds: 30,
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

    // console.log("🔍 Verifying payment on Base network...");
    const verificationResult = await verify(parsedPaymentData, paymentRequirements);

    if (!verificationResult.isValid) {
      console.error("❌ Payment verification failed:", verificationResult);
      return NextResponse.json(
        {
          error: verificationResult.invalidReason == 'insufficient_funds' ? 'insufficient funds' : "Payment verification failed",
          reason: verificationResult.invalidReason || "Invalid payment",
        },
        { status: 402, headers }
      );
    }

    // console.log("✅ Payment verified for:", verificationResult.payer);

    // ---------------------------
    // 3️⃣ Settle payment with retry logic
    // ---------------------------
    let settlementResult;
    try {
      // Use the enhanced retry function
      settlementResult = await settlePaymentWithRetry(settle, parsedPaymentData, paymentRequirements, 2);
    } catch (error: any) {
      console.error("❌ Settlement failed after retries:", error.message);

      // Handle expired payment (specific 402)
      if (error.message.includes('PAYMENT_EXPIRED')) {
        return NextResponse.json(
          {
            error: "Payment authorization expired",
            message: "Your payment authorization has expired. Please initiate a new payment.",
            code: "PAYMENT_EXPIRED"
          },
          { status: 402, headers }
        );
      }

      // Generic settlement error (500)
      return NextResponse.json(
        {
          error: "Payment settlement failed",
          message: error.message || "Settlement timed out",
          details: "The payment verification succeeded but settlement failed. Please try again or contact support if the issue persists."
        },
        { status: 500, headers }
      );
    }

    // console.log("💰 Payment settled:", settlementResult.transaction);

    // ---------------------------
    // 4️⃣ Transfer NFT
    // ---------------------------
    // console.log("🎨 Starting NFT transfer to:", to);

    // Use the enhanced transfer retry function
    const transferResult = await transferNFTWithRetry(to, 3);

    if (!transferResult.success) {
      console.error("❌ NFT transfer failed:", transferResult.error);
      // 🔥 CRITICAL: Log the failure but ensure the payment transaction is available for refund/manual delivery
      return NextResponse.json(
        {
          success: false,
          error: "Payment successful but NFT transfer failed",
          paymentTransaction: settlementResult.transaction,
          transferError: transferResult.error,
          // 🔥 Enhancement: Provide instructions for the user/operator
          nextStep: "A refund or manual delivery of the NFT may be required. Please check the NFT wallet balance and the payment transaction.",
        },
        { status: 500, headers }
      );
    }

    // console.log("✅ NFT transferred successfully:", transferResult);

    // ---------------------------
    // 5️⃣ Return success with NFT transfer details
    // ---------------------------


    const dataPayload = {
      success: true,
      message: "Payment successful and NFT transferred!",
      timestamp: new Date().toISOString(),
      facilitator: "coinbase-cdp",
      paymentTransaction: settlementResult.transaction,
      nftTokenId: transferResult.tokenId,
      nftTransactionHash: transferResult.transactionHash,
      nftRecipient: to,
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
    // Catch all unexpected errors (e.g., JSON parsing of the request body before the main logic)
    console.error("🔥 CDP x402 API UNEXPECTED error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// --------------------------
// OPTIONS (CORS Support - No Change)
// ---------------------------
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