"use client";

/**
 * A soft bell chime for a new nafha, synthesised with the Web Audio API (no audio file to load).
 *
 * Browsers only let a page make sound after the visitor has interacted with it, so the audio context is
 * created/resumed on the first tap, click or key press. Before that, playChime() stays silent.
 */
let ctx: AudioContext | null = null;
let armed = false;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  return ctx;
}

/** Unlocks audio on the visitor's first interaction so a later chime is allowed to play. */
export function armChime() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const unlock = () => {
    const audio = getContext();
    if (audio && audio.state === "suspended") void audio.resume().catch(() => {});
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("touchstart", unlock);
  };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
  window.addEventListener("touchstart", unlock, { passive: true });
}

/** One bell strike: a fundamental plus a few soft partials, each fading out. */
function strike(audio: AudioContext, freq: number, start: number, gain: number) {
  const partials: [ratio: number, level: number, decay: number][] = [
    [1, 1, 1.6],
    [2, 0.35, 1.0],
    [3, 0.15, 0.6],
    [4.2, 0.08, 0.4],
  ];
  for (const [ratio, level, decay] of partials) {
    const osc = audio.createOscillator();
    const env = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * ratio;
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(gain * level, start + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, start + decay);
    osc.connect(env).connect(audio.destination);
    osc.start(start);
    osc.stop(start + decay + 0.05);
  }
}

/** Plays a short two-note "ding-dong" and, on phones that support it, a light vibration. */
export function playChime() {
  try {
    navigator.vibrate?.([120, 80, 120]);
  } catch {}

  const audio = getContext();
  if (!audio) return;
  const play = () => {
    const now = audio.currentTime + 0.02;
    strike(audio, 1318.5, now, 0.22); // E6
    strike(audio, 987.8, now + 0.22, 0.22); // B5
  };
  if (audio.state === "running") play();
  else
    void audio
      .resume()
      .then(() => audio.state === "running" && play())
      .catch(() => {});
}
