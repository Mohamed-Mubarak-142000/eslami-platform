import type { Metadata } from "next";
import { Wind } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { loadNafahat } from "@/features/nafahat/data";
import { NafahatChannel } from "@/features/nafahat/NafahatChannel";
import { NAFAHAT_TITLE } from "@/features/nafahat/shared";

export const metadata: Metadata = {
  title: NAFAHAT_TITLE,
  description: "خواطر ونفحات إيمانية قصيرة من فريق المنارة: مقالات وصور ومقاطع تذكّر القلب.",
  alternates: { canonical: "/nafahat" },
};

export default async function NafahatPage() {
  const nafahat = await loadNafahat();
  return (
    <>
      <PageHeader
        kicker="قناة المنارة"
        icon={<Wind className="size-4" aria-hidden />}
        title={NAFAHAT_TITLE}
        description="خواطر قصيرة تُنير القلب: مقال أو صورة أو مقطع، تفاعل معها وشاركها مع من تحب."
      />
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6">
        <NafahatChannel nafahat={nafahat} />
      </div>
    </>
  );
}
