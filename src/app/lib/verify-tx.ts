/**
 * Shared On-Chain Transaction Verification Utility
 * 
 * Polls for a transaction receipt with retries. Used by both
 * /api/game/buy and /api/game/boost/purchase routes.
 */

import { createPublicClient, http, fallback, parseAbi, decodeEventLog } from 'viem';
import { base } from 'viem/chains';
import type { TransactionReceipt, PublicClient } from 'viem';

// ============================================================================
// Shared Public Client (Base mainnet)
// ============================================================================

export const basePublicClient: PublicClient = createPublicClient({
    chain: base,
    transport: fallback([
        http(process.env.NEXT_PUBLIC_RPC_SITE1_URL),
        http(process.env.NEXT_PUBLIC_RPC_SITE2_URL),
    ]),
}) as PublicClient;

// ============================================================================
// Shared ERC-20 Transfer Event ABI
// ============================================================================

export const erc20TransferAbi = parseAbi([
    'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

// ============================================================================
// Polling Receipt Helper
// ============================================================================

/**
 * Polls for a transaction receipt with exponential backoff.
 * 
 * @param txHash - The transaction hash to look up
 * @param maxAttempts - Maximum number of polling attempts (default: 10)
 * @param delayMs - Delay between attempts in ms (default: 2000)
 * @returns The transaction receipt once found
 * @throws Error if receipt not found after all attempts
 */
export async function waitForReceipt(
    txHash: string,
    maxAttempts: number = 10,
    delayMs: number = 2000
): Promise<TransactionReceipt> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const receipt = await basePublicClient.getTransactionReceipt({
                hash: txHash as `0x${string}`,
            });
            console.log(`[verify-tx] Receipt found on attempt ${attempt}`);
            return receipt;
        } catch (err: any) {
            console.log(`[verify-tx] Receipt not yet available (attempt ${attempt}/${maxAttempts})`);
            if (attempt === maxAttempts) {
                console.error('[verify-tx] Failed to get tx receipt after all attempts:', err.message);
                throw new Error(
                    'Transaction not found on Base after polling. It may still be pending — please try again.'
                );
            }
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    // Unreachable, but TypeScript needs this
    throw new Error('Unreachable');
}

// ============================================================================
// ERC-20 Transfer Verification
// ============================================================================

export interface VerifiedTransfer {
    from: string;
    to: string;
    value: bigint;
}

/**
 * Verifies that a transaction receipt contains a valid ERC-20 Transfer event
 * to the expected recipient with sufficient value.
 * 
 * @param receipt - The transaction receipt to check
 * @param tokenAddress - The ERC-20 token contract address (lowercase)
 * @param expectedRecipient - The expected recipient address (lowercase)
 * @param expectedMinValue - The minimum expected transfer value
 * @returns The verified transfer details, or null if not found
 */
export function verifyERC20Transfer(
    receipt: TransactionReceipt,
    tokenAddress: string,
    expectedRecipient: string,
    expectedMinValue: bigint
): VerifiedTransfer | null {
    for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== tokenAddress.toLowerCase()) continue;

        try {
            const decoded = decodeEventLog({
                abi: erc20TransferAbi,
                data: log.data,
                topics: log.topics,
            });

            if (decoded.eventName === 'Transfer') {
                const { from, to, value } = decoded.args as { from: string; to: string; value: bigint };

                if (to.toLowerCase() !== expectedRecipient) continue;

                if (value >= expectedMinValue) {
                    return { from, to, value };
                }
            }
        } catch {
            continue;
        }
    }
    return null;
}
