"use client";

let context: AudioContext | null = null;

/** Two short falling notes, like a notification error, plus a buzz on phones. No audio file. */
export function playErrorTone() {
  if (typeof window === "undefined") return;
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    const now = context.currentTime;
    for (const [frequency, start] of [
      [587, 0],
      [392, 0.16],
    ] as const) {
      const osc = context.createOscillator();
      const amp = context.createGain();
      osc.type = "triangle";
      osc.frequency.value = frequency;
      amp.gain.setValueAtTime(0.0001, now + start);
      amp.gain.exponentialRampToValueAtTime(0.25, now + start + 0.02);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.22);
      osc.connect(amp).connect(context.destination);
      osc.start(now + start);
      osc.stop(now + start + 0.26);
    }
  } catch {
    // WebAudio unavailable: the dialog still shows.
  }
  navigator.vibrate?.([120, 60, 120]);
}

/** Browsers only allow sound after a user gesture: call this from the click that starts the mic. */
export function unlockErrorTone() {
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
  } catch {
    // Ignore: sound is a nicety.
  }
}
