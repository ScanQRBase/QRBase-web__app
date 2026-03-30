'use client';

import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundMuted, toggleSoundMute } from '../../lib/game/useSoundEffects';

/**
 * Mute / Unmute toggle button for puzzle sound effects.
 * Reads from localStorage and listens for cross-component updates
 * via the "soundMuteChanged" custom event.
 */
export default function SoundToggle() {
    const [muted, setMuted] = useState(false);

    useEffect(() => {
        // Sync with persisted state on mount
        setMuted(isSoundMuted());

        const handler = (e: Event) => {
            setMuted((e as CustomEvent<boolean>).detail);
        };
        window.addEventListener('soundMuteChanged', handler);
        return () => window.removeEventListener('soundMuteChanged', handler);
    }, []);

    return (
        <button
            onClick={() => toggleSoundMute()}
            className="flex items-center justify-center rounded-full p-1 transition-colors hover:bg-white/20"
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            title={muted ? 'Unmute sound effects' : 'Mute sound effects'}
        >
            {muted ? (
                <VolumeX className="h-4 w-4 sm:h-5 sm:w-5 text-white/70" />
            ) : (
                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            )}
        </button>
    );
}
