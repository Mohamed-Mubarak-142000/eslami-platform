"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "al-manara:kids-sfx:v1";
const listeners = new Set<() => void>();
let context: AudioContext | null = null;

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSfxEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Storage unavailable — keep going silently.
  }
  listeners.forEach((notify) => notify());
}

export function useSfxEnabled(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    readEnabled,
    () => false,
  );
}

function tone(frequency: number, start: number, duration: number, type: OscillatorType = "sine", gain = 0.12) {
  if (!context) return;
  const osc = context.createOscillator();
  const amp = context.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  amp.gain.setValueAtTime(0.0001, context.currentTime + start);
  amp.gain.exponentialRampToValueAtTime(gain, context.currentTime + start + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + duration);
  osc.connect(amp).connect(context.destination);
  osc.start(context.currentTime + start);
  osc.stop(context.currentTime + start + duration + 0.05);
}

function play(notes: [number, number, number][], type: OscillatorType = "sine") {
  if (typeof window === "undefined" || !readEnabled()) return;
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    notes.forEach(([frequency, start, duration]) => tone(frequency, start, duration, type));
  } catch {
    // WebAudio unavailable — sounds are a nicety only.
  }
}

/** Short, gentle synthesized sounds for kids' games (no audio files). */
export const sfx = {
  tap: () => play([[660, 0, 0.08]], "triangle"),
  correct: () =>
    play(
      [
        [523, 0, 0.12],
        [784, 0.1, 0.2],
      ],
      "triangle",
    ),
  wrong: () => play([[220, 0, 0.18]], "sine"),
  flip: () => play([[440, 0, 0.06]], "triangle"),
  win: () =>
    play(
      [
        [523, 0, 0.14],
        [659, 0.12, 0.14],
        [784, 0.24, 0.14],
        [1047, 0.36, 0.3],
      ],
      "triangle",
    ),
};
