import { NextRequest, NextResponse } from 'next/server';



const MORALIS_API_KEY = process.env.MORALIS_API_KEY_BACK || '';
const NFT_COLLECTION_NAME = process.env.NFT_COLLECTION_NAME || 'NFTTEST';
const NFT_WALLET = process.env.NFT_WALLET

/**
 * GET /api/nft/available
 * Check how many NFTs are available to transfer using Moralis API
 */
export async function GET(request: NextRequest) {
  try {

    if (!MORALIS_API_KEY) {
      return NextResponse.json(
        { error: 'MORALIS_API_KEY not configured' },
        { status: 500 }
      );
    }






    const response = await fetch(`https://deep-index.moralis.io/api/v2.2/${NFT_WALLET}/nft/collections?chain=base&token_counts=true`, {
      headers: {
        'X-API-Key': MORALIS_API_KEY,
      },
      cache: 'no-store',
    });



    if (!response.ok) {
      throw new Error(`Moralis API error: ${response.statusText}`);
    }

    const data = await response.json();
    const targetCollection = data?.result?.find(
      (collection: any) =>
        collection?.name?.toLowerCase().trim() === NFT_COLLECTION_NAME?.toLowerCase().trim()
    );

    const availableCount = targetCollection?.count || 0;

    return NextResponse.json({
      walletAddress: NFT_WALLET,
      availableNFTs: availableCount,
      collectionName: NFT_COLLECTION_NAME,
      totalNftOwned: availableCount,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error: any) {
    console.error('Error checking available NFTs:', error);
    return NextResponse.json(
      {
        error: 'Failed to check available NFTs',
        message: error.message,
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}
