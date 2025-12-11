import { NextRequest, NextResponse } from 'next/server';
import { encryptObject } from "@/src/app/utils/encrypt_decrypt";

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('api-key');
  const apiKeyCloud = process.env.NEXT_PUBLIC_API_KEY as string;
  const apiKeyWorker = process.env.API_KEY_WORKER as string;
  const apiMaxMarketCap = process.env.API_MAX_MARKET_CAP as string;
  const apiCoinSecret = process.env.NEXT_PUBLIC_API_COIN_SECRET as string;

  if (!apiKey || apiKey !== apiKeyCloud) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allMarketCapInfo = await getAllMaxMarketCap(apiKeyWorker, apiMaxMarketCap);

    return NextResponse.json(encryptObject(allMarketCapInfo, apiCoinSecret), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in getAllMaxMarketCap:', error);
    return NextResponse.json(
      encryptObject({ message: 'Internal Server Error' }, apiCoinSecret),
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, api-key',
    },
  });
}

async function getAllMaxMarketCap(apiKey: string, apiMaxMarketCap: string) {
  const marketCapInfoResponse = await fetch(apiMaxMarketCap, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "api-key": apiKey
    },
    next: { revalidate: 5 },
  });

  const allMarketCapInfo = await marketCapInfoResponse.json();
  return allMarketCapInfo || {};
}
