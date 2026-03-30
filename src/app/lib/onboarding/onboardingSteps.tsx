import type { Tour } from 'nextstepjs';

// ═══════════════════════════════════════════════════
// DESKTOP Tour — 12 steps (targets navbar links)
// ═══════════════════════════════════════════════════
const desktopTour: Tour = {
    tour: 'qrbase-puzzle-desktop',
    steps: [
        {
            icon: '🧩',
            title: 'Welcome to QrBase Puzzle!',
            content: (
                <p>
                    Solve sliding puzzles, earn <strong>$SCAN tokens</strong>, and
                    compete on the leaderboard. Let&apos;s show you around! 🚀
                </p>
            ),
            side: 'top',
            showControls: true,
            showSkip: true,
            pointerPadding: 0,
            pointerRadius: 0,
        },
        {
            icon: '🧩',
            title: 'The Puzzle Board',
            content: (
                <p>
                    This is your 3×3 sliding puzzle. Rearrange the pieces to match
                    the original image before time runs out!
                </p>
            ),
            selector: '#onboarding-puzzle-board',
            side: 'bottom',
            showControls: true,
            showSkip: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: '⏱️',
            title: 'Timer & Prize',
            content: (
                <p>
                    The countdown timer shows your remaining time. Solve the
                    puzzle before it hits zero to win <strong>10K $SCAN</strong>!
                </p>
            ),
            selector: '#onboarding-timer',
            side: 'bottom',
            showControls: true,
            showSkip: true,
            pointerPadding: 8,
            pointerRadius: 24,
        },
        {
            icon: '📊',
            title: 'Your Stats',
            content: (
                <p>
                    Track your <strong>moves</strong>, your current <strong>level</strong> (higher
                    levels = more time), and your remaining <strong>hearts</strong> (attempts).
                </p>
            ),
            selector: '#onboarding-stats',
            side: 'top',
            showControls: true,
            showSkip: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: '🛒',
            title: 'Get More Attempts',
            content: (
                <p>
                    Ran out of hearts? Buy more attempts with <strong>$SCAN
                    tokens</strong> to keep playing without waiting for the reset.
                </p>
            ),
            selector: '#onboarding-attempts',
            side: 'top',
            showControls: true,
            showSkip: true,
            pointerPadding: 4,
            pointerRadius: 12,
        },
        {
            icon: '✅',
            title: 'Earn Free Attempts',
            content: (
                <p>
                    Complete social tasks — like, repost, follow — to earn
                    <strong> free extra attempts</strong>. Check the Tasks tab!
                </p>
            ),
            selector: '#desktop-nav-tasks',
            side: 'bottom',
            showControls: true,
            showSkip: true,
            pointerPadding: 8,
            pointerRadius: 8,
        },
        {
            icon: '🏆',
            title: 'Prize Pool',
            content: (
                <p>
                    View the current prize pool of partner tokens. Win puzzles,
                    collect rewards!
                </p>
            ),
            selector: '#desktop-nav-prizes',
            side: 'bottom',
            showControls: true,
            showSkip: true,
            pointerPadding: 8,
            pointerRadius: 8,
        },
        {
            icon: '⚡',
            title: 'Boost Your Rewards',
            content: (
                <p>
                    Boost a partner token to multiply your puzzle rewards.
                    Active boosts appear as a golden tag!
                </p>
            ),
            selector: '#desktop-nav-boost',
            side: 'bottom',
            showControls: true,
            showSkip: true,
            pointerPadding: 8,
            pointerRadius: 8,
        },
        {
            icon: '👑',
            title: 'Leaderboard',
            content: (
                <p>
                    See the top puzzle solvers and where you rank. Climb the
                    leaderboard by winning more puzzles!
                </p>
            ),
            selector: '#desktop-nav-leaderboard',
            side: 'bottom',
            showControls: true,
            showSkip: true,
            pointerPadding: 8,
            pointerRadius: 8,
        },
        {
            icon: '💰',
            title: '$SCAN Balance',
            content: (
                <p>
                    Your <strong>$SCAN token balance</strong> is shown here in
                    the navbar. Win puzzles and complete tasks to earn more!
                </p>
            ),
            selector: '#onboarding-scan-balance',
            side: 'bottom',
            showControls: true,
            showSkip: true,
            pointerPadding: 8,
            pointerRadius: 20,
        },
        {
            icon: '👤',
            title: 'Your Profile',
            content: (
                <p>
                    Tap your avatar to access your profile, stats, referral
                    link, and logout option.
                </p>
            ),
            selector: '#onboarding-profile',
            side: 'bottom',
            showControls: true,
            showSkip: true,
            pointerPadding: 8,
            pointerRadius: 20,
        },
        {
            icon: '🚀',
            title: 'Ready to Play!',
            content: (
                <p>
                    You&apos;re all set! Hit the <strong>Play Now</strong> button
                    to start solving puzzles and earning $SCAN. Good luck! 🎯
                </p>
            ),
            side: 'top',
            showControls: true,
            showSkip: false,
            pointerPadding: 0,
            pointerRadius: 0,
        },
    ],
};

// ═══════════════════════════════════════════════════
// MOBILE Tour — 6 steps (avoids edge/corner elements)
// ═══════════════════════════════════════════════════
const mobileTour: Tour = {
    tour: 'qrbase-puzzle-mobile',
    steps: [
        {
            icon: '🧩',
            title: 'Welcome to QrBase Puzzle!',
            content: (
                <p>
                    Solve sliding puzzles, earn <strong>$SCAN tokens</strong>, and
                    compete on the leaderboard. Let&apos;s show you around! 🚀
                </p>
            ),
            side: 'top',
            showControls: true,
            showSkip: true,
            pointerPadding: 0,
            pointerRadius: 0,
        },
        {
            icon: '🧩',
            title: 'The Puzzle Board',
            content: (
                <p>
                    This is your 3×3 sliding puzzle. Rearrange the pieces to
                    match the original image before time runs out!
                </p>
            ),
            selector: '#onboarding-puzzle-board',
            side: 'bottom',
            showControls: true,
            showSkip: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: '⏱️',
            title: 'Timer & Prize',
            content: (
                <p>
                    The countdown shows your remaining time. Solve it
                    before zero to win <strong>10K $SCAN</strong>!
                </p>
            ),
            selector: '#onboarding-timer',
            side: 'bottom',
            showControls: true,
            showSkip: true,
            pointerPadding: 8,
            pointerRadius: 24,
        },
        {
            icon: '📊',
            title: 'Stats & Attempts',
            content: (
                <p>
                    Track your <strong>moves</strong>, <strong>level</strong>, and
                    remaining <strong>hearts</strong>. Buy more attempts or
                    complete tasks to earn free ones!
                </p>
            ),
            selector: '#onboarding-stats',
            side: 'top',
            showControls: true,
            showSkip: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: '🗺️',
            title: 'Explore More!',
            content: (
                <p>
                    Use the bottom navigation to discover <strong>Tasks</strong> (earn
                    free attempts), <strong>Prizes</strong>, <strong>Boost</strong> (multiply
                    rewards), and the <strong>Leaderboard</strong>.
                </p>
            ),
            side: 'top',
            showControls: true,
            showSkip: true,
            pointerPadding: 0,
            pointerRadius: 0,
        },
        {
            icon: '🚀',
            title: 'Ready to Play!',
            content: (
                <p>
                    You&apos;re all set! Hit <strong>Play Now</strong> to start
                    solving puzzles and earning $SCAN. Good luck! 🎯
                </p>
            ),
            side: 'top',
            showControls: true,
            showSkip: false,
            pointerPadding: 0,
            pointerRadius: 0,
        },
    ],
};

export const onboardingTours: Tour[] = [desktopTour, mobileTour];
