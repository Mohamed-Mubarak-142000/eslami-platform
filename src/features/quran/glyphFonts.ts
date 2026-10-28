"use client";

import type { GlyphEdition } from "./mushafPageTypes";

/*
 * The King Fahd Complex's per-page fonts, as quran.com serves them (CORS open, cached a year). Every
 * page has its own font, loaded when the page is shown and kept for the visit.
 */

/** The page theme, which picks the tajweed font's CPAL palette. */
export type GlyphPalette = "light" | "sepia" | "dark";

const V1_URL = (page: number) => `https://static.qurancdn.com/fonts/quran/hafs/v1/woff2/p${page}.woff2`;
const COLR_URL = (page: number) => `https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p${page}.woff2`;
/**
 * The tajweed font is COLRv1 everywhere. It also comes as OT-SVG, but iPhone leaves that one blank,
 * and Safari reports no COLRv1 support through CSS.supports while drawing it well (tested on iOS).
 */
function fontFor(page: number, edition: GlyphEdition): { family: string; url: string } {
  if (edition === "v1") return { family: `qcf1-p${page}`, url: V1_URL(page) };
  return { family: `qcf4-p${page}`, url: COLR_URL(page) };
}

const loading = new Map<string, Promise<boolean>>();

/** Loads (once) the font a page is drawn in and returns its family, or null when it can't be fetched. */
export async function loadGlyphFont(page: number, edition: GlyphEdition): Promise<string | null> {
  const { family, url } = fontFor(page, edition);
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
