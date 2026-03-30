"use client";

interface Player {
    userId: string;
    displayName: string | null;
    winsAllTime: number;
    totalPlays: number;
}

interface LeaderboardRankingProps {
    players: Player[];
    onPlayerClick?: (userId: string) => void;
    maxWins?: number;
}

const medals = ['🥇', '🥈', '🥉'];

export default function LeaderboardRanking({ players, onPlayerClick, maxWins }: LeaderboardRankingProps) {
    const topWins = maxWins || Math.max(...players.map(p => p.winsAllTime), 1);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                🏆 Top Players
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {players.map((player, idx) => {
                    const winPercentage = (player.winsAllTime / topWins) * 100;
                    const winRate = player.totalPlays > 0
                        ? ((player.winsAllTime / player.totalPlays) * 100).toFixed(0)
                        : '0';

                    return (
                        <div
                            key={player.userId}
                            onClick={() => onPlayerClick?.(player.userId)}
                            className={`
                                relative p-3 rounded-lg cursor-pointer
                                transition-all duration-200
                                ${idx < 3
                                    ? 'bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-800 border border-yellow-200 dark:border-yellow-800'
                                    : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }
                                hover:scale-[1.02] hover:shadow-md
                            `}
                        >
                            <div className="flex items-center gap-3">
                                {/* Rank */}
                                <div className="w-8 text-center">
                                    {idx < 3 ? (
                                        <span className="text-2xl">{medals[idx]}</span>
                                    ) : (
                                        <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                                    )}
                                </div>

                                {/* Player info */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 dark:text-white truncate">
                                        {player.displayName || player.userId.slice(0, 15) + '...'}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>{player.totalPlays} plays</span>
                                        <span className="text-green-500">{winRate}% win rate</span>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                                            style={{ width: `${winPercentage}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Wins count */}
                                <div className="text-right">
                                    <div className="text-xl font-bold text-green-600">{player.winsAllTime}</div>
                                    <div className="text-xs text-gray-500">wins</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {players.length === 0 && (
                    <div className="text-center text-gray-500 py-8">No players yet</div>
                )}
            </div>
        </div>
    );
}
