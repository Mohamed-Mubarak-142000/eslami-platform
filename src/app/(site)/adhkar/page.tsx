import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdhkarView } from "@/features/adhkar/AdhkarView";

export const metadata: Metadata = {
  title: "الأذكار والأدعية",
  description: "أذكار الصباح والمساء والنوم والاستيقاظ وبعد الصلاة، وجميع أبواب حصن المسلم بمراجعها وعدّاد تفاعلي.",
  alternates: { canonical: "/adhkar" },
};

export default function AdhkarPage() {
  return (
    <>
      <PageHeader
        kicker="الأذكار"
        icon={<Sparkles className="size-4" aria-hidden />}
        title="ذكرٌ يطمئن به قلبك"
        description="أذكار يومك بمصادرها، مع عدّاد تفاعلي يساعدك على إتمام التكرار."
      />
      <div className="pt-10">
        <AdhkarView />
      </div>
    </>
  );
}
