import "server-only";
import type { AyahRef } from "@/features/quran/textApi";
import { loggedOn, type PlanWithLog } from "./data";
import { resolveSegments } from "./portion";
import {
  daysLeft,
  farPages,
  planDay,
  recentRange,
  streak,
  surahAtPage,
  todayNewRange,
  totalUnits,
  unitsLabel,
  unitsToSegments,
  type PageSegment,
} from "./schedule";

export interface PageLink {
  page: number;
  half: PageSegment["half"];
  surahName: string;
  href: string;
}

export interface PortionPart extends PageLink {
  spans: { surah: number; surahName: string; from: number; to: number }[];
  opening: string;
}

export interface TodayView {
  status: "active" | "completed";
  startJuz: number;
  endJuz: number;
  totalPages: number;
  pagesDone: number;
  percent: number;
  daysLeft: number;
  streak: number;
  dailyLabel: string;
  /** Null when the plan is finished; `parts` is null when the Quran API is unreachable. */
  newPortion: { done: boolean; parts: PortionPart[] | null } | null;
  recent: PageLink[];
  far: PageLink[];
  reviewDone: boolean;
}

export async function buildTodayView(
  { plan, log }: PlanWithLog,
  pageStarts: AyahRef[],
  surahNames: Record<number, string>,
): Promise<TodayView> {
  const today = planDay();
  const newToday = loggedOn(log, today, "new");
  const reviewToday = loggedOn(log, today, "review");
  const name = (surah: number) => surahNames[surah] ?? String(surah);
  const link = (segment: PageSegment): PageLink => {
    const surah = surahAtPage(pageStarts, segment.page);
    return { ...segment, surahName: name(surah), href: `/quran/${surah}?page=${segment.page}` };
  };

  const range = plan.status === "active" ? todayNewRange(plan, newToday) : null;
  let newPortion: TodayView["newPortion"] = null;
  if (range) {
    const segments = unitsToSegments(plan, range);
    const resolved = await resolveSegments(segments, { start: plan.start_juz, end: plan.end_juz });
    newPortion = {
      done: newToday !== null,
      parts:
        resolved?.map((segment) => {
          const first = segment.spans[0]?.surah ?? surahAtPage(pageStarts, segment.page);
          return {
            ...link(segment),
            // Link to the surah the portion starts in, not the one at the top of the page.
            href: `/quran/${first}?page=${segment.page}`,
            spans: segment.spans.map((span) => ({ ...span, surahName: name(span.surah) })),
            opening: segment.opening,
          };
        }) ?? null,
    };
  }

  // Review rows keep the cursor and anchor they were made with (see completeReviewAction).
  const anchor = reviewToday?.to ?? newToday?.from ?? plan.progress_units;
  const cursor = reviewToday?.from ?? plan.review_cursor;
  const recent = recentRange(plan, anchor);
  const total = totalUnits(plan);

  return {
    status: plan.status === "completed" ? "completed" : "active",
    startJuz: plan.start_juz,
    endJuz: plan.end_juz,
    totalPages: total / 2,
    pagesDone: plan.progress_units / 2,
    percent: Math.round((plan.progress_units / total) * 100),
    daysLeft: daysLeft(plan),
    streak: streak(
      log.filter((row) => row.kind === "new").map((row) => row.day),
      today,
    ),
    dailyLabel: unitsLabel(plan.units_per_day),
    newPortion,
    recent: plan.status === "active" ? unitsToSegments(plan, recent).map(link) : [],
    far: plan.status === "active" ? farPages(plan, recent.from, cursor).map((page) => link({ page, half: "full" })) : [],
    reviewDone: reviewToday !== null,
  };
}
