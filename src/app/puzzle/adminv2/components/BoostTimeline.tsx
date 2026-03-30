"use client";

interface BoostQueueItem {
    id: string;
    partnerName: string;
    partnerLogo: string;
    duration: number;
    startsAt: string;
    endsAt: string;
    purchasedBy: string;
    amount: number;
    status: 'active' | 'queued' | 'completed';
}

interface BoostTimelineProps {
    queue: BoostQueueItem[];
}

const statusConfig = {
    active: {
        bg: 'bg-green-500',
        border: 'border-green-400',
        glow: 'shadow-green-500/50',
        text: 'text-green-700',
        label: 'ACTIVE',
    },
    queued: {
        bg: 'bg-yellow-500',
        border: 'border-yellow-400',
        glow: '',
        text: 'text-yellow-700',
        label: 'QUEUED',
    },
    completed: {
        bg: 'bg-gray-400',
        border: 'border-gray-300',
        glow: '',
        text: 'text-gray-500',
        label: 'DONE',
    },
};

function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function BoostTimeline({ queue }: BoostTimelineProps) {
    // Guard against undefined or null queue
    if (!queue || !Array.isArray(queue)) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    ⚡ Boost Timeline
                </h3>
                <div className="text-center text-gray-500 py-8">
                    <span className="text-4xl block mb-2">📭</span>
                    No boosts scheduled
                </div>
            </div>
        );
    }

    const sortedQueue = [...queue].sort((a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                ⚡ Boost Timeline
            </h3>

            {sortedQueue.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                    <span className="text-4xl block mb-2">📭</span>
                    No boosts scheduled
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                    <div className="space-y-4">
                        {sortedQueue.map((boost) => {
                            const config = statusConfig[boost.status] || statusConfig.queued;
                            const isActive = boost.status === 'active';

                            return (
                                <div key={boost.id} className="relative pl-10">
                                    {/* Timeline dot */}
                                    <div className={`
                                        absolute left-2 top-4 w-4 h-4 rounded-full 
                                        ${config.bg}
                                        ${isActive ? 'animate-pulse shadow-lg ' + config.glow : ''}
                                    `} />

                                    {/* Card */}
                                    <div className={`
                                        p-3 rounded-lg border ${config.border}
                                        ${isActive
                                            ? 'bg-green-50 dark:bg-green-900/20'
                                            : 'bg-gray-50 dark:bg-gray-700/50'
                                        }
                                    `}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={boost.partnerLogo}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full"
                                                />
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                        {boost.partnerName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {boost.duration}H boost
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`
                                                    px-2 py-0.5 rounded text-xs font-bold
                                                    ${isActive
                                                        ? 'bg-green-100 text-green-700'
                                                        : boost.status === 'queued'
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-gray-100 text-gray-500'
                                                    }
                                                `}>
                                                    {config.label}
                                                </span>
                                                <div className="text-green-600 font-bold text-sm mt-1">
                                                    ${boost.amount}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                            <span>📅 {formatDateTime(boost.startsAt)}</span>
                                            <span>→</span>
                                            <span>{formatDateTime(boost.endsAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
