'use client';

/**
 * ScanModePageSkeleton — Full-page skeleton matching the scan mode layout.
 * Shows animated placeholders for: partner ticker, left sidebar, QR grid, timeline, footer.
 */
export default function ScanModePageSkeleton() {
    return (
        <>
            {/* ── Partner Ticker Skeleton ── */}
            <header className="fixed left-0 w-full border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-50 top-[100px] md:top-[91px]">
                <div className="container mx-auto px-4 py-2 lg:px-6">
                    <div className="flex overflow-hidden space-x-4 justify-center">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="flex-shrink-0 animate-pulse"
                                style={{ width: 180, height: 48, borderRadius: 30 }}
                            >
                                <div className="w-full h-full rounded-[28px] bg-gray-200 dark:bg-gray-700 flex items-center gap-2 px-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600" />
                                    <div className="flex flex-col gap-1">
                                        <div className="w-14 h-3 rounded bg-gray-300 dark:bg-gray-600" />
                                        <div className="w-20 h-2.5 rounded bg-gray-300 dark:bg-gray-600" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            {/* ── Main 3-Column Content ── */}
            <main className="mx-auto flex max-w-7xl grow flex-col">
                <div className="flex grow flex-col md:flex-row containQrBase">
                    <div className="flex grow flex-col md:flex-row">

                        {/* ── Left Sidebar Skeleton (Partner Info) ── */}
                        <div className="zoraClass flex flex-col justify-center border-gray-200 dark:border-gray-700 border-b p-4 py-8 pb-12 md:w-1/3 md:border-r md:border-b-0 md:py-22 md:pt-[50px] lg:border-r lg:p-6 lg:pb-22 lg:pt-[50px]">
                            <div className="space-y-4 text-left animate-pulse">
                                {/* Logo + Name */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                                        <div className="w-24 h-6 rounded bg-gray-200 dark:bg-gray-700" />
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                                </div>

                                {/* Description lines */}
                                <div className="space-y-2">
                                    <div className="w-full h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="w-4/5 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="w-3/5 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                </div>

                                {/* Social icons row */}
                                <div className="flex gap-3 items-center" style={{ marginBottom: 20 }}>
                                    <div className="w-12 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="w-[30px] h-[30px] rounded-full bg-gray-200 dark:bg-gray-700" />
                                    ))}
                                </div>

                                {/* Access Requirements box */}
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 space-y-3" style={{ maxWidth: 280 }}>
                                    <div className="flex justify-between items-center">
                                        <div className="w-40 h-5 rounded bg-gray-200 dark:bg-gray-700" />
                                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700" />
                                    </div>
                                    <div className="w-full h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700" />
                                        <div className="w-32 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700" />
                                        <div className="w-40 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                    </div>
                                </div>

                                {/* Reward Tiers box */}
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 space-y-2" style={{ maxWidth: 280 }}>
                                    <div className="w-28 h-5 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="w-full h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="w-4/5 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="w-3/5 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                </div>

                                {/* Useful Links */}
                                <div className="pt-4 space-y-2">
                                    <div className="w-20 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="w-28 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="w-24 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                </div>
                            </div>
                        </div>

                        {/* ── Center Skeleton (QR Grid) ── */}
                        <div className="qrClass qrScale flex flex-col items-center justify-center md:w-[64%] relative overflow-hidden">
                            <div className="w-full flex flex-col items-center animate-pulse">
                                {/* Trophy + Round title */}
                                <div className="flex flex-col items-center mb-4">
                                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
                                    <div className="w-48 h-5 rounded bg-gray-200 dark:bg-gray-700" />
                                </div>

                                {/* 3×3 Grid */}
                                <div className="relative w-[440px] h-[440px] border-2 border-gray-300 dark:border-gray-600 rounded-lg grid grid-cols-3 grid-rows-3">
                                    {[...Array(9)].map((_, i) => (
                                        <div key={i} className="border border-gray-300 dark:border-gray-600">
                                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
                                        </div>
                                    ))}
                                </div>

                                {/* Viewer count pill */}
                                <div className="flex items-center space-x-2 border border-gray-300 dark:border-gray-600 px-4 py-1 rounded-full mt-6 mb-2">
                                    <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700" />
                                    <div className="w-6 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="w-24 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                </div>
                            </div>
                        </div>

                        {/* ── Right Sidebar Skeleton (Timeline / Progress) ── */}
                        <div className="qrRoad flex flex-col justify-start md:justify-center border-gray-200 dark:border-gray-700 border-b p-4 py-8 pb-12 w-full md:w-1/3 md:border-l md:border-b-0 md:py-4 md:pt-[75px] lg:border-l lg:p-6 lg:pb-22 lg:pt-[75px]">
                            <div className="coinInfoBlock w-full animate-pulse">
                                {/* Stat boxes row */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 space-y-1">
                                        <div className="w-16 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                        <div className="w-10 h-5 rounded bg-gray-200 dark:bg-gray-700" />
                                    </div>
                                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 space-y-1">
                                        <div className="w-24 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                        <div className="w-10 h-5 rounded bg-gray-200 dark:bg-gray-700" />
                                    </div>
                                </div>

                                {/* Progress header + bar */}
                                <div className="mb-5">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="w-40 h-5 rounded bg-gray-200 dark:bg-gray-700" />
                                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700" />
                                    </div>
                                    <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-gray-700" />
                                </div>

                                {/* Timeline dots */}
                                <div className="ml-2 space-y-0">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700" />
                                                {i < 7 && <div className="w-0.5 h-6 bg-gray-200 dark:bg-gray-700" />}
                                            </div>
                                            <div className="flex items-center gap-2 pt-0.5">
                                                <div className="w-10 h-3.5 rounded bg-gray-200 dark:bg-gray-700" />
                                                <div className="w-16 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* ── Footer Skeleton ── */}
            <div className="z-50 relative md:fixed right-0 md:bottom-0 w-full border-gray-200 dark:border-gray-700 border-t bg-white dark:bg-gray-900">
                <div className="flex w-full justify-center py-2 animate-pulse" style={{ alignItems: 'center', flexDirection: 'column' }}>
                    <div className="w-64 h-5 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
                    <div className="flex items-center px-3 py-1 rounded-full gap-2 bg-gray-100 dark:bg-gray-800">
                        <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <div className="w-48 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                </div>
            </div>
        </>
    );
}
