import "server-only";
import { toArabicDigits } from "@/lib/arabic";
import { getPageAyahs, type AyahRef } from "@/features/quran/textApi";
import { loggedOn, type PlanWithLog } from "./data";
import { planBounds, resolveSegments } from "./portion";
import {
  daysLabel,
  farPages,
  farPool,
  finishDay,
  juzLabel,
  nextScheduledDay,
  pagesLabel,
  planDay,
  recentRange,
  sessionsLeft,
  shiftDay,
  streak,
  surahAtPage,
  todayNewRange,
  totalUnits,
  unitsLabel,
  unitsToSegments,
  weekday,
  WEEKDAY_NAMES,
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

/** A stretch of one surah to recite in the tasmee page. */
export interface Recitation {
  surah: number;
  surahName: string;
  from: number;
  to: number;
  href: string;
}

export interface DaySchedule {
  /** Whether today is one of the chosen days. */
  today: boolean;
  label: string;
  /** "غدًا" or a weekday name, for "your next session is …". */
  next: string | null;
}

export interface TodayView {
  kind: "memorize" | "review";
  status: "active" | "completed";
  startJuz: number | null;
  endJuz: number | null;
  /** "حفظ الجزء ٣٠", "حفظ الأجزاء ٢٦–٣٠", or with surah edges "حفظ من سورة الملك إلى سورة المرسلات". */
  rangeLabel: string;
  totalPages: number;
  pagesDone: number;
  percent: number;
  /** YYYY-MM-DD of the expected last session, keeping to the chosen days. */
  finishDay: string | null;
  streak: number;
  dailyLabel: string;
  reviewLabel: string;
  /** What the learner knew before the plan: whole juz first, then surahs. */
  known: string[];
  /** Pages in the older-pages rotation, and how far into the current round it is. */
  pool: { pages: number; position: number };
  newDays: DaySchedule;
  reviewDays: DaySchedule;
  /**
   * Null when there's nothing new to memorize; `parts` is null when the Quran API is unreachable.
   * `readHref` opens the reader on just the portion's pages.
   */
  newPortion: { done: boolean; parts: PortionPart[] | null; readHref: string | null } | null;
  recent: PageLink[];
  far: PageLink[];
  /** Today's review as surah stretches, for "سمّع المراجعة"; empty when the Quran API is unreachable. */
  recitations: Recitation[];
  /** The recent review opened on its pages only (they follow each other). */
  recentHref: string | null;
  reviewDone: boolean;
  /** The plan's current settings, for the edit form. */
  settings: {
    unitsPerDay: number;
    farPages: number;
    newDays: number[];
    reviewDays: number[];
    priorSurahs: number[];
    priorJuz: number[];
  };
}

function schedule(days: number[], today: string): DaySchedule {
  const next = nextScheduledDay(days, shiftDay(today, 1));
  return {
    today: days.includes(weekday(today)),
    label: daysLabel(days),
    next: next === null ? null : next === shiftDay(today, 1) ? "غدًا" : `يوم ${WEEKDAY_NAMES[weekday(next)]}`,
  };
}

/** The review pages' ayahs, merged into one stretch per run of consecutive ayahs of a surah. */
async function recitationsFor(pages: number[], name: (surah: number) => string): Promise<Recitation[]> {
  const unique = [...new Set(pages)].sort((a, b) => a - b);
  const ayahs = (await Promise.all(unique.map((page) => getPageAyahs(page)))).flat();
  const stretches: Omit<Recitation, "surahName" | "href">[] = [];
  for (const ayah of ayahs) {
    const last = stretches.at(-1);
    if (last && last.surah === ayah.surah && last.to === ayah.numberInSurah - 1) last.to = ayah.numberInSurah;
    else stretches.push({ surah: ayah.surah, from: ayah.numberInSurah, to: ayah.numberInSurah });
  }
  return stretches.map((stretch) => ({
    ...stretch,
    surahName: name(stretch.surah),
    href: `/tasmee?surah=${stretch.surah}&from=${stretch.from}&to=${stretch.to}`,
  }));
}

/** The reader on pages first..last only, returning to the plan when they're read. */
function boundedHref(surah: number, first: number, last: number): string {
  return `/quran/${surah}?page=${first}&until=${last}&wird=plan`;
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

  const range = plan.status === "active" && plan.kind === "memorize" ? todayNewRange(plan, newToday) : null;
  let newPortion: TodayView["newPortion"] = null;
  const bounds = planBounds(plan);
  if (range && bounds) {
    const segments = unitsToSegments(plan, range);
    const resolved = await resolveSegments(segments, bounds);
    const firstPage = segments[0]?.page;
    const lastPage = segments.at(-1)?.page;
    newPortion = {
      done: newToday !== null,
      readHref:
        firstPage === undefined || lastPage === undefined
          ? null
          : boundedHref(resolved?.[0]?.spans[0]?.surah ?? surahAtPage(pageStarts, firstPage), firstPage, lastPage),
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

  const pool = farPool(plan, recent.from).length;
  const memorize = plan.kind === "memorize";
  const recentPages = plan.status === "active" ? unitsToSegments(plan, recent).map(link) : [];
  const farLinks = plan.status === "active" ? farPages(plan, recent.from, cursor).map((page) => link({ page, half: "full" })) : [];
  const recitations = await recitationsFor(
    [...recentPages, ...farLinks].map((entry) => entry.page),
    name,
  ).catch(() => []);

  return {
    kind: plan.kind,
    status: plan.status === "completed" ? "completed" : "active",
    startJuz: plan.start_juz,
    endJuz: plan.end_juz,
    rangeLabel:
      plan.start_surah !== null && plan.end_surah !== null
        ? plan.start_surah === plan.end_surah
          ? `حفظ سورة ${name(plan.start_surah)}`
          : `حفظ من سورة ${name(plan.start_surah)} إلى سورة ${name(plan.end_surah)}`
        : plan.start_juz === plan.end_juz
          ? `حفظ الجزء ${toArabicDigits(plan.start_juz ?? 0)}`
          : `حفظ الأجزاء ${toArabicDigits(plan.start_juz ?? 0)}–${toArabicDigits(plan.end_juz ?? 0)}`,
    totalPages: total / 2,
    pagesDone: plan.progress_units / 2,
    percent: total > 0 ? Math.round((plan.progress_units / total) * 100) : 0,
    finishDay: memorize ? finishDay(sessionsLeft(plan), plan.new_days, today, newToday !== null) : null,
    streak: streak(
      log.filter((row) => row.kind === (memorize ? "new" : "review")).map((row) => row.day),
      today,
      memorize ? plan.new_days : plan.review_days,
    ),
    dailyLabel: unitsLabel(plan.units_per_day),
    reviewLabel: pagesLabel(plan.far_review_pages),
    known: [...plan.prior_juz.map(juzLabel), ...plan.prior_surahs.map((surah) => `سورة ${name(surah)}`)],
    pool: { pages: pool, position: pool === 0 ? 0 : cursor % pool },
    newDays: schedule(plan.new_days, today),
    reviewDays: schedule(plan.review_days, today),
    newPortion,
    recent: recentPages,
    far: farLinks,
    recitations,
    recentHref:
      recentPages.length > 0
        ? boundedHref(surahAtPage(pageStarts, recentPages[0]!.page), recentPages[0]!.page, recentPages.at(-1)!.page)
        : null,
    reviewDone: reviewToday !== null,
    settings: {
      unitsPerDay: plan.units_per_day,
      farPages: plan.far_review_pages,
      newDays: plan.new_days,
      reviewDays: plan.review_days,
      priorSurahs: plan.prior_surahs,
      priorJuz: plan.prior_juz,
    },
  };
}
