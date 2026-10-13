import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { RuqyahView } from "@/features/ruqyah/RuqyahView";

export const metadata: Metadata = {
  title: "الرقية الشرعية",
  description: "الرقية الشرعية من القرآن الكريم والسنة النبوية الصحيحة، مقروءة ومسموعة، مع درجة كل حديث ومصدره.",
  alternates: { canonical: "/ruqyah" },
};

export default function RuqyahPage() {
  return (
    <>
      <PageHeader
        kicker="الرقية الشرعية"
        icon={<ShieldCheck className="size-4" aria-hidden />}
        title="وننزّل من القرآن ما هو شفاء"
        description="آيات الرقية وأدعية النبي ﷺ الثابتة للشفاء والتحصين، تقرؤها أو تستمع إليها."
      />
      <div className="pt-10">
        <RuqyahView />
      </div>
    </>
  );
}
