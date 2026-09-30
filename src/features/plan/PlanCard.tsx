import Link from "next/link";
import { CalendarRange, Check } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";

export interface PlanSummary {
  status: "active" | "completed";
  pagesDone: number;
  totalPages: number;
  percent: number;
  newDone: boolean;
  reviewDone: boolean;
}

/** Dashboard entry point to /plan: today's status, or an invitation to make a plan. */
export function PlanCard({ plan }: { plan: PlanSummary | null }) {
  const allDone = plan?.status === "active" && plan.newDone && plan.reviewDone;
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-4xl border border-line bg-white p-6 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold-mist text-gold-deep">
          <CalendarRange className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-bold text-emerald-deep">خطة الحفظ</h2>
          <p className="mt-1 text-sm text-muted">
            {!plan
              ? "اختر جزءًا ومقدارًا يوميًا، ونخبرك كل يوم بما تحفظه وتراجعه."
              : plan.status === "completed"
                ? "أتممت خطتك، بارك الله فيك! ابدأ خطة جديدة."
                : allDone
                  ? "أنجزت ورد اليوم كاملًا، أحسنت!"
                  : `${plan.newDone ? "حفظت ورد اليوم، بقيت المراجعة" : "ورد اليوم بانتظارك"} — ${toArabicDigits(plan.pagesDone)} من ${toArabicDigits(plan.totalPages)} صفحة (${toArabicDigits(plan.percent)}٪)`}
          </p>
        </div>
      </div>
      <Link href="/plan" className={buttonClass(allDone ? "outline" : "primary", "md")}>
        {allDone && <Check aria-hidden />}
        {!plan ? "أنشئ خطة" : allDone ? "عرض الخطة" : "ورد اليوم"}
      </Link>
    </section>
  );
}
