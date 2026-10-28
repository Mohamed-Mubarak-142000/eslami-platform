"use client";

import { useSyncExternalStore } from "react";
import type { Ambience } from "./seerahContent";

/*
 * The seerah's sounds, synthesized in the browser with WebAudio like the kids' games: no recordings,
 * nothing to license or download. Two kinds:
 *
 * - Ambience: wind, crickets, waves, a crowd's murmur and birdsong, each a layer that fades in or out
 *   with where the story is.
 * - Effects: a chime, a swish of sand, camel bells, a rumble, a short fanfare.
 *
 * Off until the reader turns it on (browsers allow audio only after a tap anyway); the choice is
 * remembered. Quiet when the tab is hidden.
 */

const STORAGE_KEY = "al-manara:seerah-sound:v1";
const LEVELS: Record<Ambience, number> = { wind: 0.22, crickets: 0.05, waves: 0.32, crowd: 0.1, birds: 0.05 };
const listeners = new Set<() => void>();

let enabled = false;
let context: AudioContext | null = null;
let master: GainNode | null = null;
const layers = new Map<Ambience, GainNode>();
const timers: number[] = [];
let wanted: Ambience[] = [];

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

if (typeof window !== "undefined") {
  enabled = readEnabled();
  document.addEventListener("visibilitychange", () => {
    if (!context) return;
    if (document.hidden) void context.suspend();
    else if (enabled) void context.resume();
  });
}

export function useSeerahSound(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => enabled,
    () => false,
  );
}

/** Turned on from a tap, which is what lets the browser start the audio. */
export function setSeerahSound(next: boolean) {
  enabled = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // Storage unavailable: on for this visit only.
  }
  if (next) {
    start();
    setAmbience(wanted);
  } else if (context) {
    master?.gain.setTargetAtTime(0, context.currentTime, 0.2);
  }
  listeners.forEach((notify) => notify());
}

/** Two seconds of noise: white, or brown (integrated, deeper) for wind and sea. */
function noise(kind: "white" | "brown"): AudioBuffer {
  const buffer = context!.createBuffer(1, context!.sampleRate * 2, context!.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let index = 0; index < data.length; index++) {
    const white = Math.random() * 2 - 1;
    if (kind === "white") data[index] = white;
    else {
      last = (last + 0.02 * white) / 1.02;
      data[index] = last * 3.5;
    }
  }
  return buffer;
}

function loop(buffer: AudioBuffer): AudioBufferSourceNode {
  const source = context!.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.start();
  return source;
}

/** A slow wobble on some parameter: gusts of wind, the swell of the sea. */
function lfo(rate: number, depth: number, target: AudioParam) {
  const osc = context!.createOscillator();
  const amount = context!.createGain();
  osc.frequency.value = rate;
  amount.gain.value = depth;
  osc.connect(amount).connect(target);
  osc.start();
}

function layer(name: Ambience): GainNode {
  const gain = context!.createGain();
  gain.gain.value = 0;
  gain.connect(master!);
  layers.set(name, gain);
  return gain;
}

/** A short tone with a soft attack and an exponential tail. */
function tone(frequency: number, at: number, length: number, level: number, type: OscillatorType = "sine", destination?: AudioNode) {
  if (!context || !master) return;
  const osc = context.createOscillator();
  const amp = context.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(level, at + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(amp).connect(destination ?? master);
  osc.start(at);
  osc.stop(at + length + 0.05);
}

function start() {
  if (context) {
    void context.resume();
    master!.gain.setTargetAtTime(0.7, context.currentTime, 0.3);
    return;
  }
  const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  context = new Context();
  // Some browsers start it suspended even inside the tap; ask for it to run.
  void context.resume();
  master = context.createGain();
  master.gain.value = 0.7;
  master.connect(context.destination);
  const white = noise("white");
  const brown = noise("brown");

  // Wind: deep noise through a low-pass whose opening breathes.
  const windFilter = context.createBiquadFilter();
  windFilter.type = "lowpass";
  windFilter.frequency.value = 420;
  loop(brown).connect(windFilter).connect(layer("wind"));
  lfo(0.07, 220, windFilter.frequency);

  // The sea: the same deep noise, swelling and falling every eight seconds or so.
  const seaFilter = context.createBiquadFilter();
  seaFilter.type = "lowpass";
  seaFilter.frequency.value = 800;
  const swell = context.createGain();
  swell.gain.value = 0.55;
  loop(brown).connect(seaFilter).connect(swell).connect(layer("waves"));
  lfo(0.12, 0.45, swell.gain);

  // A crowd: voices' band of noise, its loudness wandering.
  const crowdFilter = context.createBiquadFilter();
  crowdFilter.type = "bandpass";
  crowdFilter.frequency.value = 620;
  crowdFilter.Q.value = 0.9;
  const murmur = context.createGain();
  murmur.gain.value = 0.6;
  loop(white).connect(crowdFilter).connect(murmur).connect(layer("crowd"));
  lfo(0.31, 0.25, murmur.gain);
  lfo(0.53, 0.15, murmur.gain);

  // Crickets: little trills of a high tone at random.
  const crickets = layer("crickets");
  timers.push(
    window.setInterval(() => {
      if (!context || crickets.gain.value < 0.005 || Math.random() > 0.55) return;
      const at = context.currentTime + Math.random() * 0.1;
      const pitch = 4200 + Math.random() * 600;
      for (let pulse = 0; pulse < 3; pulse++) tone(pitch, at + pulse * 0.045, 0.03, 0.6, "sine", crickets);
    }, 240),
  );

  // Birds: a two- or three-note chirp now and then.
  const birds = layer("birds");
  timers.push(
    window.setInterval(() => {
      if (!context || birds.gain.value < 0.005 || Math.random() > 0.35) return;
      const at = context.currentTime;
      const base = 2400 + Math.random() * 900;
      const notes = 2 + Math.floor(Math.random() * 2);
      for (let note = 0; note < notes; note++) {
        const osc = context.createOscillator();
        const amp = context.createGain();
        const t = at + note * 0.14;
        osc.frequency.setValueAtTime(base, t);
        osc.frequency.exponentialRampToValueAtTime(base * 1.35, t + 0.06);
        osc.frequency.exponentialRampToValueAtTime(base * 1.1, t + 0.11);
        amp.gain.setValueAtTime(0.0001, t);
        amp.gain.exponentialRampToValueAtTime(0.7, t + 0.01);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        osc.connect(amp).connect(birds);
        osc.start(t);
        osc.stop(t + 0.15);
      }
    }, 1400),
  );
}

/** Which layers the place calls for; the rest fade away. */
export function setAmbience(next: Ambience[]) {
  wanted = next;
  if (!enabled || !context) return;
  const now = context.currentTime;
  for (const [name, gain] of layers) gain.gain.setTargetAtTime(next.includes(name) ? LEVELS[name] : 0, now, 0.8);
}

function now(): number | null {
  if (!enabled || !context) return null;
  return context.currentTime;
}

export const seerahSfx = {
  /** A note opened, an answer right. */
  chime() {
    const at = now();
    if (at === null) return;
    tone(880, at, 1.2, 0.16);
    tone(1318.5, at + 0.06, 0.9, 0.08);
  },
  wrong() {
    const at = now();
    if (at === null || !context || !master) return;
    const osc = context.createOscillator();
    const amp = context.createGain();
    osc.frequency.setValueAtTime(240, at);
    osc.frequency.exponentialRampToValueAtTime(170, at + 0.3);
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(0.14, at + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
    osc.connect(amp).connect(master);
    osc.start(at);
    osc.stop(at + 0.4);
  },
  /** Sand brushed away. */
  swish() {
    const at = now();
    if (at === null || !context || !master) return;
    const source = context.createBufferSource();
    source.buffer = noise("white");
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2400;
    const amp = context.createGain();
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(0.12, at + 0.05);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
    source.connect(filter).connect(amp).connect(master);
    source.start(at);
    source.stop(at + 0.3);
  },
  /** Camel bells as the travellers move off. */
  bells() {
    const at = now();
    if (at === null) return;
    for (let ring = 0; ring < 6; ring++) {
      const t = at + ring * 0.32 + Math.random() * 0.05;
      tone(1650 + Math.random() * 120, t, 0.35, 0.05);
      tone(2480 + Math.random() * 160, t, 0.25, 0.025);
    }
  },
  /** Ground giving way under hooves. */
  rumble() {
    const at = now();
    if (at === null || !context || !master) return;
    const source = context.createBufferSource();
    source.buffer = noise("brown");
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 160;
    const amp = context.createGain();
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(0.6, at + 0.15);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + 1.2);
    source.connect(filter).connect(amp).connect(master);
    source.start(at);
    source.stop(at + 1.3);
  },
  /** A gust of wind rising and dying away. */
  gust() {
    const at = now();
    if (at === null || !context || !master) return;
    const source = context.createBufferSource();
    source.buffer = noise("brown");
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(300, at);
    filter.frequency.linearRampToValueAtTime(1400, at + 1);
    filter.frequency.linearRampToValueAtTime(300, at + 2.4);
    const amp = context.createGain();
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(0.7, at + 0.9);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + 2.5);
    source.connect(filter).connect(amp).connect(master);
    source.start(at);
    source.stop(at + 2.6);
  },
  /** The chapter's badge. */
  fanfare() {
    const at = now();
    if (at === null) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) =>
      tone(frequency, at + index * 0.13, index === 3 ? 0.9 : 0.25, 0.12, "triangle"),
    );
  },
};
