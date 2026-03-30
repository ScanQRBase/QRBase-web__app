import ScanModeMain from '../../components/scan-mode/ScanModeMain';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export async function generateMetadata({ params, searchParams }: { params: Promise<{ address: string }>, searchParams: Promise<{ stage?: string }> }) {
    const { address } = await params;
    const { stage } = await searchParams;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.qrbase.xyz';
    const workerUrl = process.env.GAME_WORKER_URL;
    const apiKey = process.env.GAME_API_KEY;
    const title = `QRBase Scan Mode`;
    const description = 'Community-driven QR reveal. Solve puzzles to unlock pieces and win prizes!';
    let imageUrl = 'https://www.qrbase.xyz/images/puzzle/share/Thumbnail.jpg';

    // If stage param is present, fetch the correct share image dynamically
    if (stage && workerUrl && apiKey) {
        try {
            const res = await fetch(`${workerUrl}/scan-mode/progress/${encodeURIComponent(address)}`, {
                headers: { 'Authorization': `Bearer ${apiKey}` },
                cache: 'no-store',
            });
            const json = await res.json() as any;
            if (json.success && json.data?.shareImages) {
                const stageNum = parseInt(stage, 10);
                const images = json.data.shareImages as string[];
                if (images[stageNum]) {
                    imageUrl = images[stageNum];
                } else if (images.length > 0) {
                    imageUrl = images[images.length - 1];
                }
            }
        } catch (e) {
            // Fall back to default image
        }
    }

    const pageUrl = stage
        ? `${baseUrl}/scanMode/${address}?stage=${stage}`
        : `${baseUrl}/scanMode/${address}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [{ url: imageUrl, width: 1200, height: 630, alt: 'QRBase Scan Mode' }],
            url: pageUrl,
            type: 'website',
            site_name: 'QRBase',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
        other: {
            'fc:miniapp': JSON.stringify({
                version: '1',
                imageUrl,
                button: {
                    title: 'Scan to win',
                    action: {
                        type: 'launch_frame',
                        name: 'QRbase',
                        url: 'https://www.qrbase.xyz',
                        splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE,
                        splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
                    },
                },
            }),
        },
    };
}

export default async function Page({ params }: { params: Promise<{ address: string }> }) {
    const { address } = await params;
    return <ScanModeMain partnerAddress={address} />;
}
