import type HlsType from "hls.js";

let loader: Promise<typeof HlsType> | null = null;
let loaded: typeof HlsType | null = null;

/** hls.js loads on demand; pages with HLS tracks call this early so a tap can start playback at once. */
export function loadHls(): Promise<typeof HlsType> {
  loader ??= import("hls.js").then((module) => (loaded = module.default));
  return loader;
}

/** hls.js once loaded, so playback can start inside the tap that asked for it (iOS insists). */
export function loadedHls(): typeof HlsType | null {
  return loaded;
}

/** Native HLS is the fallback: Chrome claims it but can't play these encrypted streams. */
export function playsHlsNatively(media: HTMLMediaElement): boolean {
  return media.canPlayType("application/vnd.apple.mpegurl") !== "";
}
