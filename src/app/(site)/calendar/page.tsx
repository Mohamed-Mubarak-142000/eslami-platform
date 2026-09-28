import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { CalendarView } from "@/features/calendar/CalendarView";

export const metadata: Metadata = {
  title: "التقويم الهجري والميلادي",
  description: "تقويم شهري يجمع التاريخين الهجري والميلادي، مع المناسبات الإسلامية القادمة والعد التنازلي لرمضان.",
  alternates: { canonical: "/calendar" },
};

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        kicker="التقويم"
        icon={<CalendarDays className="size-4" aria-hidden />}
        title="الهجري والميلادي في مكان واحد"
        description="تصفّح الشهور بالتقويمين، وتعرّف على المناسبات القادمة، وكم يفصلنا عن رمضان."
      />
      <div className="pt-12">
        <CalendarView />
      </div>
    </>
  );
}
