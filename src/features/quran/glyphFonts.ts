"use client";

import type { GlyphEdition } from "./mushafPageTypes";

/*
 * The King Fahd Complex's per-page fonts, as quran.com serves them (CORS open, cached a year). Every
 * page has its own font, loaded when the page is shown and kept for the visit.
 */

/** The OT-SVG tajweed font comes in three palettes; COLRv1 browsers colour the base text themselves. */
export type GlyphPalette = "light" | "sepia" | "dark";

const V1_URL = (page: number) => `https://static.qurancdn.com/fonts/quran/hafs/v1/woff2/p${page}.woff2`;
const COLR_URL = (page: number) => `https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p${page}.woff2`;
const SVG_URL = (page: number, palette: GlyphPalette) =>
  `https://verses.quran.foundation/fonts/quran/hafs/v4/ot-svg/${palette}/woff2/p${page}.woff2`;

let colrSupport: boolean | undefined;
/**
 * The tajweed font comes as COLRv1 and as OT-SVG. iPhone draws COLRv1 (tested on iOS with
 * /font-test) but leaves the OT-SVG one blank, so COLRv1 is used wherever the browser says it can;
 * OT-SVG only for browsers that say they can't.
 */
function supportsColrV1(): boolean {
  if (colrSupport === undefined) {
    try {
      colrSupport = CSS.supports("font-tech(color-COLRv1)");
    } catch {
      colrSupport = false;
    }
  }
  return colrSupport;
}

function fontFor(page: number, edition: GlyphEdition, palette: GlyphPalette): { family: string; url: string } {
  if (edition === "v1") return { family: `qcf1-p${page}`, url: V1_URL(page) };
  return supportsColrV1()
    ? { family: `qcf4-p${page}`, url: COLR_URL(page) }
    : { family: `qcf4-${palette}-p${page}`, url: SVG_URL(page, palette) };
}

const loading = new Map<string, Promise<boolean>>();

/** Loads (once) the font a page is drawn in and returns its family, or null when it can't be fetched. */
export async function loadGlyphFont(page: number, edition: GlyphEdition, palette: GlyphPalette): Promise<string | null> {
  const { family, url } = fontFor(page, edition, palette);
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
  return (await request) ? family : null;
}
