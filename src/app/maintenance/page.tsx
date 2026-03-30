'use client';

export default function MaintenancePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white px-6 text-center gap-6">
            <img
                src="/images/gif/QRbase-claim-links-work.gif"
                alt="QRbase"
                className="w-48 h-48 object-contain"
            />
            <h1 className="text-2xl font-bold">Platform under maintenance</h1>
            <p className="text-gray-400 text-base max-w-sm">
                New changes and upgrades are coming soon.
            </p>
        </div>
    );
}
