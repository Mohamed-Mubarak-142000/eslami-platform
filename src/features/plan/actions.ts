"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSession } from "@/features/auth/session";
import type { FormState } from "@/features/auth/actions";
import { getJuzStarts, getMushafPageStarts } from "@/features/quran/textApi";
import { loadCurrentPlan, loggedOn } from "./data";
import { resolveSegments, spansToAyahs } from "./portion";
import {
  buildJuzPages,
  nextCursor,
  PAGES_PER_DAY_OPTIONS,
  planDay,
  recentRange,
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

const planSchema = z
  .object({
    startJuz: z.coerce.number().int().min(1).max(30),
    endJuz: z.coerce.number().int().min(1).max(30),
    unitsPerDay: z.coerce
      .number()
      .int()
      .refine((value) => (PAGES_PER_DAY_OPTIONS as readonly number[]).includes(value), "اختر مقدارًا من القائمة"),
    farPages: z.coerce.number().int().min(0, "اختر عددًا من القائمة").max(20, "اختر عددًا من القائمة"),
  })
  .refine((value) => value.startJuz <= value.endJuz, { path: ["endJuz"], message: "جزء النهاية يأتي بعد جزء البداية" });

export async function createPlanAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  const { activeLearner } = await requireSession("/plan");
  const parsed = planSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const issue = parsed.error.issues[0]!;
    return { fieldErrors: { [String(issue.path[0] ?? "form")]: issue.message } };
  }
  const { startJuz, endJuz, unitsPerDay, farPages } = parsed.data;

  const [juzStarts, pageStarts] = await Promise.all([getJuzStarts(), getMushafPageStarts()]);
  const juzPages = buildJuzPages(juzStarts, pageStarts);
  if (juzPages.length === 0) return { error: "تعذّر الوصول إلى بيانات المصحف الآن، حاول بعد قليل." };

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
    start_juz: startJuz,
    end_juz: endJuz,
    start_page: juzPages[startJuz - 1]!.startPage,
    end_page: juzPages[endJuz - 1]!.endPage,
    units_per_day: unitsPerDay,
    far_review_pages: farPages,
  });
  if (error) return { error: GENERIC_ERROR };
  revalidate();
  return { message: "أُنشئت خطتك، بالتوفيق!" };
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

  const range = todayNewRange(plan, null);
  if (!range) return {};
  const segments = await resolveSegments(unitsToSegments(plan, range), { start: plan.start_juz, end: plan.end_juz });
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
    // so the page can still show what was reviewed after the cursor moves. The cursor is always
    // below anchor / 2, which keeps from_unit <= to_unit.
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
