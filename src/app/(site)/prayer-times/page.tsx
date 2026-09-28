import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrayerTimesView } from "@/features/prayer/PrayerTimesView";

export const metadata: Metadata = {
  title: "مواقيت الصلاة واتجاه القبلة",
  description: "مواقيت الصلاة اليوم حسب مدينتك أو موقعك، مع العد التنازلي للصلاة القادمة، واتجاه القبلة، وجدول الشهر.",
  alternates: { canonical: "/prayer-times" },
};

export default function PrayerTimesPage() {
  return (
    <>
      <PageHeader
        kicker="مواقيت الصلاة"
        icon={<Clock className="size-4" aria-hidden />}
        title="صلاتك في وقتها"
        description="مواقيت اليوم حسب مكانك، والصلاة القادمة، واتجاه القبلة، وجدول الشهر كاملًا."
        className="pb-6"
      />
      <div className="pb-8">
        <PrayerTimesView />
      </div>
    </>
  );
}
