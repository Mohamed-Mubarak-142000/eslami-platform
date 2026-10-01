import type HlsType from "hls.js";

let loader: Promise<typeof HlsType> | null = null;

/** hls.js is only needed where the browser can't play HLS itself, so it loads on demand. */
export function loadHls(): Promise<typeof HlsType> {
  loader ??= import("hls.js").then((module) => module.default);
  return loader;
}

/** Safari (and recent Chrome) play HLS in a plain media element; elsewhere hls.js does it. */
export function playsHlsNatively(media: HTMLMediaElement): boolean {
  return media.canPlayType("application/vnd.apple.mpegurl") !== "";
}
