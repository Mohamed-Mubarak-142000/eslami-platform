import localFont from "next/font/local";
import type { OtherRiwayaKey } from "./riwayat";

/*
 * The KFGQPC typeface of each riwaya's own mushaf (scripts/build-riwayat.mjs). Their texts use marks
 * only these fonts draw correctly, and they render the ayah number as its end-of-ayah ornament.
 * Kept out of the root layout and not preloaded, so a font loads only when its riwaya is read.
 */
const shouba = localFont({ src: "../../assets/fonts/riwayat/shouba.woff2", weight: "400", display: "swap", preload: false });
const warsh = localFont({ src: "../../assets/fonts/riwayat/warsh.woff2", weight: "400", display: "swap", preload: false });
const qaloon = localFont({ src: "../../assets/fonts/riwayat/qaloon.woff2", weight: "400", display: "swap", preload: false });
const bazzi = localFont({ src: "../../assets/fonts/riwayat/bazzi.woff2", weight: "400", display: "swap", preload: false });
const qumbul = localFont({ src: "../../assets/fonts/riwayat/qumbul.woff2", weight: "400", display: "swap", preload: false });
const doori = localFont({ src: "../../assets/fonts/riwayat/doori.woff2", weight: "400", display: "swap", preload: false });
const soosi = localFont({ src: "../../assets/fonts/riwayat/soosi.woff2", weight: "400", display: "swap", preload: false });

const FONTS = { shouba, warsh, qaloon, bazzi, qumbul, doori, soosi } satisfies Record<OtherRiwayaKey, unknown>;

export function riwayaFontFamily(key: OtherRiwayaKey): string {
  return FONTS[key].style.fontFamily;
}
