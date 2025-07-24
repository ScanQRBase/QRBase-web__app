export const runtime = 'edge';

import { notFound } from 'next/navigation';
import QrBaseMain from '@/src/app/components/QrBaseMain';
import partnerData from '@/src/app/data/partnerData.json';


export async function generateStaticParams() {
  return partnerData.map((partner) => ({
    address: partner.id,
  }));
}


export async function generateMetadata({ params }: { params: { address: string } }) {
  const address = params.address;
  const partner = partnerData.find((p) => p.id === address);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.qrbase.xyz';

  const config = {
    API_KEY_CLOUD: process.env.NEXT_PUBLIC_API_KEY ?? "",
    SHARE_SEO_ENDPOINT: `${baseUrl}/api/shareImage`,
  };

  const response = await fetch(config.SHARE_SEO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": config.API_KEY_CLOUD,
    },
    body: JSON.stringify({ pool: partner?.pool }),
  });

  const data = await response.json();

  if (!partner) {
    return { title: 'Not Found', description: 'Partner not found' };
  }

  const title = `QRBase -$${partner.title.toUpperCase()}`;
  const description = partner.description;
  const imageUrl = data;

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
      // "fc:frame": JSON.stringify({
      //   version: "next",
      //   imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE,
      //   button: {
      //     title: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME}`,
      //     action: {
      //       type: "launch_frame",
      //       name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
      //       url: URL,
      //       splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE,
      //       splashBackgroundColor:
      //         process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
      //     },
      //   },
      // }),
      'fc:frame': 'vNext', 
      'fc:frame:image': imageUrl,
      'fc:frame:title': title,
    },
  };
}

export default function Page({ params }: { params: { address: string } }) {
  const partner = partnerData.find((p) => p.id === params.address);

  if (!partner) {
    notFound();
  }

  return <QrBaseMain partnerData={partner} />;
}