"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Maximize2, X } from "lucide-react";

// Dynamic import for Confetti to avoid SSR issues
const Confetti = dynamic(() => import("react-confetti-boom").then(mod => mod.default), {
    ssr: false,
    loading: () => null
});

interface PuzzleGameProps {
    imageSrc: string;
    onMove?: () => void;
    onSolved?: () => void;
    moves?: number;
    onShuffle?: () => void;
    isSolved?: boolean;
    isUnlocked?: boolean;
    isFullscreenMode?: boolean;
    isBoosted?: boolean;
}

// Generate a solvable shuffle
function generateSolvableShuffle(): number[] {
    const tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];

    // Fisher-Yates shuffle
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    // Check if solvable (even number of inversions for 3x3)
    let inversions = 0;
    for (let i = 0; i < tiles.length - 1; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
            if (tiles[i] !== 8 && tiles[j] !== 8 && tiles[i] > tiles[j]) {
                inversions++;
            }
        }
    }

    // If odd inversions, swap two non-empty tiles to make it solvable
    if (inversions % 2 !== 0) {
        const idx1 = tiles.findIndex(t => t !== 8);
        const idx2 = tiles.findIndex((t, i) => t !== 8 && i !== idx1);
        [tiles[idx1], tiles[idx2]] = [tiles[idx2], tiles[idx1]];
    }

    return tiles;
}

function isSolvedCheck(tiles: number[]): boolean {
    return tiles.every((tile, index) => tile === index);
}

// Animation variants
const tileVariants = {
    idle: { scale: 1, x: 0, y: 0 },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98 },
    bounce: {
        scale: [1, 1.08, 0.95, 1.02, 1],
        transition: { duration: 0.4, ease: "easeOut" as const }
    },
    shake: {
        x: [0, -8, 8, -6, 6, -4, 4, 0],
        transition: { duration: 0.4, ease: "easeOut" as const }
    }
};

export default function PuzzleGame({ imageSrc, onMove, onSolved, moves = 0, onShuffle, isSolved: externalIsSolved, isUnlocked = true, isFullscreenMode = false, isBoosted = false }: PuzzleGameProps) {
    const [tiles, setTiles] = useState<number[]>([]);
    const [solved, setSolved] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [animatingTile, setAnimatingTile] = useState<number | null>(null);
    const [shakeIndex, setShakeIndex] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Touch tracking refs
    const touchStartRef = useRef<{ x: number; y: number; index: number } | null>(null);
    const puzzleContainerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const hasNotifiedSolve = useRef(false);  // Prevent duplicate onSolved calls

    // Initialize tiles on mount
    useEffect(() => {
        setTiles(generateSolvableShuffle());
    }, []);

    // Check for win condition
    useEffect(() => {
        if (tiles.length === 9 && isSolvedCheck(tiles) && imageLoaded && !hasNotifiedSolve.current) {
            hasNotifiedSolve.current = true;  // Prevent duplicate calls
            setSolved(true);
            setShowConfetti(true);
            onSolved?.();
            // Hide confetti after some time
            setTimeout(() => setShowConfetti(false), 5000);
        }
    }, [tiles, imageLoaded, onSolved]);

    // Preload image
    useEffect(() => {
        const img = new Image();
        img.onload = () => setImageLoaded(true);
        img.src = imageSrc;
    }, [imageSrc]);

    // Lock body scroll in fullscreen mode
    useEffect(() => {
        if (isFullscreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isFullscreen]);

    // Handle escape key to exit fullscreen
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    // Prevent page scroll during puzzle touch interactions
    useEffect(() => {
        const container = puzzleContainerRef.current;
        if (!container) return;

        const preventScroll = (e: TouchEvent) => {
            if (isDraggingRef.current) {
                e.preventDefault();
            }
        };

        // Use { passive: false } to allow preventDefault
        container.addEventListener('touchmove', preventScroll, { passive: false });

        return () => {
            container.removeEventListener('touchmove', preventScroll);
        };
    }, []);

    const emptyIndex = useMemo(() => tiles.indexOf(8), [tiles]);

    const canMove = useCallback((index: number): boolean => {
        const emptyRow = Math.floor(emptyIndex / 3);
        const emptyCol = emptyIndex % 3;
        const tileRow = Math.floor(index / 3);
        const tileCol = index % 3;

        // Adjacent horizontally or vertically
        return (
            (Math.abs(emptyRow - tileRow) === 1 && emptyCol === tileCol) ||
            (Math.abs(emptyCol - tileCol) === 1 && emptyRow === tileRow)
        );
    }, [emptyIndex]);

    // Get direction from tile to empty slot
    const getDirectionToEmpty = useCallback((index: number): { dx: number; dy: number } | null => {
        if (!canMove(index)) return null;

        const emptyRow = Math.floor(emptyIndex / 3);
        const emptyCol = emptyIndex % 3;
        const tileRow = Math.floor(index / 3);
        const tileCol = index % 3;

        return {
            dx: emptyCol - tileCol, // -1 = left, +1 = right
            dy: emptyRow - tileRow  // -1 = up, +1 = down
        };
    }, [canMove, emptyIndex]);

    const moveTile = useCallback((index: number, showBounce = true) => {
        if (solved || tiles[index] === 8 || !canMove(index)) return false;

        setTiles(prev => {
            const newTiles = [...prev];
            [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
            return newTiles;
        });

        if (showBounce) {
            setAnimatingTile(index);
            setTimeout(() => setAnimatingTile(null), 400);
        }

        onMove?.();
        return true;
    }, [canMove, emptyIndex, solved, onMove, tiles]);

    const handleTileClick = useCallback((index: number) => {
        if (solved || tiles[index] === 8) return;

        if (canMove(index)) {
            moveTile(index);
        } else {
            // Shake animation for invalid move
            setShakeIndex(index);
            setTimeout(() => setShakeIndex(null), 400);
        }
    }, [canMove, solved, moveTile, tiles]);

    // Touch event handlers for swipe
    const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
        if (solved || tiles[index] === 8) return;

        // Set dragging flag to prevent page scroll
        isDraggingRef.current = true;

        const touch = e.touches[0];
        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            index
        };
    }, [solved, tiles]);

    const handleTouchEnd = useCallback((e: React.TouchEvent, index: number) => {
        // Reset dragging flag to allow page scroll again
        isDraggingRef.current = false;

        if (!touchStartRef.current || touchStartRef.current.index !== index) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;

        const threshold = 30; // Minimum swipe distance
        const absDx = Math.abs(deltaX);
        const absDy = Math.abs(deltaY);

        // Determine swipe direction
        if (absDx < threshold && absDy < threshold) {
            // On mobile, ignore taps - only count swipes
            // On desktop, treat as click
            if (!isMobile) {
                handleTileClick(index);
            }
            touchStartRef.current = null;
            return;
        }

        const directionToEmpty = getDirectionToEmpty(index);

        if (!directionToEmpty) {
            // Can't move this tile - shake it
            setShakeIndex(index);
            setTimeout(() => setShakeIndex(null), 400);
            touchStartRef.current = null;
            return;
        }

        // Check if swipe direction matches direction to empty slot
        let swipeMatchesDirection = false;

        if (absDx > absDy) {
            // Horizontal swipe
            if (deltaX > 0 && directionToEmpty.dx > 0) swipeMatchesDirection = true; // Swipe right, empty is right
            if (deltaX < 0 && directionToEmpty.dx < 0) swipeMatchesDirection = true; // Swipe left, empty is left
        } else {
            // Vertical swipe
            if (deltaY > 0 && directionToEmpty.dy > 0) swipeMatchesDirection = true; // Swipe down, empty is down
            if (deltaY < 0 && directionToEmpty.dy < 0) swipeMatchesDirection = true; // Swipe up, empty is up
        }

        if (swipeMatchesDirection) {
            moveTile(index);
        } else {
            // Wrong direction - shake
            setShakeIndex(index);
            setTimeout(() => setShakeIndex(null), 400);
        }

        touchStartRef.current = null;
    }, [handleTileClick, getDirectionToEmpty, moveTile, isMobile]);

    // Get background position for each tile piece
    const getBackgroundPosition = (tileValue: number): string => {
        if (tileValue === 8) return "0 0"; // Empty tile
        const row = Math.floor(tileValue / 3);
        const col = tileValue % 3;
        return `${col * 50}% ${row * 50}%`;
    };

    const toggleFullscreen = async () => {
        const container = document.getElementById('puzzle-fullscreen-container');

        if (!isFullscreen) {
            // Enter fullscreen
            setIsFullscreen(true);
            try {
                if (container?.requestFullscreen) {
                    await container.requestFullscreen();
                } else if ((container as any)?.webkitRequestFullscreen) {
                    // Safari
                    await (container as any).webkitRequestFullscreen();
                }
            } catch (err) {
                // Fullscreen not supported, still use CSS fullscreen
                console.log('Native fullscreen not available, using CSS fullscreen');
            }
        } else {
            // Exit fullscreen
            setIsFullscreen(false);
            try {
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitFullscreenElement) {
                    await (document as any).webkitExitFullscreen();
                }
            } catch (err) {
                console.log('Error exiting fullscreen');
            }
        }
    };

    // Listen for native fullscreen exit (e.g., pressing Escape)
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
                setIsFullscreen(false);
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Tile component with animations
    const renderTile = (tileValue: number, index: number, isFullscreenMode: boolean) => {
        const isEmpty = tileValue === 8;
        const isMovable = canMove(index) && !solved;
        const isAnimating = animatingTile === index;
        const isShaking = shakeIndex === index;

        const tileSize = isFullscreenMode ? "calc((min(85vw, 85vh, 500px) - 8px) / 3)" : "calc((min(90vw, 350px) - 12px) / 3)";

        // Disable layout animation for empty slot
        const shouldAnimate = !isEmpty;

        return (
            <motion.div
                key={`tile-${tileValue}`}
                layout={shouldAnimate}
                layoutId={shouldAnimate ? `tile-${tileValue}` : undefined}
                variants={tileVariants}
                initial="idle"
                animate={isShaking ? "shake" : isAnimating ? "bounce" : "idle"}
                whileHover={isMovable && !isEmpty ? "hover" : undefined}
                whileTap={isMovable && !isEmpty ? "tap" : undefined}
                onClick={() => handleTileClick(index)}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchEnd={(e) => handleTouchEnd(e, index)}
                transition={isEmpty ? { layout: { duration: 0 } } : {
                    layout: {
                        type: "spring",
                        stiffness: 1500,
                        damping: 50
                    }
                }}
                className={`
                    aspect-square overflow-hidden select-none
                    ${isEmpty ? "" : "rounded-sm"}
                    ${isMovable && !isEmpty ? "cursor-pointer" : "cursor-default"}
                    ${!isEmpty ? "shadow-lg" : ""}
                `}
                style={{
                    width: tileSize,
                    height: tileSize,
                    ...(isEmpty ? {
                        background: isFullscreenMode
                            ? "rgba(55, 65, 81, 0.3)"
                            : isBoosted
                                ? "#D1D5DB80"
                                : "rgba(209, 213, 219, 0.5)"
                        // No boxShadow for empty slide
                    } : {
                        backgroundImage: `url(${imageSrc})`,
                        backgroundSize: "300%",
                        backgroundPosition: getBackgroundPosition(tileValue),
                        boxShadow: isMovable
                            ? "0 4px 12px rgba(0, 82, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
                            : "0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)"
                    })
                }}
            >
                {isEmpty && !solved && (
                    <div className={`
                        w-full h-full flex items-center justify-center
                        ${isFullscreenMode ? "text-gray-500" : "text-gray-400 dark:text-gray-500"}
                    `}>
                        <svg className="w-6 h-6 opacity-30" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                    </div>
                )}
            </motion.div>
        );
    };

    if (tiles.length === 0) {
        return (
            <div className="flex items-center justify-center w-full aspect-square max-w-[350px] md:max-w-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Fullscreen mode
    if (isFullscreen) {
        return (
            <div id="puzzle-fullscreen-container" className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center touch-none">
                {showConfetti && (
                    <>
                        <Confetti
                            mode="fall"
                            particleCount={100}
                            colors={["#0052FF", "#50DEF5", "#AE80FF", "#FFD700", "#FF6B6B"]}
                        />
                        <Confetti
                            mode="boom"
                            particleCount={50}
                            effectCount={3}
                            effectInterval={500}
                            colors={["#0052FF", "#50DEF5", "#AE80FF", "#FFD700"]}
                        />
                    </>
                )}

                {/* Close button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsFullscreen(false)}
                    className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[101]"
                >
                    <X size={24} className="text-white" />
                </motion.button>

                {/* Moves counter in fullscreen */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                    <span className="text-white/70 text-sm">Moves:</span>
                    <span className="text-white font-bold text-lg">{moves}</span>
                </div>

                <AnimatePresence>
                    {solved && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                        >
                            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-xl md:text-2xl shadow-2xl">
                                🎉 Congratulations! Puzzle Solved!
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Puzzle grid - larger in fullscreen */}
                <div
                    className="grid grid-cols-3 gap-0.5 p-1 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg shadow-2xl"
                    style={{
                        width: "min(85vw, 85vh, 500px)",
                        height: "min(85vw, 85vh, 500px)",
                        touchAction: "none", // Prevent page scroll when touching puzzle
                    }}
                >
                    {tiles.map((tileValue, index) => renderTile(tileValue, index, true))}
                </div>

                {/* Reference image in fullscreen */}
                <div className="mt-6 flex items-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-xs text-gray-400">Reference:</p>
                        <img
                            src={imageSrc}
                            alt="Reference"
                            className="w-16 h-16 rounded-lg object-cover border border-gray-600 shadow-lg"
                        />
                    </div>

                    {/* Shuffle button in fullscreen */}
                    {onShuffle && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onShuffle}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#50DEF5] via-[#0052FF] to-[#AE80FF] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            {externalIsSolved ? "Play Again" : "Shuffle"}
                        </motion.button>
                    )}
                </div>
            </div>
        );
    }

    // Fullscreen Mode - Just the puzzle grid, parent handles all UI
    if (isFullscreenMode) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div
                    className="grid grid-cols-3 gap-1 p-1.5 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl shadow-2xl w-full h-full"
                    style={{
                        aspectRatio: '1 / 1',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        touchAction: 'none', // Prevent page scroll when touching puzzle
                    }}
                >
                    {tiles.map((tileValue, index) => {
                        const isEmpty = tileValue === 8;
                        const isMovable = canMove(index) && !solved;
                        const isAnimating = animatingTile === index;
                        const isShaking = shakeIndex === index;

                        return (
                            <motion.div
                                key={tileValue}
                                layout
                                variants={tileVariants}
                                animate={isShaking ? "shake" : isAnimating ? "bounce" : "idle"}
                                whileHover={isMovable ? "hover" : undefined}
                                whileTap={isMovable ? "tap" : undefined}
                                onClick={() => handleTileClick(index)}
                                onTouchStart={(e: React.TouchEvent<HTMLDivElement>) => handleTouchStart(e, index)}
                                onTouchEnd={(e: React.TouchEvent<HTMLDivElement>) => handleTouchEnd(e, index)}
                                transition={{
                                    layout: {
                                        type: "spring",
                                        stiffness: 1500,
                                        damping: 50,
                                    },
                                }}
                                className={`
                                    relative rounded-lg overflow-hidden
                                    ${isEmpty ? "bg-gray-800/50" : "shadow-md"}
                                    ${isMovable ? "cursor-pointer ring-2 ring-blue-400/50" : "cursor-default"}
                                    ${solved && !isEmpty ? "ring-2 ring-green-400" : ""}
                                `}
                                style={{
                                    aspectRatio: '1 / 1',
                                    backgroundImage: isEmpty ? "none" : `url(${imageSrc})`,
                                    backgroundSize: "300% 300%",
                                    backgroundPosition: isEmpty ? "0 0" : (() => {
                                        const row = Math.floor(tileValue / 3);
                                        const col = tileValue % 3;
                                        return `${col * 50}% ${row * 50}%`;
                                    })(),
                                }}
                            >
                                {/* Tile number indicator */}
                                {!isEmpty && !solved && (
                                    <div className="absolute top-1 left-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                                        <span className="text-white text-[10px] font-bold">{tileValue + 1}</span>
                                    </div>
                                )}
                                {/* Move indicator */}
                                {isMovable && !isEmpty && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute inset-0 bg-blue-500/10 pointer-events-none"
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Normal mode
    return (
        <div className="relative flex flex-col items-center">
            {showConfetti && (
                <>
                    <Confetti
                        mode="fall"
                        particleCount={100}
                        colors={["#0052FF", "#50DEF5", "#AE80FF", "#FFD700", "#FF6B6B"]}
                    />
                    <Confetti
                        mode="boom"
                        particleCount={50}
                        effectCount={3}
                        effectInterval={500}
                        colors={["#0052FF", "#50DEF5", "#AE80FF", "#FFD700"]}
                    />
                </>
            )}

            <AnimatePresence>
                {solved && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                    >
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-lg md:text-xl shadow-2xl">
                            🎉 Congratulations! Puzzle Solved!
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fullscreen button - HIDDEN
            {isUnlocked && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleFullscreen}
                    className="mb-4 hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#50DEF5] to-[#0052FF] text-white font-medium rounded-lg hover:opacity-90 transition-opacity shadow-md"
                >
                    <Maximize2 size={18} />
                    <span>Fullscreen Mode</span>
                </motion.button>
            )}
            */}

            <div className="relative">
                {/* Desktop fullscreen button - only show when unlocked */}
                {/* {isUnlocked && (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleFullscreen}
                        className="hidden md:flex absolute -top-2 -right-2 z-10 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors"
                        title="Fullscreen Mode"
                    >
                        <Maximize2 size={16} />
                    </motion.button>
                )} */}

                <div
                    ref={puzzleContainerRef}
                    className="grid grid-cols-3 gap-0.5 p-1 rounded-lg shadow-xl"
                    style={{
                        width: "min(90vw, 350px)",
                        maxWidth: "400px",
                        touchAction: "none", // Prevent page scroll when touching puzzle
                        background: isBoosted
                            ? "linear-gradient(to bottom right, #FFDA57, #D7B22F)"
                            : "linear-gradient(to bottom right, rgb(229 231 235), rgb(209 213 219))",
                    }}
                >
                    {tiles.map((tileValue, index) => renderTile(tileValue, index, false))}
                </div>
            </div>

            {/* Reference images removed - now shown in popup only */}
        </div>
    );
}
