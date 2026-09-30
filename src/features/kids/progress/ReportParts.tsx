"use client";

import { cn } from "@/lib/cn";
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
