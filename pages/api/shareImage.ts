export const runtime = "edge";
export default async function handler(req: Request){
  try {
    const apiKey = req.headers.get('api-key');
    const apiKeyCloud = process.env.NEXT_PUBLIC_API_KEY as string;
    const apiKeyWorker = process.env.NEXT_PUBLIC_API_KEY_WORKER as string;
    const apiFullImages =  process.env.NEXT_PUBLIC_API_SHARE_IMAGE as string;
    const body = await req.text();  // Read the stream
  const { pool } = JSON.parse(body);  // Parse the body as JSON and extract 'pool'

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
    const requestBody = { pool };
 const workerResponse = await fetch(apiFullImages, {
  method: "POST",
  headers: { "Content-Type": "application/json" ,"Cache-Control": "no-cache", "api-key":  apiKeyWorker },
  body: JSON.stringify(requestBody),

});
 const workerData = await workerResponse.json();

 return new Response(JSON.stringify(workerData.images), {
   status: 200,
   headers: {
     "Content-Type": "application/json",
     "Cache-Control": "no-cache",
     "Access-Control-Allow-Origin": "*",
   },
 });
  }
   
  } catch (error) {
    console.error("Error in proxyFullImages API:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


