"use client";

import { useCallback, useRef } from "react";

/**
 * Sound effects for the puzzle game — 100 % Web Audio API (no MP3 files).
 *
 * Synthesized sounds:
 *   move  – short click / pop
 *   win   – happy ascending arpeggio
 *   loss  – sad descending tone
 *   claim – bright coin / cash-register chime
 *   countdownBeep – pitch-ramping square beep
 *
 * Background music has been removed.
 * playBgMusic / stopBgMusic / dimBgMusic / restoreBgMusic are kept as
 * no-ops so callers don't need to change.
 */

const MUTE_KEY = "qrbase-sound-muted";

/** Check if sound is currently muted */
export function isSoundMuted(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(MUTE_KEY) === "1";
}

/** Toggle mute state and dispatch event for listeners */
export function toggleSoundMute(): boolean {
    const next = !isSoundMuted();
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    window.dispatchEvent(new CustomEvent("soundMuteChanged", { detail: next }));
    return next;
}

export function useSoundEffects() {
    const ctxRef = useRef<AudioContext | null>(null);

    const getCtx = useCallback(() => {
        if (!ctxRef.current) {
            ctxRef.current = new AudioContext();
        }
        if (ctxRef.current.state === "suspended") {
            ctxRef.current.resume();
        }
        return ctxRef.current;
    }, []);

    // ── Synthesised sound helpers ────────────────────────────────────

    /** Short click / pop for puzzle piece moves */
    const playMove = useCallback(() => {
        if (isSoundMuted()) return;
        try {
            const ctx = getCtx();
            const t = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);
            gain.gain.setValueAtTime(0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.08);
        } catch { /* non-critical */ }
    }, [getCtx]);

    /** Triumphant fanfare chord for win — rich C-major triad with warm detuning */
    const playWin = useCallback(() => {
        if (isSoundMuted()) return;
        try {
            const ctx = getCtx();
            const t = ctx.currentTime;

            // Quick rising arpeggio lead-in (C5 → E5 → G5)
            const leadNotes = [523.25, 659.25, 783.99];
            leadNotes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, t + i * 0.09);
                gain.gain.setValueAtTime(0, t + i * 0.09);
                gain.gain.linearRampToValueAtTime(0.28, t + i * 0.09 + 0.015);
                gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.18);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t + i * 0.09);
                osc.stop(t + i * 0.09 + 0.2);
            });

            // Full C-major chord hits at t+0.27 — three slightly-detuned oscillators per note
            const chordNotes = [
                { freq: 523.25, detune: 4 },   // C5
                { freq: 659.25, detune: -3 },  // E5
                { freq: 783.99, detune: 5 },   // G5
                { freq: 1046.5, detune: -2 },  // C6
            ];
            const chordStart = t + 0.27;
            chordNotes.forEach(({ freq, detune }) => {
                [
                    { type: "sine" as OscillatorType, vol: 0.22 },
                    { type: "triangle" as OscillatorType, vol: 0.10, extra: detune },
                ].forEach(({ type, vol, extra = 0 }) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = type;
                    osc.frequency.setValueAtTime(freq + extra, chordStart);
                    gain.gain.setValueAtTime(0, chordStart);
                    gain.gain.linearRampToValueAtTime(vol, chordStart + 0.025);
                    gain.gain.setValueAtTime(vol, chordStart + 0.35);
                    gain.gain.exponentialRampToValueAtTime(0.001, chordStart + 1.1);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(chordStart);
                    osc.stop(chordStart + 1.15);
                });
            });
        } catch { /* non-critical */ }
    }, [getCtx]);

    /** Sad descending tone for loss */
    const playLoss = useCallback(() => {
        if (isSoundMuted()) return;
        try {
            const ctx = getCtx();
            const t = ctx.currentTime;
            const notes = [392, 349.23, 293.66]; // G4 F4 D4

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, t + i * 0.18);
                gain.gain.setValueAtTime(0, t + i * 0.18);
                gain.gain.linearRampToValueAtTime(0.35, t + i * 0.18 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.18 + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t + i * 0.18);
                osc.stop(t + i * 0.18 + 0.35);
            });
        } catch { /* non-critical */ }
    }, [getCtx]);

    /** Money / coins sound for claim — "cha-ching" + coin cascade + bell ring */
    const playClaim = useCallback(() => {
        if (isSoundMuted()) return;
        try {
            const ctx = getCtx();
            const t = ctx.currentTime;

            // ── "Cha" — low mechanical thud (sawtooth noise burst, ~80Hz) ──
            const thud = ctx.createOscillator();
            const thudGain = ctx.createGain();
            thud.type = "sawtooth";
            thud.frequency.setValueAtTime(80, t);
            thud.frequency.exponentialRampToValueAtTime(40, t + 0.06);
            thudGain.gain.setValueAtTime(0.3, t);
            thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
            thud.connect(thudGain);
            thudGain.connect(ctx.destination);
            thud.start(t);
            thud.stop(t + 0.08);

            // ── Coin tinks — 6 rapid metallic hits at inharmonic coin freqs ──
            // Real coins resonate in the 2000–3500 Hz range with inharmonic partials
            const coinFreqs = [2637, 3136, 2093, 3520, 2349, 2960]; // inharmonic spread
            coinFreqs.forEach((freq, i) => {
                const offset = i * 0.033; // cascade over ~165ms
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, t + offset);
                // slight pitch drop on each hit (coin settling)
                osc.frequency.exponentialRampToValueAtTime(freq * 0.92, t + offset + 0.08);
                gain.gain.setValueAtTime(0, t + offset);
                gain.gain.linearRampToValueAtTime(0.18, t + offset + 0.004); // sharp attack
                gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.18); // metallic decay
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t + offset);
                osc.stop(t + offset + 0.2);
            });

            // ── "Ching" — bright cash-register bell ring (C7, 2093 Hz) ──
            const bell = ctx.createOscillator();
            const bellGain = ctx.createGain();
            bell.type = "sine";
            bell.frequency.setValueAtTime(2093, t + 0.05); // C7
            bellGain.gain.setValueAtTime(0, t + 0.05);
            bellGain.gain.linearRampToValueAtTime(0.35, t + 0.06);
            bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.75); // long ring-out
            bell.connect(bellGain);
            bellGain.connect(ctx.destination);
            bell.start(t + 0.05);
            bell.stop(t + 0.8);

            // ── Bell overtone (2nd harmonic) for richness ──
            const bell2 = ctx.createOscillator();
            const bell2Gain = ctx.createGain();
            bell2.type = "sine";
            bell2.frequency.setValueAtTime(4186, t + 0.05); // C8
            bell2Gain.gain.setValueAtTime(0, t + 0.05);
            bell2Gain.gain.linearRampToValueAtTime(0.1, t + 0.06);
            bell2Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            bell2.connect(bell2Gain);
            bell2Gain.connect(ctx.destination);
            bell2.start(t + 0.05);
            bell2.stop(t + 0.45);
        } catch { /* non-critical */ }
    }, [getCtx]);

    // ── Background Music (no-ops — MP3 removed) ─────────────────────

    const playBgMusic = useCallback(() => { }, []);
    const stopBgMusic = useCallback(() => { }, []);
    const dimBgMusic = useCallback(() => { }, []);
    const restoreBgMusic = useCallback(() => { }, []);

    // ── Countdown Beep (synthesized — unchanged) ─────────────────────

    /**
     * Countdown beep — pitch ramps 800→1600Hz as seconds decrease.
     * Double-beep at 1 second for urgency.
     */
    const playCountdownBeep = useCallback((secondsLeft: number) => {
        if (isSoundMuted()) return;
        try {
            const ctx = getCtx();
            const freq = 800 + ((10 - secondsLeft) / 9) * 800;
            const vol = 0.25 + ((10 - secondsLeft) / 9) * 0.15;

            const beep = (offset: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "square";
                osc.frequency.setValueAtTime(freq, ctx.currentTime + offset);
                gain.gain.setValueAtTime(0, ctx.currentTime + offset);
                gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + offset + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + offset);
                osc.stop(ctx.currentTime + offset + 0.1);
            };

            beep(0);
            if (secondsLeft <= 1) beep(0.12);
        } catch { /* non-critical */ }
    }, [getCtx]);

    return {
        playMove,
        playWin,
        playLoss,
        playClaim,
        playBgMusic,
        stopBgMusic,
        dimBgMusic,
        restoreBgMusic,
        playCountdownBeep,
    };
}