import { NextRequest, NextResponse } from 'next/server';
import { encryptObject } from "@/src/app/utils/encrypt_decrypt"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, api-key',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('api-key');
  const apiKeyCloud = process.env.NEXT_PUBLIC_API_KEY as string;
  const apiKeyWorker = process.env.API_KEY_WORKER as string;
  const apiCoinInfo = process.env.API_COIN_INFO as string;
  const apiCoinSecret = process.env.NEXT_PUBLIC_API_COIN_SECRET as string;
  
  const body = await request.json();
  const { pool, id } = body;

  if (!apiKey || apiKey !== apiKeyCloud) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401, headers: corsHeaders }
    );
  }

  if (!pool) {
    return NextResponse.json(
      { message: "Pool parameter is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  const coinInfo = await getCoinInfo(apiKeyWorker, apiCoinInfo, pool, id);
  
  return NextResponse.json(
    encryptObject(coinInfo, apiCoinSecret),
    { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      }
    }
  );
}

async function getCoinInfo(apiKey: string, apiCoinInfo: string, pool: string, id: string) {
  const requestBody = { pool, id };

  const coinInfoResponse = await fetch(apiCoinInfo, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "api-key": apiKey 
    },
    body: JSON.stringify(requestBody),
    next: { revalidate: 5 },
  });
  
  const coinInfo = await coinInfoResponse.json();
  return coinInfo || {};
}
