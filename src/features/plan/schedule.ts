import { toArabicDigits } from "@/lib/arabic";
import type { AyahRef } from "@/features/quran/textApi";
import type { MemorizationPlanRow } from "@/lib/supabase/database.types";

/**
 * Pure plan arithmetic. A plan covers mushaf pages start_page..end_page, counted in half-page
 * units (unit 0 = first half of start_page). It advances by completion, never by the calendar,
 * so a missed day simply waits.
 */

export type PlanShape = Pick<
  MemorizationPlanRow,
  "start_page" | "end_page" | "units_per_day" | "far_review_pages" | "progress_units" | "review_cursor"
>;

export interface UnitRange {
  from: number;
  /** Exclusive. */
  to: number;
}

export interface PageSegment {
  page: number;
  half: "full" | "first" | "second";
}

/** How many past days of new memorization the "recent" review repeats. */
export const RECENT_PORTIONS = 5;
export const PAGES_PER_DAY_OPTIONS = [1, 2, 3, 4, 6, 8, 10] as const; // in half-page units

export function totalUnits(plan: Pick<PlanShape, "start_page" | "end_page">): number {
  return (plan.end_page - plan.start_page + 1) * 2;
}

export function unitsLabel(units: number): string {
  if (units === 1) return "نصف صفحة";
  if (units === 2) return "صفحة";
  if (units === 3) return "صفحة ونصف";
  if (units === 4) return "صفحتان";
  const pages = units / 2;
  const whole = toArabicDigits(Math.floor(pages));
  return Number.isInteger(pages) ? `${whole} صفحات` : `${whole} صفحات ونصف`;
}

/** Collapses a unit range to pages, marking the half pages at either end. */
export function unitsToSegments(plan: Pick<PlanShape, "start_page">, range: UnitRange): PageSegment[] {
  const segments: PageSegment[] = [];
  let unit = range.from;
  while (unit < range.to) {
    const page = plan.start_page + Math.floor(unit / 2);
    if (unit % 2 === 1) {
      segments.push({ page, half: "second" });
      unit += 1;
    } else if (unit + 1 < range.to) {
      segments.push({ page, half: "full" });
      unit += 2;
    } else {
      segments.push({ page, half: "first" });
      unit += 1;
    }
  }
  return segments;
}

/** Today's new portion: what was logged today, or the next `units_per_day` units. Null once finished. */
export function todayNewRange(plan: PlanShape, loggedToday: UnitRange | null): UnitRange | null {
  if (loggedToday) return loggedToday;
  const total = totalUnits(plan);
  if (plan.progress_units >= total) return null;
  return { from: plan.progress_units, to: Math.min(plan.progress_units + plan.units_per_day, total) };
}

/** The portions memorized on the last few days before today's new portion. */
export function recentRange(plan: PlanShape, anchor: number): UnitRange {
  return { from: Math.max(0, anchor - RECENT_PORTIONS * plan.units_per_day), to: anchor };
}

/** Whole pages memorized before the recent window: the pool the "older pages" review rotates over. */
export function farPool(recentFrom: number): number {
  return Math.floor(recentFrom / 2);
}

/** `far_review_pages` pages from the older pool, starting at `cursor` and wrapping around. */
export function farPages(plan: PlanShape, recentFrom: number, cursor: number): number[] {
  const pool = farPool(recentFrom);
  const count = Math.min(plan.far_review_pages, pool);
  return Array.from({ length: count }, (_, index) => plan.start_page + ((cursor + index) % pool));
}

export function nextCursor(plan: PlanShape, recentFrom: number, cursor: number): number {
  const pool = farPool(recentFrom);
  return pool === 0 ? 0 : (cursor + Math.min(plan.far_review_pages, pool)) % pool;
}

export function daysLeft(plan: PlanShape): number {
  return Math.ceil(Math.max(0, totalUnits(plan) - plan.progress_units) / plan.units_per_day);
}

/** Consecutive days with a new portion, ending today or yesterday. Days are YYYY-MM-DD. */
export function streak(days: string[], today: string): number {
  const set = new Set(days);
  let cursor = set.has(today) ? today : shiftDay(today, -1);
  let count = 0;
  while (set.has(cursor)) {
    count += 1;
    cursor = shiftDay(cursor, -1);
  }
  return count;
}

export function shiftDay(day: string, delta: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

const DAY_FORMAT = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" });

/** The plan's calendar day (Cairo time, so "today" doesn't flip at 2–3 AM local). */
export function planDay(date: Date = new Date()): string {
  return DAY_FORMAT.format(date);
}

function compareRefs(a: AyahRef, b: AyahRef): number {
  return a.surah - b.surah || a.ayah - b.ayah;
}

/** Page of an ayah: the last page whose first ayah is at or before it. */
function pageOf(pageStarts: AyahRef[], ref: AyahRef): number {
  let low = 0;
  let high = pageStarts.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (compareRefs(pageStarts[mid]!, ref) <= 0) low = mid;
    else high = mid - 1;
  }
  return low + 1;
}

export interface JuzPages {
  juz: number;
  startPage: number;
  endPage: number;
  /** Surah the juz opens with, for the dropdown label. */
  firstSurah: number;
}

/** Page range of each juz, from the API's juz and page starts (none hand-typed). */
export function buildJuzPages(juzStarts: AyahRef[], pageStarts: AyahRef[]): JuzPages[] {
  if (juzStarts.length !== 30 || pageStarts.length !== 604) return [];
  return juzStarts.map((start, index) => {
    const next = juzStarts[index + 1];
    let endPage = 604;
    if (next) {
      const nextPage = pageOf(pageStarts, next);
      // A juz that begins at the top of a page leaves the previous page to the juz before it.
      endPage = compareRefs(pageStarts[nextPage - 1]!, next) === 0 ? nextPage - 1 : nextPage;
    }
    return { juz: index + 1, startPage: pageOf(pageStarts, start), endPage, firstSurah: start.surah };
  });
}

/** The surah printed at the top of a page, for mushaf links (`/quran/{surah}?page=`). */
export function surahAtPage(pageStarts: AyahRef[], page: number): number {
  return pageStarts[page - 1]?.surah ?? 1;
}
