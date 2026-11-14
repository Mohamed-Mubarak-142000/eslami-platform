import type { Metadata } from "next";
import { loadNafahat } from "@/features/nafahat/data";
import { NafahatChannel } from "@/features/nafahat/NafahatChannel";
import { NAFAHAT_TITLE } from "@/features/nafahat/shared";

export const metadata: Metadata = {
  title: NAFAHAT_TITLE,
  description: "خواطر ونفحات إيمانية قصيرة من فريق المنارة: مقالات وصور ومقاطع تذكّر القلب.",
  alternates: { canonical: "/nafahat" },
};

/** The channel fills the screen under the site header, like a chat app. */
export default async function NafahatPage() {
  const nafahat = await loadNafahat();
  return (
    <div className="sm:px-4">
      <NafahatChannel nafahat={nafahat} />
    </div>
  );
}
