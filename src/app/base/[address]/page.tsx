import { notFound } from 'next/navigation';
import QrBaseMain from '@/src/app/components/QrBaseMain';
import partnerData from '@/src/app/data/partnerData.json';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

// Disabled to fix path.join error during build
// export async function generateStaticParams() {
//   return partnerData.map((partner) => ({
//     address: partner.id,
//   }));
// }


export async function generateMetadata({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const partner = partnerData.find((p) => p.id === address);
  
  if (!partner) {
    return { title: 'Not Found', description: 'Partner not found' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.qrbase.xyz';
  const title = `QRBase -$${partner.title.toUpperCase()}`;
  const description = partner.description;
  
  // Use static fallback image during build to avoid hanging
  const imageUrl = 'https://www.qrbase.xyz/image.png';

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
          alt: `${partner.title} Logo`,
        },
      ],
      url: `${baseUrl}/base/${partner.id}`,
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

export default async function Page({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const partner = partnerData.find((p) => p.id === address);

  if (!partner) {
    notFound();
  }

  return <QrBaseMain partnerData={partner} />;
}