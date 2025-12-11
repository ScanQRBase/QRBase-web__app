import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fids = searchParams.get("fids"); // example: ?fids=1077546

    if (!fids) {
      return NextResponse.json(
        { error: "Missing 'fids' query parameter" },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing NEYNAR_API_KEY in environment" },
        { status: 500 }
      );
    }

    const res = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk/?fids=${fids}`,
      {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
        },
      }
    );


    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Neynar data", details: error },
      { status: 500 }
    );
  }
}
