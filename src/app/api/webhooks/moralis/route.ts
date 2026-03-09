import { NextResponse } from 'next/server';

const WORKER_URL = process.env.GAME_WORKER_URL || 'https://puzzlegame.bitgrass-crypto.workers.dev';
const API_KEY = process.env.GAME_API_KEY || '';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Received Moralis Webhook:', body);

        // Process erc20Transfers if any
        if (body.erc20Transfers && Array.isArray(body.erc20Transfers)) {
            for (const transfer of body.erc20Transfers) {
                // Determine exact delta based on from/to
                // Webhook sends transfers, so 'from' loses tokens (negative delta), 'to' gains tokens (positive delta)
                const updates = [
                    { address: transfer.from.toLowerCase(), delta: -(parseFloat(transfer.value) / 1e18) },
                    { address: transfer.to.toLowerCase(), delta: (parseFloat(transfer.value) / 1e18) }
                ];

                // Broadcast to both sender and recipient
                for (const { address, delta } of updates) {
                    if (address && address !== '0x0000000000000000000000000000000000000000') {
                        try {
                            await fetch(`${WORKER_URL}/broadcast`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${API_KEY}`,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    room: `balance_${address}`,
                                    event: {
                                        type: 'BALANCE_UPDATE',
                                        // Send delta so frontend knows exact balance change or knows to trigger skeleton
                                        // Delta is sent as null here so that the skeleton always triggers for 4s, ensuring we get the true post-chain balance.
                                        delta: null,
                                        timestamp: new Date().toISOString()
                                    }
                                })
                            });
                        } catch (err) {
                            console.error(`Failed to broadcast to ${address}`, err);
                        }
                    }
                }
            }
        }

        // Always return 200 OK so Moralis validates the endpoint
        return NextResponse.json({ success: true, message: 'Webhook received' }, { status: 200 });
    } catch (error) {
        console.error('Error processing Moralis Webhook:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
