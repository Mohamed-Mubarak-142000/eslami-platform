import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getJuzStarts } from "@/features/quran/textApi";
import { buildJuzRanges, type JuzRange } from "@/features/progress/juz";

type Client = SupabaseClient<Database>;

const PAGE_SIZE = 1000;

/** What a learner must finish in a juz before its exam opens. */
export interface JuzReadiness {
  juz: number;
  totalAyahs: number;
  /** Ayahs of the juz marked as memorized. */
  memorized: number;
  /** Ayahs of the juz covered by at least one تسميع session. */
  recited: number;
  ready: boolean;
}

/** Reads every row of a query page by page (PostgREST caps a single response). */
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

function readiness(
  range: JuzRange,
  memorized: Set<string>,
  recitals: { surah: number; ayah_from: number; ayah_to: number }[],
): JuzReadiness {
  let memorizedCount = 0;
  let recitedCount = 0;
  for (const segment of range.segments) {
    const sessions = recitals.filter((row) => row.surah === segment.surah);
    for (let ayah = segment.from; ayah <= segment.to; ayah += 1) {
      if (memorized.has(`${segment.surah}:${ayah}`)) memorizedCount += 1;
      if (sessions.some((row) => row.ayah_from <= ayah && row.ayah_to >= ayah)) recitedCount += 1;
    }
  }
  return {
    juz: range.juz,
    totalAyahs: range.totalAyahs,
    memorized: memorizedCount,
    recited: recitedCount,
    ready: range.totalAyahs > 0 && memorizedCount === range.totalAyahs && recitedCount === range.totalAyahs,
  };
}

/**
 * Exam readiness per juz for one learner. Returns null when the juz boundaries can't be loaded,
 * so callers fail closed instead of opening an exam they couldn't verify.
 */
export async function getJuzReadiness(client: Client, learnerId: string, juzList?: number[]): Promise<Record<number, JuzReadiness> | null> {
  const ranges = buildJuzRanges(await getJuzStarts()).filter((range) => !juzList || juzList.includes(range.juz));
  if (ranges.length === 0) return null;
  const surahs = [...new Set(ranges.flatMap((range) => range.segments.map((segment) => segment.surah)))];

  const [memorizedRows, recitals] = await Promise.all([
    fetchAll((from, to) =>
      client
        .from("memorized_ayahs")
        .select("surah, ayah")
        .eq("learner_id", learnerId)
        .in("surah", surahs)
        .order("surah")
        .order("ayah")
        .range(from, to),
    ),
    fetchAll((from, to) =>
      client
        .from("tasmee_sessions")
        .select("surah, ayah_from, ayah_to")
        .eq("learner_id", learnerId)
        .in("surah", surahs)
        .order("id")
        .range(from, to),
    ),
  ]);
  const memorized = new Set(memorizedRows.map((row) => `${row.surah}:${row.ayah}`));
  return Object.fromEntries(ranges.map((range) => [range.juz, readiness(range, memorized, recitals)]));
}
