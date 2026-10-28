import { toArabicDigits } from "@/lib/arabic";

/** The end-of-ayah marker: the ayah's number in ornate brackets. */
export function AyahNumber({ number }: { number: number }) {
  return <span className="ayah-mark">﴿{toArabicDigits(number)}﴾</span>;
}
