import { toArabicDigits } from "@/lib/arabic";

/**
 * The end-of-ayah marker. A riwaya's KFGQPC typeface draws the bare digits as its own mushaf's
 * ayah ornament; the Hafs text gets the bracketed number.
 */
export function AyahNumber({ number, riwayaFont }: { number: number; riwayaFont: string | null }) {
  if (riwayaFont) {
    return (
      <span className="ayah-mark" style={{ fontFamily: riwayaFont }}>
        {toArabicDigits(number)}
      </span>
    );
  }
  return <span className="ayah-mark">﴿{toArabicDigits(number)}﴾</span>;
}
