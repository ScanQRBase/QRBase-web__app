export const runtime = 'edge';

import { encryptObject } from "@/src/app/utils/encrypt_decrypt"


export default async function handler(req: Request) {
  const apiKey = req.headers.get('api-key');
  const apiKeyCloud = process.env.NEXT_PUBLIC_API_KEY as string;
  const apiKeyWorker = process.env.NEXT_PUBLIC_API_KEY_WORKER as string;
  const apiMaxMarketCap =  process.env.NEXT_PUBLIC_API_MAX_MARKET_CAP as string;
  const apiCoinSecret =  process.env.NEXT_PUBLIC_API_COIN_SECRET as string;

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

  if (req.method === 'GET') {
    const allMarketCapInfo = await getAllMaxMarketCap(apiKeyWorker ,apiMaxMarketCap);
    
    return new Response(JSON.stringify(encryptObject(allMarketCapInfo , apiCoinSecret)), {
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
async function getAllMaxMarketCap(apiKey:string , apiMaxMarketCap:string) {

    const marketCapInfoResponse = await fetch(apiMaxMarketCap , {
        method: "GET",
        headers: { "Content-Type": "application/json" , "Cache-Control": "no-cache", "api-key":  apiKey },
        next: { revalidate: 5 }, // Cache for 5 seconds (adjust as needed)
      });
    const allMarketCapInfo = await marketCapInfoResponse.json();

    return allMarketCapInfo || {}
   
}





