import "server-only";
import { daysLabel, finishDay, nextScheduledDay, planDay, shiftDay, streak, weekday, WEEKDAY_NAMES } from "@/features/plan/schedule";
import type { KhatmaWithLog } from "./data";
import { toArabicDigits } from "@/lib/arabic";
import {
  amountLabel,
  nextPortion,
  pageOfIndex,
  pagesInJuz,
  sessionsLeft,
  toRef,
  TOTAL_AYAHS,
  unitsInRange,
  type Boundaries,
} from "./schedule";

export interface KhatmaPortion {
  done: boolean;
  from: { surah: number; surahName: string; ayah: number };
  to: { surah: number; surahName: string; ayah: number };
  startPage: number;
  endPage: number;
  href: string;
}

export interface KhatmaView {
  status: "active" | "completed";
  amount: string;
  daysLabel: string;
  readsToday: boolean;
  /** "غدًا" or "يوم السبت", when today isn't a reading day. */
  nextDay: string | null;
  pagesDone: number;
  /** Pages in the khatma's range: 604 for the whole mushaf. */
  totalPages: number;
  percent: number;
  /** "المصحف كاملًا", "من سورة البقرة إلى سورة النساء", "من الجزء ١ إلى الجزء ٥". */
  scope: string;
  /** YYYY-MM-DD the last session lands on, keeping to the chosen days. */
  finishDay: string | null;
  targetDay: string | null;
  streak: number;
  finished: number;
  portion: KhatmaPortion | null;
}

export function buildKhatmaView(
  { khatma, log, finished }: KhatmaWithLog,
  boundaries: Boundaries,
  surahNames: Record<number, string>,
): KhatmaView {
  const today = planDay();
  const logged = log.find((row) => row.day === today);
  const range =
    khatma.status === "active" ? (logged ? { from: logged.from_ayah, to: logged.to_ayah } : nextPortion(khatma, boundaries)) : null;
  const end = (index: number) => {
    const ref = toRef(index);
    return { surah: ref.surah, surahName: surahNames[ref.surah] ?? String(ref.surah), ayah: ref.ayah };
  };
  const totalPages = unitsInRange(boundaries, "pages", khatma.start_ayah, khatma.end_ayah);
  const pagesDone = khatma.position >= khatma.end_ayah ? totalPages : unitsInRange(boundaries, "pages", khatma.start_ayah, khatma.position);
  const next = nextScheduledDay(khatma.days, shiftDay(today, 1));
  const juzHint = khatma.unit === "pages" ? pagesInJuz(khatma.per_session) : null;

  return {
    status: khatma.status === "completed" ? "completed" : "active",
    amount: `${amountLabel(khatma.unit, khatma.per_session)}${juzHint ? ` (${juzHint})` : ""}`,
    daysLabel: daysLabel(khatma.days),
    readsToday: khatma.days.includes(weekday(today)),
    nextDay: next === null ? null : next === shiftDay(today, 1) ? "غدًا" : `يوم ${WEEKDAY_NAMES[weekday(next)]}`,
    pagesDone,
    totalPages,
    percent: Math.round((pagesDone / Math.max(1, totalPages)) * 100),
    scope: scopeLabel(khatma.start_ayah, khatma.end_ayah, boundaries, surahNames),
    finishDay: finishDay(sessionsLeft(khatma, boundaries), khatma.days, today, logged !== undefined),
    targetDay: khatma.target_day,
    streak: streak(
      log.map((row) => row.day),
      today,
      khatma.days,
    ),
    finished,
    portion: range && {
      done: logged !== undefined,
      from: end(range.from),
      to: end(range.to - 1),
      startPage: pageOfIndex(boundaries, range.from),
      endPage: pageOfIndex(boundaries, range.to - 1),
      href: `/quran/${toRef(range.from).surah}?page=${pageOfIndex(boundaries, range.from)}`,
    },
  };
}

/** The khatma's range in words: whole mushaf, whole juz when it lines up with them, else surah to surah. */
function scopeLabel(start: number, end: number, boundaries: Boundaries, surahNames: Record<number, string>): string {
  if (start === 0 && end === TOTAL_AYAHS) return "المصحف كاملًا";
  const juzFrom = boundaries.juz.indexOf(start);
  const juzTo = end === TOTAL_AYAHS ? 30 : boundaries.juz.indexOf(end);
  if (juzFrom >= 0 && juzTo > juzFrom) {
    return juzTo === juzFrom + 1
      ? `الجزء ${toArabicDigits(juzTo)}`
      : `من الجزء ${toArabicDigits(juzFrom + 1)} إلى الجزء ${toArabicDigits(juzTo)}`;
  }
  const first = toRef(start).surah;
  const last = toRef(end - 1).surah;
  const name = (surah: number) => `سورة ${surahNames[surah] ?? surah}`;
  return first === last ? name(first) : `من ${name(first)} إلى ${name(last)}`;
}
