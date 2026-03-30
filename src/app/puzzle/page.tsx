import QrBasePuzzle from './QrBasePuzzle';

export async function generateMetadata() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.qrbase.xyz';
    const title = `QRBase - Puzzle Challenge`;
    const description = 'Solve the sliding puzzle to reveal the hidden image! A fun 3×3 puzzle game powered by QRBase.';
    const imageUrl = `${baseUrl}/images/puzzle/share/Win%20share%203.webp`;

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
                    alt: 'QRBase Puzzle Win Share',
                },
            ],
            url: `${baseUrl}/puzzle`,
            type: 'website',
            site_name: 'QRBase',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
            site: '@ScanQRBase',
        },
        other: {
            "fc:miniapp": JSON.stringify({
                version: "1",
                imageUrl: "https://www.qrbase.xyz/images/puzzle/share/Thumbnail.jpg",
                button: {
                    title: `Play Puzzle`,
                    action: {
                        type: "launch_frame",
                        name: "QRbase",
                        url: "https://www.qrbase.xyz/puzzle",
                        splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE,
                        splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
                    },
                },
            }),
        },
    };
}

export default function Page() {
    return <QrBasePuzzle />;
}
