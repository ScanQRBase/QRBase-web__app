import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('api-key');
  const apiKeyCloud = process.env.NEXT_PUBLIC_API_KEY as string;
  const apiKeyWorker = process.env.API_KEY_WORKER as string;
  const apiFullImages = process.env.API_SHARE_IMAGE as string;

  if (!apiKey || apiKey !== apiKeyCloud) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { pool } = body;

    if (!pool) {
      return NextResponse.json({ message: "Pool parameter is required" }, { status: 400 });
    }

    const requestBody = { pool };
    const workerResponse = await fetch(apiFullImages, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "api-key": apiKeyWorker
      },
      body: JSON.stringify(requestBody),
      next: { revalidate: 5 },
    });

    const workerData = await workerResponse.json();

    return NextResponse.json(workerData.images, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error in shareImage API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, api-key',
    },
  });
}
