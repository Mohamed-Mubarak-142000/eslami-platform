"use client";

import { cn } from "@/lib/cn";
import { StarMark } from "@/components/ui/Ornament";
import { useNow } from "@/features/time/useNow";
import type { KidsProgressState } from "./progressTypes";
import { isSurahFullyMemorized } from "./reviewSchedule";

/** Surahs whose every ayah is memorized, from the end of the Mushaf backwards (how kids learn them). */
export function completedSurahIds(state: KidsProgressState): number[] {
  return Object.keys(state.memorizedAyahsBySurah)
    .map(Number)
    .filter((surahId) => isSurahFullyMemorized(state, surahId))
    .sort((a, b) => b - a);
}

/** One cell per day for the last two weeks, filled on days with any activity. */
export function ActivityStrip({ activityDates, className }: { activityDates: string[]; className?: string }) {
  const now = useNow();
  const active = new Set(activityDates);
  const days = Array.from({ length: now ? 14 : 0 }, (_, i) => {
    const date = new Date(now ?? 0);
    date.setDate(date.getDate() - (13 - i));
    return date.toISOString().slice(0, 10);
  });
  return (
    <div className={cn("flex gap-1.5", className)} aria-label="أيام النشاط في آخر ١٤ يومًا">
      {days.map((day) => (
        <span key={day} title={day} className={cn("h-8 flex-1 rounded-lg", active.has(day) ? "bg-[#12a15b]" : "bg-[#eef1ec]")} />
      ))}
    </div>
  );
}

/** Hidden on screen; the only thing on the page when printing (see `.print-area` in globals.css). */
export function SurahCertificatePrint({ childName, surahName }: { childName: string; surahName: string }) {
  const now = useNow();
  return (
    <section className="print-area hidden print:block" aria-hidden>
      <div className="mx-auto flex min-h-[90vh] max-w-3xl flex-col items-center justify-center rounded-[2rem] border-[10px] border-double border-gold p-12 text-center">
        <StarMark className="size-20 text-gold" />
        <h1 className="mt-6 font-display text-5xl font-bold text-emerald-deep">شهادة إتمام حفظ</h1>
        <p className="mt-8 text-2xl">يسرّ المنارة أن تهنّئ</p>
        <p className="mt-3 font-display text-4xl font-bold text-gold-deep">{childName || "البطل الصغير"}</p>
        <p className="mt-6 text-2xl">
          بإتمام حفظ <span className="font-bold text-emerald-deep">سورة {surahName}</span>
        </p>
        <p className="mt-10 text-lg text-muted">{now ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "long" }).format(now) : ""}</p>
      </div>
    </section>
  );
}
