import Link from "next/link";
import { BookMarked, Check } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";

export interface KhatmaSummary {
  status: "active" | "completed";
  percent: number;
  readToday: boolean;
  /** Whether today is one of the chosen reading days. */
  readsToday: boolean;
}

/** Dashboard entry point to /khatma: today's status, or an invitation to start one. */
export function KhatmaCard({ khatma }: { khatma: KhatmaSummary | null }) {
  const done = khatma?.status === "active" && (khatma.readToday || !khatma.readsToday);
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-4xl border border-line bg-white p-6 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-mist text-emerald">
          <BookMarked className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-bold text-emerald-deep">ختمة القرآن</h2>
          <p className="mt-1 text-sm text-muted">
            {!khatma
              ? "اختم القرآن بوِرد يومي تختاره أو في مدة تحددها."
              : khatma.status === "completed"
                ? "ختمتَ القرآن، تقبّل الله منك! ابدأ ختمة جديدة."
                : `${khatma.readToday ? "قرأت ورد اليوم، أحسنت!" : khatma.readsToday ? "ورد اليوم بانتظارك" : "اليوم يوم راحة في ختمتك."} — ${toArabicDigits(khatma.percent)}٪ من ختمتك`}
          </p>
        </div>
      </div>
      <Link href="/khatma" className={buttonClass(done ? "outline" : "primary", "md")}>
        {done && <Check aria-hidden />}
        {!khatma ? "ابدأ ختمة" : done ? "عرض الختمة" : "ورد اليوم"}
      </Link>
    </section>
  );
}
