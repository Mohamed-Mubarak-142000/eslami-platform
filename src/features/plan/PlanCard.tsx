import Link from "next/link";
import { CalendarRange, Check } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";

export interface PlanSummary {
  kind: "memorize" | "review";
  status: "active" | "completed";
  pagesDone: number;
  totalPages: number;
  percent: number;
  newDone: boolean;
  reviewDone: boolean;
  /** Whether today is one of the chosen memorizing / reviewing days. */
  newToday: boolean;
  reviewToday: boolean;
}

function todayText(plan: PlanSummary): { text: string; done: boolean } {
  const newDue = plan.kind === "memorize" && plan.newToday && !plan.newDone;
  const reviewDue = plan.reviewToday && !plan.reviewDone;
  if (!newDue && !reviewDue) {
    const worked = plan.newDone || plan.reviewDone;
    return { text: worked ? "أنجزت ورد اليوم، أحسنت!" : "اليوم يوم راحة في خطتك.", done: true };
  }
  if (newDue && reviewDue) return { text: "ورد اليوم بانتظارك: حفظ ومراجعة", done: false };
  return { text: newDue ? "بقي حفظ اليوم" : "بقيت مراجعة اليوم", done: false };
}

/** Dashboard entry point to /plan: today's status, or an invitation to make a plan. */
export function PlanCard({ plan }: { plan: PlanSummary | null }) {
  const today = plan?.status === "active" ? todayText(plan) : null;
  const done = today?.done ?? false;
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-4xl border border-line bg-white p-6 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold-mist text-gold-deep">
          <CalendarRange className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-bold text-emerald-deep">{plan?.kind === "review" ? "خطة المراجعة" : "خطة الحفظ"}</h2>
          <p className="mt-1 text-sm text-muted">
            {!plan
              ? "احفظ جديدًا أو راجع ما تحفظه، في الأيام التي تناسبك، ونخبرك كل يوم بوردك."
              : plan.status === "completed"
                ? "أتممت خطتك، بارك الله فيك! ابدأ خطة جديدة."
                : plan.kind === "memorize"
                  ? `${today!.text} — ${toArabicDigits(plan.pagesDone)} من ${toArabicDigits(plan.totalPages)} صفحة (${toArabicDigits(plan.percent)}٪)`
                  : today!.text}
          </p>
        </div>
      </div>
      <Link href="/plan" className={buttonClass(done ? "outline" : "primary", "md")}>
        {done && <Check aria-hidden />}
        {!plan ? "أنشئ خطة" : done ? "عرض الخطة" : "ورد اليوم"}
      </Link>
    </section>
  );
}
