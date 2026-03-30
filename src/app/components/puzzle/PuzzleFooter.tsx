"use client";

import { motion } from "framer-motion";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

// Icon paths from /images/puzzle/navbar/
const ICONS = {
    boost: '/images/puzzle/navbar/Lightning.svg',
    leaderboard: '/images/puzzle/navbar/Ranking.svg',
    puzzle: '/images/puzzle/navbar/Puzzle.svg',
    tasks: '/images/puzzle/navbar/CheckSquareOffset.svg',
    prizes: '/images/puzzle/navbar/TreasureChest.svg',
};

export default function PuzzleFooter() {
    const pathname = usePathname();

    const tabs = [
        { id: 'boost', label: 'Boost', icon: ICONS.boost, href: '/puzzle/boost' },
        { id: 'leaderboard', label: 'Leaderboard', icon: ICONS.leaderboard, href: '/puzzle/leaderboard' },
        { id: 'puzzle', label: 'Puzzle', icon: ICONS.puzzle, href: '/puzzle' },
        { id: 'tasks', label: 'Tasks', icon: ICONS.tasks, href: '/puzzle/tasks' },
        { id: 'prizes', label: 'Prizes', icon: ICONS.prizes, href: '/puzzle/prizes' },
    ];

    return (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-40">
            {/* Main footer container */}
            <div
                className="shadow-lg"
                style={{
                    borderRadius: '52px',
                    backgroundColor: '#F9FAFC66',
                    border: '1px solid #E5E7EB',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                }}
            >
                <div className="flex justify-around items-center h-[72px] px-2">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href;

                        return (
                            <Link
                                key={tab.id}
                                href={tab.href}
                                id={`onboarding-nav-${tab.id}`}
                                className="relative flex flex-col items-center justify-center w-full h-full select-none"
                                style={{
                                    WebkitTapHighlightColor: "transparent",
                                }}
                            >
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    className="flex flex-col items-center gap-1"
                                >
                                    {/* Icon with color filter */}
                                    <div
                                        className="relative w-6 h-6"
                                        style={{
                                            filter: isActive
                                                ? 'invert(22%) sepia(99%) saturate(4700%) hue-rotate(213deg) brightness(100%) contrast(101%)'
                                                : 'none'
                                        }}
                                    >
                                        <Image
                                            src={tab.icon}
                                            alt={tab.label}
                                            width={24}
                                            height={24}
                                            className="w-6 h-6"
                                        />
                                    </div>

                                    {/* Label */}
                                    <span className={`text-[10px] font-medium tracking-tight ${isActive ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {tab.label}
                                    </span>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
