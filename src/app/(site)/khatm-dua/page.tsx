import type { Metadata } from "next";
import { HandHeart } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { KhatmDuas } from "@/features/khatmDua/KhatmDuas";

export const metadata: Metadata = {
  title: "دعاء ختم القرآن",
  description: "أدعية من القرآن الكريم والسنة النبوية الصحيحة يُدعى بها عند ختم القرآن، مع بيان ما ثبت في ذلك.",
  alternates: { canonical: "/khatm-dua" },
};

export default function KhatmDuaPage() {
  return (
    <>
      <PageHeader
        kicker="دعاء ختم القرآن"
        icon={<HandHeart className="size-4" aria-hidden />}
        title="ربنا تقبّل منا"
        description="أتممت القرآن؛ فادعُ الله بما تحب، وهذه أدعية جامعة من القرآن والسنة."
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <KhatmDuas />
      </div>
    </>
  );
}
