'use client';

/**
 * PuzzlePageSkeleton — Full-page skeleton matching the puzzle page layout.
 * Shows animated placeholders for: timer bar, puzzle square, action buttons.
 * Used while wallet address is resolving to prevent flickering/wrong data.
 */
export default function PuzzlePageSkeleton() {
    return (
        <main className="mx-auto flex max-w-lg flex-1 flex-col items-center px-4 py-6 w-full pt-28 pb-32 min-h-[calc(100vh-80px)]">
            {/* Timer Bar Skeleton */}
            <div className="w-full max-w-[400px] flex justify-between items-center mb-4 px-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="w-12 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-16 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
            </div>

            {/* Puzzle Container Skeleton */}
            <div className="relative w-full max-w-[400px] aspect-square mb-4 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse">
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
                    </svg>
                </div>
            </div>

            {/* Stats Row Skeleton */}
            <div className="w-full max-w-[400px] flex justify-between items-center mb-4 px-2">
                <div className="flex items-center gap-2">
                    <div className="w-16 h-5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="w-12 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="w-6 h-5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
            </div>

            {/* Action Button Skeleton */}
            <div className="w-full max-w-[400px] mt-2">
                <div className="w-full h-14 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
        </main>
    );
}
