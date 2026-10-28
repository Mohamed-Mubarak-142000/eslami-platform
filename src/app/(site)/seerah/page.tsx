import type { Metadata } from "next";
import { Milestone } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SeerahTimeline } from "@/features/seerah/SeerahTimeline";

export const metadata: Metadata = {
  title: "السيرة النبوية",
  description:
    "سيرة النبي ﷺ من المولد إلى الرفيق الأعلى: خط زمني، وفصول تفاعلية على خريطة الجزيرة العربية، بأدلتها من القرآن والسنة الصحيحة.",
  alternates: { canonical: "/seerah" },
};

export default function SeerahPage() {
  return (
    <>
      <PageHeader
        kicker="السيرة النبوية"
        icon={<Milestone className="size-4" aria-hidden />}
        title="سيرة النبي ﷺ"
        description="من المولد إلى الرفيق الأعلى: اختر حدثًا لتعيشه فصلًا على الخريطة، بأدلته من القرآن والسنة."
      />
      <div className="px-4 pt-10 sm:px-6">
        <SeerahTimeline />
      </div>
    </>
  );
}
