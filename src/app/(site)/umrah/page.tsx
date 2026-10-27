import type { Metadata } from "next";
import { Landmark } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { UmrahView } from "@/features/umrah/UmrahView";

export const metadata: Metadata = {
  title: "العمرة والسفر",
  description: "مناسك العمرة خطوة بخطوة بأدعيتها المسموعة وأدلتها، مع عدّاد للطواف والسعي، وأدعية السفر، وآداب زيارة المدينة.",
  alternates: { canonical: "/umrah" },
};

export default function UmrahPage() {
  return (
    <>
      <PageHeader
        kicker="العمرة والسفر"
        icon={<Landmark className="size-4" aria-hidden />}
        title="عمرتك خطوة بخطوة"
        description="من الميقات إلى التحلّل: ماذا تفعل في كل خطوة، وماذا تقول، مع عدّاد يحفظ لك أشواط الطواف والسعي."
      />
      <div className="pt-10">
        <UmrahView />
      </div>
    </>
  );
}
