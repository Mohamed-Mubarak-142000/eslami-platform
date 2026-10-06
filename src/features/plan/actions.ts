"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSession } from "@/features/auth/session";
import type { FormState } from "@/features/auth/actions";
import { getSurahAyahCount } from "@/features/kids/progress/surahAyahCounts";
import { buildJuzRanges, type JuzRange } from "@/features/progress/juz";
import { getJuzStarts, getMushafPageStarts } from "@/features/quran/textApi";
import { loadCurrentPlan, loggedOn } from "./data";
import { planBounds, resolveSegments, spansToAyahs } from "./portion";
import {
  buildJuzPages,
  nextCursor,
  PAGES_PER_DAY_OPTIONS,
  planDay,
  rangePages,
  recentRange,
  surahsToPages,
  todayNewRange,
  totalUnits,
  unitsToSegments,
} from "./schedule";

const GENERIC_ERROR = "تعذّر حفظ الخطة، حاول مرة أخرى.";
const UNIQUE_VIOLATION = "23505";

function revalidate() {
  revalidatePath("/plan");
  revalidatePath("/dashboard");
}

const daysSchema = z.array(z.coerce.number().int().min(0).max(6)).transform((days) => [...new Set(days)].sort());

const planSchema = z
  .object({
    kind: z.enum(["memorize", "review"]),
    startJuz: z.coerce.number().int().min(1).max(30),
    endJuz: z.coerce.number().int().min(1).max(30),
    startSurah: z.coerce.number().int().min(1).max(114).nullable(),
    endSurah: z.coerce.number().int().min(1).max(114).nullable(),
    unitsPerDay: z.coerce
      .number()
      .int()
      .refine((value) => (PAGES_PER_DAY_OPTIONS as readonly number[]).includes(value), "اختر مقدارًا من القائمة"),
    farPages: z.coerce.number().int().min(0, "اختر عددًا من القائمة").max(20, "اختر عددًا من القائمة"),
    priorSurahs: z
      .array(z.coerce.number().int().min(1).max(114))
      .max(114)
      .transform((surahs) => [...new Set(surahs)].sort((a, b) => a - b)),
    priorJuz: z
      .array(z.coerce.number().int().min(1).max(30))
      .max(30)
      .transform((juz) => [...new Set(juz)].sort((a, b) => a - b)),
    newDays: daysSchema,
    reviewDays: daysSchema,
  })
  .superRefine((value, context) => {
    const issue = (path: string, message: string) => context.addIssue({ code: "custom", path: [path], message });
    if (value.kind === "memorize") {
      if (value.startJuz > value.endJuz) issue("endJuz", "جزء النهاية يأتي بعد جزء البداية");
      else if (value.startSurah && value.endSurah && value.startSurah > value.endSurah)
        issue("endSurah", "سورة النهاية تأتي بعد سورة البداية");
      if (value.newDays.length === 0) issue("newDays", "اختر يومًا واحدًا على الأقل للحفظ");
    } else {
      if (value.priorSurahs.length === 0 && value.priorJuz.length === 0) issue("priorSurahs", PICK_PRIOR);
      if (value.farPages < 1) issue("farPages", "اختر عدد صفحات المراجعة");
      if (value.reviewDays.length === 0) issue("reviewDays", "اختر يومًا واحدًا على الأقل للمراجعة");
    }
  });

const PICK_PRIOR = "اختر السور أو الأجزاء التي تحفظها لنراجعها معك";

/** Every ayah of the given whole surahs and juz, per surah. */
function knownAyahs(surahs: number[], juz: number[], juzRanges: JuzRange[]): { surah: number; ayahs: number[] }[] {
  const bySurah = new Map<number, Set<number>>();
  const add = (surah: number, from: number, to: number) => {
    const set = bySurah.get(surah) ?? new Set<number>();
    for (let ayah = from; ayah <= to; ayah++) set.add(ayah);
    bySurah.set(surah, set);
  };
  for (const surah of surahs) add(surah, 1, getSurahAyahCount(surah));
  for (const segment of juz.flatMap((number) => juzRanges[number - 1]?.segments ?? [])) add(segment.surah, segment.from, segment.to);
  return [...bySurah].map(([surah, set]) => ({ surah, ayahs: [...set].sort((a, b) => a - b) }));
}

export interface PlanFormState extends FormState {
  /** Surahs the learner said they know, so the client marks them memorized in their progress. */
  memorized?: { surah: number; ayahs: number[] }[];
}

export async function createPlanAction(_: PlanFormState | undefined, formData: FormData): Promise<PlanFormState> {
  const { activeLearner } = await requireSession("/plan");
  const parsed = planSchema.safeParse({
    kind: formData.get("kind"),
    startJuz: formData.get("startJuz") ?? 1,
    endJuz: formData.get("endJuz") ?? 1,
    startSurah: formData.get("startSurah") || null,
    endSurah: formData.get("endSurah") || null,
    unitsPerDay: formData.get("unitsPerDay") ?? 2,
    farPages: formData.get("farPages"),
    priorSurahs: formData.getAll("priorSurahs"),
    priorJuz: formData.getAll("priorJuz"),
    newDays: formData.getAll("newDays"),
    reviewDays: formData.getAll("reviewDays"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0]!;
    return { fieldErrors: { [String(issue.path[0] ?? "form")]: issue.message } };
  }
  const { kind, startJuz, endJuz, unitsPerDay, farPages, priorSurahs, priorJuz, newDays, reviewDays } = parsed.data;

  const [juzStarts, pageStarts] = await Promise.all([getJuzStarts(), getMushafPageStarts()]);
  const juzPages = buildJuzPages(juzStarts, pageStarts);
  const juzRanges = buildJuzRanges(juzStarts);
  if (juzPages.length === 0 || juzRanges.length === 0) return { error: "تعذّر الوصول إلى بيانات المصحف الآن، حاول بعد قليل." };

  // A surah at the juz' own edge is the same as no surah: store null so the plan reads as whole juz.
  const startSegments = juzRanges[startJuz - 1]!.segments;
  const endSegments = juzRanges[endJuz - 1]!.segments;
  const startSurah = parsed.data.startSurah === startSegments[0]?.surah ? null : parsed.data.startSurah;
  const endSurah = parsed.data.endSurah === endSegments[endSegments.length - 1]?.surah ? null : parsed.data.endSurah;
  if (kind === "memorize") {
    if (startSurah && !startSegments.some((segment) => segment.surah === startSurah))
      return { fieldErrors: { startSurah: "اختر سورة من الجزء الذي تبدأ به" } };
    if (endSurah && !endSegments.some((segment) => segment.surah === endSurah))
      return { fieldErrors: { endSurah: "اختر سورة من الجزء الذي تنتهي به" } };
  }
  const surahPages = (surah: number | null): Record<number, [number, number]> => {
    if (!surah) return {};
    const pages = surahsToPages(pageStarts, [surah], getSurahAyahCount);
    return { [surah]: [pages[0]!, pages[pages.length - 1]!] };
  };
  const range =
    kind === "memorize"
      ? rangePages(juzPages, { ...surahPages(startSurah), ...surahPages(endSurah) }, { startJuz, endJuz, startSurah, endSurah })
      : null;
  if (kind === "memorize" && !range) return { fieldErrors: { endSurah: "سورة النهاية تأتي بعد سورة البداية" } };
  // The plan's own pages come into review as they're memorized, so leave them out of the prior pool.
  const juzPrior = priorJuz.flatMap((juz) => {
    const { startPage, endPage } = juzPages[juz - 1]!;
    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  });
  const priorPages = [...new Set([...surahsToPages(pageStarts, priorSurahs, getSurahAyahCount), ...juzPrior])]
    .filter((page) => !range || page < range.startPage || page > range.endPage)
    .sort((a, b) => a - b);
  if (kind === "review" && priorPages.length === 0) return { fieldErrors: { priorSurahs: PICK_PRIOR } };

  const supabase = await createSupabaseServerClient();
  // A new plan replaces the current one; its log stays with the archived row.
  const { error: archiveError } = await supabase
    .from("memorization_plans")
    .update({ status: "archived" })
    .eq("learner_id", activeLearner.id)
    .neq("status", "archived");
  if (archiveError) return { error: GENERIC_ERROR };

  const { error } = await supabase.from("memorization_plans").insert({
    learner_id: activeLearner.id,
    kind,
    start_juz: range ? startJuz : null,
    end_juz: range ? endJuz : null,
    start_page: range?.startPage ?? null,
    end_page: range?.endPage ?? null,
    start_surah: range ? startSurah : null,
    end_surah: range ? endSurah : null,
    units_per_day: unitsPerDay,
    far_review_pages: farPages,
    prior_surahs: priorSurahs,
    prior_juz: priorJuz,
    prior_pages: priorPages,
    new_days: kind === "memorize" ? newDays : [],
    review_days: reviewDays,
  });
  if (error) return { error: GENERIC_ERROR };
  revalidate();
  return {
    message: "أُنشئت خطتك، بالتوفيق!",
    memorized: knownAyahs(priorSurahs, priorJuz, juzRanges),
  };
}

export interface CompleteResult {
  error?: string;
  /** The ayahs just memorized, so the client marks them in the learner's progress. */
  memorized?: { surah: number; ayahs: number[] }[];
}

/** Marks today's new portion memorized and moves the plan forward. Safe to press twice. */
export async function completeNewAction(): Promise<CompleteResult> {
  const { activeLearner } = await requireSession("/plan");
  const supabase = await createSupabaseServerClient();
  const current = await loadCurrentPlan(supabase, activeLearner.id);
  if (!current || current.plan.status !== "active") return { error: "لا توجد خطة نشطة." };
  const { plan, log } = current;
  const today = planDay();
  if (loggedOn(log, today, "new")) return {};

  const range = plan.kind === "memorize" ? todayNewRange(plan, null) : null;
  const bounds = planBounds(plan);
  if (!range || !bounds) return {};
  const segments = await resolveSegments(unitsToSegments(plan, range), bounds);
  if (!segments) return { error: "تعذّر الوصول إلى بيانات المصحف الآن، حاول بعد قليل." };

  const { error: logError } = await supabase.from("memorization_plan_log").insert({
    plan_id: plan.id,
    learner_id: activeLearner.id,
    day: today,
    kind: "new",
    from_unit: range.from,
    to_unit: range.to,
  });
  if (logError) return logError.code === UNIQUE_VIOLATION ? {} : { error: GENERIC_ERROR };

  const finished = range.to >= totalUnits(plan);
  const { error } = await supabase
    .from("memorization_plans")
    .update({
      progress_units: range.to,
      ...(finished && { status: "completed" as const, completed_at: new Date().toISOString() }),
    })
    .eq("id", plan.id)
    .eq("progress_units", range.from);
  if (error) return { error: GENERIC_ERROR };
  revalidate();
  return { memorized: spansToAyahs(segments) };
}

/** Marks today's review (recent + older pages) done and rotates the older-pages slice. */
export async function completeReviewAction(): Promise<CompleteResult> {
  const { activeLearner } = await requireSession("/plan");
  const supabase = await createSupabaseServerClient();
  const current = await loadCurrentPlan(supabase, activeLearner.id);
  if (!current || current.plan.status !== "active") return { error: "لا توجد خطة نشطة." };
  const { plan, log } = current;
  const today = planDay();
  if (loggedOn(log, today, "review")) return {};

  const anchor = loggedOn(log, today, "new")?.from ?? plan.progress_units;
  const recentFrom = recentRange(plan, anchor).from;
  const cursor = nextCursor(plan, recentFrom, plan.review_cursor);
  const { error: logError } = await supabase.from("memorization_plan_log").insert({
    plan_id: plan.id,
    learner_id: activeLearner.id,
    day: today,
    kind: "review",
    // For review rows: from_unit = the older-pages cursor and to_unit = the recent window's anchor,
    // so the page can still show what was reviewed after the cursor moves.
    from_unit: plan.review_cursor,
    to_unit: anchor,
  });
  if (logError) return logError.code === UNIQUE_VIOLATION ? {} : { error: GENERIC_ERROR };

  const { error } = await supabase.from("memorization_plans").update({ review_cursor: cursor }).eq("id", plan.id);
  if (error) return { error: GENERIC_ERROR };
  revalidate();
  return {};
}

/** Stops the current plan (it stays in history) so a new one can be made. */
export async function archivePlanAction(): Promise<CompleteResult> {
  const { activeLearner } = await requireSession("/plan");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("memorization_plans")
    .update({ status: "archived" })
    .eq("learner_id", activeLearner.id)
    .neq("status", "archived");
  if (error) return { error: GENERIC_ERROR };
  revalidate();
  return {};
}
