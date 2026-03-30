/**
 * Development page to seed referral test data
 * Access at /puzzle/seed-referrals
 * 
 * Calls the worker directly to seed fake referral data
 */

"use client";

import { useState } from 'react';

const WORKER_URL = 'https://game-api.qrbase.workers.dev';

export default function SeedReferralsPage() {
    const [result, setResult] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [statusResult, setStatusResult] = useState<string>('');

    const seedData = async () => {
        setLoading(true);
        setResult('');
        setStatusResult('');

        try {
            // Seed referrals for "x:0xCafu" - testing with fake referrals
            const seedResponse = await fetch(`${WORKER_URL}/referral/seed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referrerId: 'x:0xCafu',
                    referrals: [
                        {
                            userId: 'x:virch1',
                            displayName: 'virch1',
                            profilePhoto: 'https://pbs.twimg.com/profile_images/1234567890/photo.jpg',
                            totalSpent: 5000,
                            earnings: 1000,
                        },
                        {
                            userId: 'x:virch2',
                            displayName: 'virch2',
                            profilePhoto: 'https://pbs.twimg.com/profile_images/1234567891/photo.jpg',
                            totalSpent: 10000,
                            earnings: 2000,
                        },
                        {
                            userId: 'x:virch3',
                            displayName: 'virch3',
                            profilePhoto: 'https://pbs.twimg.com/profile_images/1234567892/photo.jpg',
                            totalSpent: 5000,
                            earnings: 1000,
                        },
                        {
                            userId: 'x:virch4',
                            displayName: 'virch4',
                            profilePhoto: null,
                            totalSpent: 5000,
                            earnings: 1000,
                        },
                        {
                            userId: 'x:virch5',
                            displayName: 'virch5',
                            profilePhoto: null,
                            totalSpent: 5000,
                            earnings: 1000,
                        },
                        {
                            userId: 'x:virch6',
                            displayName: 'virch6',
                            profilePhoto: null,
                            totalSpent: 5000,
                            earnings: 1000,
                        },
                        {
                            userId: 'x:virch7',
                            displayName: 'virch7',
                            profilePhoto: null,
                            totalSpent: 5000,
                            earnings: 1000,
                        },
                    ],
                }),
            });
            const seedData = await seedResponse.json();
            setResult(JSON.stringify(seedData, null, 2));

            // Verify by fetching status
            const statusResponse = await fetch(`${WORKER_URL}/user?userId=${encodeURIComponent('x:0xCafu')}`);
            const statusData = await statusResponse.json();
            setStatusResult(JSON.stringify(statusData.data?.referralStats || statusData, null, 2));

        } catch (error) {
            setResult(`Error: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const checkStatus = async () => {
        setLoading(true);
        setStatusResult('');

        try {
            const response = await fetch(`${WORKER_URL}/user?userId=${encodeURIComponent('x:0xCafu')}`);
            const data = await response.json();
            setStatusResult(JSON.stringify(data.data?.referralStats || data, null, 2));
        } catch (error) {
            setStatusResult(`Error: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-2xl font-bold mb-4">Seed Referral Test Data</h1>
            <p className="text-gray-400 mb-4">This seeds fake referral data for user x:0xCafu directly to the production worker.</p>

            <div className="flex gap-4 mb-4">
                <button
                    onClick={seedData}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-600"
                >
                    {loading ? 'Working...' : 'Seed Data'}
                </button>
                <button
                    onClick={checkStatus}
                    disabled={loading}
                    className="px-4 py-2 bg-green-500 rounded hover:bg-green-600 disabled:bg-gray-600"
                >
                    {loading ? 'Working...' : 'Check Status'}
                </button>
            </div>

            {result && (
                <div className="mb-4">
                    <h2 className="text-lg font-bold mb-2">Seed Result:</h2>
                    <pre className="p-4 bg-gray-800 rounded overflow-auto max-h-48 text-sm">
                        {result}
                    </pre>
                </div>
            )}

            {statusResult && (
                <div>
                    <h2 className="text-lg font-bold mb-2">Status - referralStats:</h2>
                    <pre className="p-4 bg-gray-800 rounded overflow-auto max-h-96 text-sm">
                        {statusResult}
                    </pre>
                </div>
            )}
        </div>
    );
}
