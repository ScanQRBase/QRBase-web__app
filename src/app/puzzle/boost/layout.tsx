import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.qrbase.xyz';

const imageUrl = `${baseUrl}/images/puzzle/share/Boost%20Share%203.webp`;

export const metadata: Metadata = {
    title: 'QRBase - Boost Your Favorite Token',
    description: 'Boost your favorite token on the QR Puzzle! Lock it as the only active puzzle to boost visibility and stack more wins.',
    openGraph: {
        title: 'QRBase - Boost Your Favorite Token',
        description: 'Boost your favorite token on the QR Puzzle! Lock it as the only active puzzle to boost visibility and stack more wins.',
        images: [
            {
                url: imageUrl,
                width: 1200,
                height: 630,
                alt: 'QRBase Boost Share',
            },
        ],
        url: `${baseUrl}/puzzle/boost`,
        type: 'website',
        siteName: 'QRBase',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'QRBase - Boost Your Favorite Token',
        description: 'Boost your favorite token on the QR Puzzle! Lock it as the only active puzzle to boost visibility and stack more wins.',
        images: [imageUrl],
        site: '@ScanQRBase',
    },
};

export default function BoostLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
