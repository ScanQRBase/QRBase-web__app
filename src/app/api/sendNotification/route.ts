import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('api-key');
  const NEYNAR_NOTIFICATION_URL = 'https://api.neynar.com/v2/farcaster/frame/notifications/';
  const apiKeyCloud = process.env.NEXT_PUBLIC_API_KEY as string;
  const neynarApiKey = process.env.NEYNAR_API_KEY as string;

  if (!apiKey || apiKey !== apiKeyCloud) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fid, title, body: notificationBody, targetUrl } = body;

    if (!fid || !title || !notificationBody || !targetUrl) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const neynarResponse = await fetch(NEYNAR_NOTIFICATION_URL, {
      method: 'POST',
      headers: {
        'x-api-key': neynarApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target_fids: [fid],
        notification: {
          title,
          body: notificationBody,
          target_url: targetUrl,
          uuid: crypto.randomUUID(),
        },
        filters: {},
      }),
    });

    const data = await neynarResponse.json();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error sending welcome notification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
