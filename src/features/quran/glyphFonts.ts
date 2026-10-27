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
/** Safari draws colour fonts from OT-SVG tables but not COLRv1; ask the browser rather than guess. */
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

export function glyphFont(page: number, edition: GlyphEdition, palette: GlyphPalette): { family: string; url: string } {
  if (edition === "v1") return { family: `qcf1-p${page}`, url: V1_URL(page) };
  return supportsColrV1()
    ? { family: `qcf4-p${page}`, url: COLR_URL(page) }
    : { family: `qcf4-${palette}-p${page}`, url: SVG_URL(page, palette) };
}

const loading = new Map<string, Promise<boolean>>();

/** Loads (once) the font a page is drawn in; false when it can't be fetched. */
export function loadGlyphFont(page: number, edition: GlyphEdition, palette: GlyphPalette): Promise<boolean> {
  const { family, url } = glyphFont(page, edition, palette);
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
