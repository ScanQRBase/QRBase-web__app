export const runtime = 'edge';

import { encryptObject } from "@/src/app/utils/encrypt_decrypt"


export default async function handler(req: Request) {
  const apiKey = req.headers.get('api-key');
  const apiKeyCloud = process.env.NEXT_PUBLIC_API_KEY as string;
  const apiKeyWorker = process.env.NEXT_PUBLIC_API_KEY_WORKER as string;
  const apiCoinInfo =  process.env.NEXT_PUBLIC_API_COIN_INFO as string;
  const apiCoinSecret =  process.env.NEXT_PUBLIC_API_COIN_SECRET as string;
  const body = await req.text();  // Read the stream
  const { pool , id } = JSON.parse(body);  // Parse the body as JSON and extract 'pool'

  if (!apiKey || apiKey !== apiKeyCloud) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type, api-key',
      },
    });
  }

  if (!pool) {
    return new Response(
      JSON.stringify({ message: "Pool parameter is required" }),
      { status: 400 }
    );
  }

  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type, api-key',
      },
    });
  }

  if (req.method === 'POST') {
    const coinInfo = await getCoinInfo(apiKeyWorker , apiCoinInfo , pool , id);
    
    return new Response(JSON.stringify(encryptObject(coinInfo , apiCoinSecret)), {
      status: 200,
      headers: { 'Content-Type': 'application/json',"Cache-Control": "no-cache", 'Access-Control-Allow-Origin': '*'  },
      
    });
  }


  return new Response(JSON.stringify(encryptObject({ message: 'Method Not Allowed' } , apiCoinSecret)), {
    status: 405,
    headers: { 'Content-Type': 'application/json',"Cache-Control": "no-cache", 'Access-Control-Allow-Origin': '*' },
  });
}


// Mock functions for fetching and saving data
async function getCoinInfo(apiKey:string , apiCoinInfo:string ,  pool: string , id:string) {
  // You can replace this with real logic to get data from a database or KV store
  const requestBody = { pool , id };

    const coinInfoResponse = await fetch(apiCoinInfo , {
        method: "POST",
        headers: { "Content-Type": "application/json" , "Cache-Control": "no-cache", "api-key":  apiKey },
        body: JSON.stringify(requestBody),
        next: { revalidate: 5 }, // Cache for 5 seconds (adjust as needed)
      });
    const coinInfo = await coinInfoResponse.json();

    return coinInfo || {}
   
}





