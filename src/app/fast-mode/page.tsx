import partnerData from '@/src/app/data/partnerData.json';
import QrBaseFastmode from './QrBaseFastmode';


// export async function generateStaticParams() {
//   return partnerData.map((partner) => ({
//     address: partner.id,
//   }));
// }


export async function generateMetadata() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.qrbase.xyz';
  const title = `QRBase - FastMode`;
  const description = 'A special mode where QR pieces are revealed through a timer — Full QR reveal every 8 hours ⏳'
  const imageUrl = 'https://ik.imagekit.io/cafu/Share_Fast_Mode.jpg?updatedAt=null&ik-s=877f60e5991aa39fa0b9722fd4b2cda05646c23e';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `fastmode Logo`,
        },
      ],
      url: `${baseUrl}/fast-mode`,
      type: 'website',
      site_name: 'QRBase',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      site: '@YourTwitterHandle',
    },

    other: {
      "fc:miniapp": JSON.stringify({
        version: "1",
        imageUrl: "https://www.qrbase.xyz/image.png",
        button: {
          title: `Scan to win`,
          action: {
            type: "launch_frame",
            name: "QRbase",
            url: "https://www.qrbase.xyz",
            splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE,
            splashBackgroundColor:
              process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
          },
        },
      }),
      // 'fc:frame': 'vNext', 
      // 'fc:frame:image': imageUrl,
      // 'fc:frame:title': title,
    },
  };
}

export default function Page() {
  return <QrBaseFastmode />;
}