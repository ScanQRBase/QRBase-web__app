
function withValidProperties(
  properties: Record<string, undefined | string | string[]>,
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value;
    }),
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL;
  const CLIENT_ID = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID

  return Response.json({

    // accountAssociation: {
    //   header: "eyJmaWQiOjEwNzc1NDYsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg0ZEZjNjU5MDY4MUM1MzQ0MDcxNDg2NjYzMTUxRDcwMDQ1NjRENDA1In0",
    //   payload: "eyJkb21haW4iOiJwcml2eS1xci1iYXNlLnBhZ2VzLmRldiJ9",
    //   signature: "MHgzYTFkMDBjODAxNmMyNDM5OGI4MjM0OTdiMjA1NDJjNjM3MWFhY2VkOTdjMTQyMGRmMDQzZTllOTQzYmIyMTg2NDQ1MzQ4MzM3YmQ1NjljZjM0N2ExYWUwMTBhZjE5Njg0OGZkYzYzYTk3OGExYjRhOGQzN2M0NTMzM2QwZjVmOTFj",
    // },
    accountAssociation: {
      header: process.env.FARCASTER_HEADER,
      payload: process.env.FARCASTER_PAYLOAD,
      signature: process.env.FARCASTER_SIGNATURE,
    },
    frame: withValidProperties({
      version: "1",
      name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
      subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE,
      description: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
      screenshotUrls: [],
      iconUrl: "https://www.qrbase.xyz/icon.png",
      splashImageUrl: "https://www.qrbase.xyz/splash.png",
      splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
      homeUrl: URL,
      webhookUrl: `https://api.neynar.com/f/app/${CLIENT_ID}/event`,
      primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY,
      buttonTitle: "Start Hunt Prizes",
      imageUrl: "https://www.qrbase.xyz/images/puzzle/share/Thumbnail.jpg",
      castShareUrl: "https://www.qrbase.xyz",

      tags: [
        "rewards",
        "leaderboard",
        "warpcast",
        "earn"
      ],
      heroImageUrl: "https://www.qrbase.xyz/icon.png",
      tagline: process.env.NEXT_PUBLIC_APP_TAGLINE,
      ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE,
      ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION,
      ogImageUrl: "https://www.qrbase.xyz/images/puzzle/share/Thumbnail.jpg",
    }),
    baseBuilder: {
      allowedAddresses: ["0x45B36890159DED0d8388C7E0ce0E4FA10d75D9a1"]
    }
  });
}