/**
 * Fast NFT Manager - Uses manual token list instead of scanning
 * Much faster than scanning the blockchain
 */

import fs from 'fs';
import path from 'path';

const TRACKING_FILE = path.join(process.cwd(), 'data', 'transferred-nfts.json');
const OWNED_TOKENS_FILE = path.join(process.cwd(), 'data', 'owned-tokens.json');

interface TransferRecord {
  tokenId: string;
  recipient: string;
  timestamp: string;
  transactionHash?: string;
}

interface OwnedTokensConfig {
  walletAddress: string;
  tokenIds: string[];
  lastUpdated: string;
}

/**
 * Load transferred NFTs from file
 */
function loadTransferredNFTs(): TransferRecord[] {
  try {
    const dataDir = path.dirname(TRACKING_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(TRACKING_FILE)) {
      const data = fs.readFileSync(TRACKING_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading transferred NFTs:', error);
  }
  return [];
}

/**
 * Save transferred NFT record
 */
function saveTransferredNFT(record: TransferRecord): void {
  try {
    const records = loadTransferredNFTs();
    records.push(record);
    
    const dataDir = path.dirname(TRACKING_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(TRACKING_FILE, JSON.stringify(records, null, 2));
    console.log('Saved transfer record:', record);
  } catch (error) {
    console.error('Error saving transferred NFT:', error);
  }
}

/**
 * Get list of already transferred token IDs
 */
function getTransferredTokenIds(): Set<string> {
  const records = loadTransferredNFTs();
  return new Set(records.map(r => r.tokenId));
}

/**
 * Load owned tokens from config file
 */
function loadOwnedTokens(): string[] {
  try {
    if (fs.existsSync(OWNED_TOKENS_FILE)) {
      const data = fs.readFileSync(OWNED_TOKENS_FILE, 'utf-8');
      const config: OwnedTokensConfig = JSON.parse(data);
      console.log(`Loaded ${config.tokenIds.length} owned tokens from config`);
      return config.tokenIds;
    }
  } catch (error) {
    console.error('Error loading owned tokens:', error);
  }
  
  // Return empty array if file doesn't exist
  console.warn('⚠️ No owned-tokens.json file found. Please create it with your NFT token IDs.');
  return [];
}

/**
 * Save owned tokens to config file
 */
export function saveOwnedTokens(walletAddress: string, tokenIds: string[]): void {
  try {
    const dataDir = path.dirname(OWNED_TOKENS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const config: OwnedTokensConfig = {
      walletAddress,
      tokenIds,
      lastUpdated: new Date().toISOString(),
    };
    
    fs.writeFileSync(OWNED_TOKENS_FILE, JSON.stringify(config, null, 2));
    console.log(`Saved ${tokenIds.length} owned tokens to config`);
  } catch (error) {
    console.error('Error saving owned tokens:', error);
  }
}

/**
 * Get next available NFT token ID to transfer (FAST VERSION)
 * Uses manual token list instead of scanning blockchain
 */
export async function getNextAvailableTokenId(walletAddress: string): Promise<bigint> {
  console.log('Getting next available token ID (fast mode)...');
  
  // Get already transferred tokens
  const transferredIds = getTransferredTokenIds();
  console.log(`Already transferred: ${transferredIds.size} tokens`);

  // Get owned tokens from config file
  const ownedTokens = loadOwnedTokens();
  
  if (ownedTokens.length === 0) {
    throw new Error(
      'No owned tokens configured. Please create data/owned-tokens.json with your NFT token IDs.\n' +
      'Example: { "walletAddress": "0x...", "tokenIds": ["1", "5", "12", "27"], "lastUpdated": "2024-01-01T00:00:00Z" }'
    );
  }

  // Find first token that hasn't been transferred
  for (const tokenId of ownedTokens) {
    if (!transferredIds.has(tokenId)) {
      console.log(`Selected token ID: ${tokenId}`);
      return BigInt(tokenId);
    }
  }

  throw new Error(
    `No available NFTs to transfer. All ${ownedTokens.length} configured NFTs have been transferred.\n` +
    'Please add more token IDs to data/owned-tokens.json or mint more NFTs.'
  );
}

/**
 * Mark token as transferred
 */
export function markAsTransferred(
  tokenId: string,
  recipient: string,
  transactionHash?: string
): void {
  const record: TransferRecord = {
    tokenId,
    recipient,
    timestamp: new Date().toISOString(),
    transactionHash,
  };
  
  saveTransferredNFT(record);
}

/**
 * Get transfer history
 */
export function getTransferHistory(): TransferRecord[] {
  return loadTransferredNFTs();
}

/**
 * Get available NFT count (FAST VERSION)
 */
export async function getAvailableNFTCount(walletAddress: string): Promise<number> {
  const ownedTokens = loadOwnedTokens();
  const transferredIds = getTransferredTokenIds();
  
  const available = ownedTokens.filter(
    tokenId => !transferredIds.has(tokenId)
  );
  
  return available.length;
}

/**
 * Reset tracking (for testing only)
 */
export function resetTracking(): void {
  if (fs.existsSync(TRACKING_FILE)) {
    fs.unlinkSync(TRACKING_FILE);
    console.log('Transfer tracking reset');
  }
}

/**
 * Initialize owned tokens file with example
 */
export function initializeOwnedTokensFile(walletAddress: string, exampleTokenIds: string[] = ['1', '2', '3']): void {
  const dataDir = path.dirname(OWNED_TOKENS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(OWNED_TOKENS_FILE)) {
    saveOwnedTokens(walletAddress, exampleTokenIds);
    console.log('Created owned-tokens.json with example token IDs');
  }
}
