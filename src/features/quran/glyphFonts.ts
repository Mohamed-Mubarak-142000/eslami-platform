"use client";

import type { GlyphEdition } from "./mushafPageTypes";

/*
 * The King Fahd Complex's per-page fonts, as quran.com serves them (CORS open, cached a year). Every
 * page has its own font, loaded when the page is shown and kept for the visit.
 */

/** The OT-SVG tajweed font comes in three palettes; COLRv1 browsers colour the base text themselves. */
export type GlyphPalette = "light" | "sepia" | "dark";

type TajweedFormat = "colr" | "svg";

const V1_URL = (page: number) => `https://static.qurancdn.com/fonts/quran/hafs/v1/woff2/p${page}.woff2`;
const COLR_URL = (page: number) => `https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p${page}.woff2`;
const SVG_URL = (page: number, palette: GlyphPalette) =>
  `https://verses.quran.foundation/fonts/quran/hafs/v4/ot-svg/${palette}/woff2/p${page}.woff2`;

/**
 * Apple's text engine (Safari, and every browser on iPhone and iPad) draws OT-SVG colour glyphs but
 * not COLRv1 ones — yet WebKit still answers yes to \`font-tech(color-COLRv1)\`, so the words came out
 * blank. Those browsers start on OT-SVG; elsewhere COLRv1, and a font that draws nothing (see
 * \`draws\`) switches the visit to the other format.
 */
let tajweedFormat: TajweedFormat | undefined;
function preferredFormat(): TajweedFormat {
  if (tajweedFormat) return tajweedFormat;
  const agent = navigator.userAgent;
  const apple = /iPad|iPhone|iPod/.test(agent) || (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1);
  const safari = /Safari\//.test(agent) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(agent);
  let colr = false;
  try {
    colr = CSS.supports("font-tech(color-COLRv1)");
  } catch {
    // Older browsers: no font-tech() at all.
  }
  tajweedFormat = apple || safari || !colr ? "svg" : "colr";
  return tajweedFormat;
}

function fontFor(page: number, edition: GlyphEdition, palette: GlyphPalette, format: TajweedFormat): { family: string; url: string } {
  if (edition === "v1") return { family: `qcf1-p${page}`, url: V1_URL(page) };
  return format === "colr"
    ? { family: `qcf4-p${page}`, url: COLR_URL(page) }
    : { family: `qcf4-${palette}-p${page}`, url: SVG_URL(page, palette) };
}

/** Whether a loaded font actually puts ink on the page for this glyph (a colour format it can't draw leaves it blank). */
function draws(family: string, sample: string): boolean {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 80;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return true;
    context.font = `48px "${family}"`;
    context.fillStyle = "#000";
    context.textBaseline = "middle";
    context.fillText(sample, 10, 40);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 3; index < data.length; index += 4) if (data[index]! > 0) return true;
    return false;
  } catch {
    // A canvas we can't read (privacy settings): trust the font.
    return true;
  }
}

const loading = new Map<string, Promise<boolean>>();

function loadFace(family: string, url: string): Promise<boolean> {
  let request = loading.get(family);
  if (!request) {
    const face = new FontFace(family, `url(${url}) format("woff2")`, { display: "block" });
    request = face
      .load()
      .then((loaded) => {
        document.fonts.add(loaded);
        return true;
      })
      .catch(() => {
        // Let a later visit to the page try again.
        loading.delete(family);
        return false;
      });
    loading.set(family, request);
  }
  return request;
}

/**
 * Loads (once) the font a page is drawn in and returns its family, or null when no format of it
 * loads and draws — the reader then shows the page as text. `sample` is one of the page's glyphs.
 */
export async function loadGlyphFont(page: number, edition: GlyphEdition, palette: GlyphPalette, sample?: string): Promise<string | null> {
  const first = preferredFormat();
  const formats: TajweedFormat[] = edition === "v1" ? [first] : first === "colr" ? ["colr", "svg"] : ["svg"];
  for (const format of formats) {
    const { family, url } = fontFor(page, edition, palette, format);
    if (!(await loadFace(family, url))) continue;
    if (!sample || draws(family, sample)) return family;
    // This browser can't draw the format: use the other one for the rest of the visit.
    if (edition === "tajweed") tajweedFormat = "svg";
  }
  return null;
}
