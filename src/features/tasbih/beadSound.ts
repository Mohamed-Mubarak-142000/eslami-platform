"use client";

let context: AudioContext | null = null;

/** A short wooden click per bead, and a soft two-note chime when a round completes. No audio file. */
export function playBead(completed: boolean) {
  try {
    context ??= new AudioContext();
    // Safari reports "interrupted" (not "suspended") after the app was backgrounded or a call came in.
    if (context.state !== "running") void context.resume();
    const now = context.currentTime;
    const notes: (readonly [number, number, number])[] = completed
      ? [
          [660, 0, 0.35],
          [880, 0.12, 0.5],
        ]
      : [[1400, 0, 0.05]];
    for (const [frequency, start, length] of notes) {
      const osc = context.createOscillator();
      const amp = context.createGain();
      osc.type = completed ? "sine" : "triangle";
      osc.frequency.value = frequency;
      amp.gain.setValueAtTime(0.0001, now + start);
      amp.gain.exponentialRampToValueAtTime(completed ? 0.2 : 0.12, now + start + 0.005);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
      osc.connect(amp).connect(context.destination);
      osc.start(now + start);
      osc.stop(now + start + length + 0.02);
    }
  } catch {
    // WebAudio unavailable: counting works silently.
  }
}

/** Browsers only allow sound after a user gesture: call this from the click that turns sound on. */
export function unlockBead() {
  try {
    context ??= new AudioContext();
    if (context.state !== "running") void context.resume();
  } catch {
    // Ignore: sound is a nicety.
  }
}
