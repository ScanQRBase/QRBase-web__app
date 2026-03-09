/**
 * Dynamic NFT Scanner with Retry Logic
 * Scans wallet for available NFTs and retries if transfer fails
 * Edge Runtime compatible - uses in-memory storage
 */

import { createThirdwebClient, getContract } from "thirdweb";
import { balanceOf, ownerOf , getOwnedNFTs } from "thirdweb/extensions/erc721";
import { defineChain } from "thirdweb/chains";

interface TransferRecord {
  tokenId: string;
  recipient: string;
  timestamp: string;
  transactionHash?: string;
}




const client = createThirdwebClient({
  secretKey: process.env.NEXT_PUBLIC_THIRDWEB_SECRET_KEY || ''
});

// In-memory storage for transferred NFTs (Edge Runtime compatible)
let transferredNFTs: TransferRecord[] = [];

/**
 * Load transferred NFTs from memory
 */
// function loadTransferredNFTs(): TransferRecord[] {
//   return transferredNFTs;
// }

/**
 * Save transferred NFT record to memory
 */
// function saveTransferredNFT(record: TransferRecord): void {
//   transferredNFTs.push(record);
//   console.log('✅ Saved transfer record:', record);
// }

/**
 * Get set of already transferred token IDs
 */
// function getTransferredTokenIds(): Set<string> {
//   const records = loadTransferredNFTs();
//   return new Set(records.map(r => r.tokenId));
// }

/**
 * Find available NFTs by scanning wallet
 * Returns array of available token IDs
 */
export async function findAvailableNFTs(
  walletAddress: string,
  contractAddress: string,
  maxToFind: number = 2,
  maxScan: number = 5000
): Promise<{ availableTokens: bigint[]; ownedCount: number }> {
  console.log(`🔍 Scanning for available NFTs in wallet ${walletAddress}...`);

  const contract = getContract({
    client,
    chain: defineChain(8453), // Base mainnet
    address: contractAddress,
  });

  let owned: any[] = [];

  // Step 1: Check balance & owned NFTs
  try {
    const balance = await balanceOf({
      contract,
      owner: walletAddress,
    });

    owned = await getOwnedNFTs({
      contract,
      owner: walletAddress,
    });

    console.log(`Wallet balance: ${balance} NFTs`);
    console.log(`NFT count (owned): ${owned}`);

    // If no NFTs owned, return empty
    if (owned.length === 0) {
      console.warn("⚠️ Wallet has no NFTs!");
      return { availableTokens: [], ownedCount: 0 };
    }

    // Adjust maxToFind if owned is smaller
    if (owned.length < maxToFind) {
      maxToFind = owned.length;
    }
  } catch (error) {
    console.error("Error checking balance or owned NFTs:", error);
    return { availableTokens: [], ownedCount: 0 };
  }

  // Step 2: Scan for available tokens
  const availableTokens: bigint[] = [];
  // const transferredIds = getTransferredTokenIds(); // Uncomment if you use it

  for (let i = 0; i < maxScan && availableTokens.length < maxToFind; i++) {
    try {
      const tokenId = BigInt(i);
      const owner = await ownerOf({ contract, tokenId });

      if (owner.toLowerCase() === walletAddress.toLowerCase()) {
        // if (!transferredIds.has(tokenId.toString())) {
          availableTokens.push(tokenId);
          console.log(`✅ Found available token: #${tokenId}`);
        // } else {
        //   console.log(`⏭️ Token #${tokenId} already transferred, skipping`);
        // }
      }
    } catch {
      continue; // skip non-existent or inaccessible tokens
    }
  }

  console.log(`🎯 Found ${availableTokens.length} available NFTs out of ${owned.length} owned`);

  return {
    availableTokens,
    ownedCount: owned.length,
  };
}

/**
 * Get next available token ID with retry logic
 * If first token fails, tries the next one
 */
export async function getNextAvailableTokenWithRetry(
  walletAddress: string,
  contractAddress: string,
  excludeTokens: string[] = []
): Promise<bigint> {
  console.log('🔍 Finding next available NFT...');
  
  // Find multiple available tokens (for retry)
  const findedNft = await findAvailableNFTs(
    walletAddress,
    contractAddress,
    2, // Find up to 2 tokens
    5000 // Scan up to 5000 token IDs
  );

  if (findedNft.availableTokens.length === 0) {
    throw new Error('No available NFTs found in wallet');
  }

  // Filter out excluded tokens
  const filteredTokens = findedNft.availableTokens.filter(
    token => !excludeTokens.includes(token.toString())
  );

  if (filteredTokens.length === 0) {
    throw new Error('No available NFTs after filtering excluded tokens');
  }

  const selectedToken = filteredTokens[0];
  console.log(`✅ Selected token: #${selectedToken}`);
  
  return selectedToken;
}

/**
 * Mark token as transferred
 */
// export function markAsTransferred(
//   tokenId: string,
//   recipient: string,
//   transactionHash?: string
// ): void {
//   const record: TransferRecord = {
//     tokenId,
//     recipient,
//     timestamp: new Date().toISOString(),
//     transactionHash,
//   };
  
//   saveTransferredNFT(record);
// }

/**
 * Get transfer history
 */
// export function getTransferHistory(): TransferRecord[] {
//   return loadTransferredNFTs();
// }

/**
 * Check if wallet owns specific token
 */
export async function checkTokenOwnership(
  walletAddress: string,
  contractAddress: string,
  tokenId: bigint
): Promise<boolean> {
  try {
    const contract = getContract({
      client,
      chain: defineChain(8453),
      address: contractAddress,
    });

    const owner = await ownerOf({
      contract,
      tokenId,
    });

    return owner.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error(`Error checking ownership of token ${tokenId}:`, error);
    return false;
  }
}
