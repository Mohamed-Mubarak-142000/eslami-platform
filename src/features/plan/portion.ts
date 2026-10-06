import "server-only";
import { getPageAyahs, type PageAyah } from "@/features/quran/textApi";
import type { PageSegment } from "./schedule";

export interface SurahSpan {
  surah: number;
  from: number;
  to: number;
}

export interface ResolvedSegment extends PageSegment {
  spans: SurahSpan[];
  /** Opening words of the portion, so the learner can find it on the page. */
  opening: string;
}

/** A half page is the first or second half of the page's ayahs, split by count. */
function pickHalf(ayahs: PageAyah[], half: PageSegment["half"]): PageAyah[] {
  if (half === "full") return ayahs;
  const middle = Math.ceil(ayahs.length / 2);
  return half === "first" ? ayahs.slice(0, middle) : ayahs.slice(middle);
}

function toSpans(ayahs: PageAyah[]): SurahSpan[] {
  const spans: SurahSpan[] = [];
  for (const ayah of ayahs) {
    const last = spans[spans.length - 1];
    if (last && last.surah === ayah.surah && last.to === ayah.numberInSurah - 1) last.to = ayah.numberInSurah;
    else spans.push({ surah: ayah.surah, from: ayah.numberInSurah, to: ayah.numberInSurah });
  }
  return spans;
}

function openingWords(text: string, count = 5): string {
  const words = text.split(/\s+/).filter(Boolean);
  return words.slice(0, count).join(" ") + (words.length > count ? "…" : "");
}

export interface PlanBounds {
  startJuz: number;
  endJuz: number;
  startSurah: number | null;
  endSurah: number | null;
}

export function planBounds(plan: {
  start_juz: number | null;
  end_juz: number | null;
  start_surah: number | null;
  end_surah: number | null;
}): PlanBounds | null {
  if (plan.start_juz === null || plan.end_juz === null) return null;
  return { startJuz: plan.start_juz, endJuz: plan.end_juz, startSurah: plan.start_surah, endSurah: plan.end_surah };
}

/**
 * The exact ayahs of each segment, limited to the plan's juz and surahs (a page shared with a
 * neighboring juz or surah only counts its own part). Null when the Quran API is unreachable.
 */
export async function resolveSegments(segments: PageSegment[], bounds: PlanBounds): Promise<ResolvedSegment[] | null> {
  const pages = await Promise.all(segments.map((segment) => getPageAyahs(segment.page)));
  if (pages.some((ayahs) => ayahs.length === 0)) return null;
  const firstSurah = bounds.startSurah ?? 1;
  const lastSurah = bounds.endSurah ?? 114;
  return segments.map((segment, index) => {
    const own = pages[index]!.filter(
      (ayah) => ayah.juz >= bounds.startJuz && ayah.juz <= bounds.endJuz && ayah.surah >= firstSurah && ayah.surah <= lastSurah,
    );
    const ayahs = pickHalf(own, segment.half);
    return { ...segment, spans: toSpans(ayahs), opening: ayahs[0] ? openingWords(ayahs[0].text) : "" };
  });
}

/** Ayah numbers per surah, for marking them memorized. */
export function spansToAyahs(segments: ResolvedSegment[]): { surah: number; ayahs: number[] }[] {
  const bySurah = new Map<number, Set<number>>();
  for (const span of segments.flatMap((segment) => segment.spans)) {
    const set = bySurah.get(span.surah) ?? new Set<number>();
    for (let ayah = span.from; ayah <= span.to; ayah += 1) set.add(ayah);
    bySurah.set(span.surah, set);
  }
  return [...bySurah].map(([surah, set]) => ({ surah, ayahs: [...set].sort((a, b) => a - b) }));
}
