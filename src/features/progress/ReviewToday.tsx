"use client";

import Link from "next/link";
import type { Route } from "next";
import { BookOpen, CalendarCheck, CalendarClock, Check, Mic } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { useKidsProgress } from "@/features/kids/progress/KidsProgressProvider";
import { getDueReviews, REVIEW_STAGE_COUNT } from "@/features/kids/progress/reviewSchedule";
import { useNow } from "@/features/time/useNow";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysLabel(days: number): string {
  if (days <= 1) return "يوم";
  if (days === 2) return "يومين";
  return `${toArabicDigits(days)} ${days <= 10 ? "أيام" : "يومًا"}`;
}

/** Spaced-repetition reviews due today for the active learner (surahs fully memorized). */
export function ReviewToday({ surahNames }: { surahNames: Record<number, string> }) {
  const { state, status, markSurahReviewed } = useKidsProgress();
  const now = useNow();
  const scheduled = Object.entries(state.reviewSchedule);

  if (!now || status === "loading") {
    return <div className="h-40 animate-pulse rounded-4xl border border-line bg-white" aria-hidden />;
  }

  const due = getDueReviews(state.reviewSchedule, now);
  const upcoming = scheduled
    .filter(([, review]) => new Date(review.dueAt).getTime() > now.getTime())
    .sort(([, a], [, b]) => a.dueAt.localeCompare(b.dueAt))[0];

  return (
    <section aria-labelledby="review-heading" className="rounded-4xl border border-line bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="review-heading" className="flex items-center gap-2 text-2xl font-bold text-emerald-deep">
          <CalendarClock className="size-6 text-gold-deep" aria-hidden /> مراجعة اليوم
        </h2>
        {due.length > 0 && (
          <span className="rounded-full bg-gold-mist px-3 py-1 text-sm font-bold text-gold-deep">
            {toArabicDigits(due.length)} {due.length === 1 ? "سورة" : "سور"}
          </span>
        )}
      </div>

      {scheduled.length === 0 ? (
        <p className="mt-3 text-sm leading-7 text-muted">
          عندما تُتمّ حفظ سورة كاملة نضع لها جدول مراجعة تلقائيًا (بعد يوم، ثم ٣ أيام، ثم أسبوع…) حتى تثبت في حفظك.
        </p>
      ) : due.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <CalendarCheck className="size-5 text-emerald" aria-hidden />
          لا مراجعات اليوم، أحسنت!
          {upcoming &&
            ` المراجعة القادمة: سورة ${surahNames[Number(upcoming[0])] ?? ""} بعد ${daysLabel(
              Math.ceil((new Date(upcoming[1].dueAt).getTime() - now.getTime()) / DAY_MS),
            )}.`}
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">سمّع السورة من حفظك دون أخطاء فتُسجَّل مراجعتها تلقائيًا، أو علّمها بنفسك بعد قراءتها.</p>
          <ul className="mt-5 divide-y divide-line">
            {due.map(({ surahId, dueAt }) => {
              const review = state.reviewSchedule[surahId]!;
              const overdueDays = Math.floor((now.getTime() - new Date(dueAt).getTime()) / DAY_MS);
              return (
                <li key={surahId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-bold text-ink">سورة {surahNames[surahId] ?? toArabicDigits(surahId)}</p>
                    <p className="text-xs text-muted">
                      المراجعة {toArabicDigits(review.intervalIndex + 1)} من {toArabicDigits(REVIEW_STAGE_COUNT)}
                      {overdueDays >= 1 && <span className="ms-2 font-bold text-rose">متأخرة {daysLabel(overdueDays)}</span>}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/tasmee?surah=${surahId}` as Route} className={buttonClass("primary", "sm")}>
                      <Mic aria-hidden /> سمّع
                    </Link>
                    <Link href={`/quran/${surahId}` as Route} className={buttonClass("outline", "sm")}>
                      <BookOpen aria-hidden /> اقرأ
                    </Link>
                    <button
                      type="button"
                      onClick={() => markSurahReviewed(surahId)}
                      className={cn(buttonClass("outline", "sm"), "text-emerald")}
                    >
                      <Check aria-hidden /> راجعتها
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
