/**
 * Puzzle Layout
 * Wraps all puzzle pages with PuzzleDataProvider for shared state
 */

import { PuzzleDataProvider } from '@/src/app/lib/context/PuzzleDataContext';

export default function PuzzleLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PuzzleDataProvider>
            {children}
        </PuzzleDataProvider>
    );
}
