/** Buffering this long without sound counts as a dead stream. */
const STALL_MS = 12_000;
/** Every stream is down: wait this long, then go round them again. */
const RETRY_MS = 20_000;
/** While on a backup, check the official stream this often. */
const PROBE_EVERY_MS = 3 * 60_000;
const PROBE_TIMEOUT_MS = 10_000;

export interface RadioFailoverEvents {
  /** A stream is being tried; 0 is the official one, higher indexes are backups. */
  onSourceChange: (index: number) => void;
  /** Every stream failed; it retries on its own. */
  onAllDown: () => void;
  /** The browser refused to start playback (no user gesture), so there's nothing to retry. */
  onBlocked: () => void;
}

export interface RadioFailover {
  start: () => void;
  stop: () => void;
  /** Wire to the audio element's waiting/stalled, playing, error and pause events. */
  onWaiting: () => void;
  onPlaying: () => void;
  onError: () => void;
  onPause: () => void;
}

/**
 * Keeps the live radio playing: when a stream errors or stalls it moves to the next one, and while on
 * a backup it keeps checking the official stream and switches back as soon as that answers again.
 */
export function createRadioFailover(audio: HTMLAudioElement, streams: readonly string[], events: RadioFailoverEvents): RadioFailover {
  let active = false;
  let index = 0;
  // Bumped on every switch so late events from an abandoned stream are ignored.
  let attempt = 0;
  let ignoreNextPause = false;
  let stallTimer: number | undefined;
  let retryTimer: number | undefined;
  let probeTimer: number | undefined;
  let probe: HTMLAudioElement | null = null;

  function endProbe(target: HTMLAudioElement | null = probe) {
    if (!target) return;
    target.pause();
    target.removeAttribute("src");
    target.load();
    if (probe === target) probe = null;
  }

  function clearTimers() {
    window.clearTimeout(stallTimer);
    window.clearTimeout(retryTimer);
    window.clearInterval(probeTimer);
    stallTimer = retryTimer = probeTimer = undefined;
    endProbe();
  }

  function armStall(current: number) {
    window.clearTimeout(stallTimer);
    stallTimer = window.setTimeout(() => fail(current), STALL_MS);
  }

  function playFrom(next: number) {
    clearTimers();
    active = true;
    index = next;
    const current = ++attempt;
    events.onSourceChange(index);
    audio.src = streams[index] ?? "";
    armStall(current);
    audio.play().catch((error: unknown) => {
      if (current !== attempt) return;
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        stop();
        events.onBlocked();
        return;
      }
      fail(current);
    });
  }

  function fail(current: number) {
    if (!active || current !== attempt) return;
    if (index + 1 < streams.length) {
      playFrom(index + 1);
      return;
    }
    clearTimers();
    attempt++;
    if (!audio.paused) {
      ignoreNextPause = true;
      audio.pause();
    }
    events.onAllDown();
    retryTimer = window.setTimeout(() => active && playFrom(0), RETRY_MS);
  }

  function checkOfficialStream() {
    if (probe || !active || index === 0) return;
    const candidate = new Audio();
    probe = candidate;
    candidate.muted = true;
    candidate.preload = "auto";
    const timeout = window.setTimeout(() => endProbe(candidate), PROBE_TIMEOUT_MS);
    const discard = () => {
      window.clearTimeout(timeout);
      endProbe(candidate);
    };
    candidate.addEventListener(
      "playing",
      () => {
        discard();
        if (active && index > 0) playFrom(0);
      },
      { once: true },
    );
    candidate.addEventListener("error", discard, { once: true });
    candidate.src = streams[0] ?? "";
    candidate.play().catch(discard);
  }

  function stop() {
    active = false;
    attempt++;
    clearTimers();
  }

  return {
    start: () => playFrom(0),
    stop,
    onWaiting: () => {
      if (active) armStall(attempt);
    },
    onPlaying: () => {
      if (!active) return;
      window.clearTimeout(stallTimer);
      if (index > 0 && probeTimer === undefined) probeTimer = window.setInterval(checkOfficialStream, PROBE_EVERY_MS);
    },
    onError: () => {
      if (active) fail(attempt);
    },
    onPause: () => {
      if (ignoreNextPause) {
        ignoreNextPause = false;
        return;
      }
      // Paused from outside (button, headset, lock screen): stop retrying behind the listener's back.
      stop();
    },
  };
}
