import type { Metadata } from "next";
import { FontTest } from "./FontTest";

export const metadata: Metadata = { title: "اختبار خطوط المصحف", robots: { index: false } };

/** Temporary diagnostic page for the printed mushaf's fonts on iPhone; remove once fixed. */
export default function FontTestPage() {
  return <FontTest />;
}
