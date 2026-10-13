import type { Metadata } from "next";
import { CircleDot } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TasbihView } from "@/features/tasbih/TasbihView";

export const metadata: Metadata = {
  title: "السبحة الإلكترونية",
  description: "سبحة إلكترونية بأذكار مأثورة وعدد تختاره، مع أذكارك الخاصة وأشكال متعددة، ويُحفظ عدّك على جهازك.",
  alternates: { canonical: "/tasbih" },
};

export default function TasbihPage() {
  return (
    <>
      <PageHeader
        kicker="السبحة"
        icon={<CircleDot className="size-4" aria-hidden />}
        title="سبّح بحمد ربك"
        description="اختر ذكرًا والعدد الذي تريده، أو أضف ذكرك الخاص، ثم اضغط مع كل تسبيحة."
      />
      <div className="pt-10">
        <TasbihView />
      </div>
    </>
  );
}
