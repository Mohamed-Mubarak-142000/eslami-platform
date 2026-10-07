import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHizbStarts, getJuzStarts, getMushafPageStarts } from "@/features/quran/textApi";
import type { KhatmaLogRow, KhatmaRow } from "@/lib/supabase/database.types";
import { buildBoundaries, TOTAL_AYAHS, type Boundaries } from "./schedule";

type Client = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export interface KhatmaWithLog {
  khatma: KhatmaRow;
  log: Pick<KhatmaLogRow, "day" | "from_ayah" | "to_ayah">[];
  /** How many khatmas this learner has finished, this one included. */
  finished: number;
}

/** The learner's newest khatma that isn't archived (active, or just finished), with its log. */
export async function loadCurrentKhatma(supabase: Client, learnerId: string): Promise<KhatmaWithLog | null> {
  const [{ data: khatma }, { count }] = await Promise.all([
    supabase
      .from("khatmas")
      .select("*")
      .eq("learner_id", learnerId)
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("khatmas").select("id", { count: "exact", head: true }).eq("learner_id", learnerId).not("completed_at", "is", null),
  ]);
  if (!khatma) return null;
  // Before migration 20261007000002 the range columns are missing: every khatma then covers the whole mushaf.
  khatma.start_ayah ??= 0;
  khatma.end_ayah ??= TOTAL_AYAHS;
  const { data: log } = await supabase
    .from("khatma_log")
    .select("day, from_ayah, to_ayah")
    .eq("khatma_id", khatma.id)
    .order("day", { ascending: false })
    .limit(400);
  return { khatma, log: log ?? [], finished: count ?? 0 };
}

/** Where every page, hizb, juz and surah begins; null when the Quran API is unreachable. */
export async function loadBoundaries(): Promise<Boundaries | null> {
  const [pages, juz, hizb] = await Promise.all([getMushafPageStarts(), getJuzStarts(), getHizbStarts()]);
  return buildBoundaries(pages, juz, hizb);
}
