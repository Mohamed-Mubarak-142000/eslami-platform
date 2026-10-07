"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSession } from "@/features/auth/session";
import type { FormState } from "@/features/auth/actions";
import { planDay } from "@/features/plan/schedule";
import { loadBoundaries, loadCurrentKhatma } from "./data";
import { nextPortion, pagesForDuration, PER_SESSION_OPTIONS, scopeRange, unitsInRange, type KhatmaScope } from "./schedule";

const GENERIC_ERROR = "تعذّر حفظ الختمة، حاول مرة أخرى.";
const MUSHAF_ERROR = "تعذّر الوصول إلى بيانات المصحف الآن، حاول بعد قليل.";
const UNIQUE_VIOLATION = "23505";

function revalidate() {
  revalidatePath("/khatma");
  revalidatePath("/dashboard");
}

const schema = z
  .object({
    mode: z.enum(["amount", "duration"]),
    unit: z.enum(["pages", "hizb", "juz", "surah"]),
    perSession: z.coerce.number().int().min(1).max(604),
    targetDay: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "اختر تاريخ الختم")
      .or(z.literal("")),
    days: z.array(z.coerce.number().int().min(0).max(6)).transform((days) => [...new Set(days)].sort()),
    scope: z.enum(["all", "surah", "juz"]),
    fromSurah: z.coerce.number().int().min(1).max(114),
    toSurah: z.coerce.number().int().min(1).max(114),
    fromJuz: z.coerce.number().int().min(1).max(30),
    toJuz: z.coerce.number().int().min(1).max(30),
  })
  .superRefine((value, context) => {
    const issue = (path: string, message: string) => context.addIssue({ code: "custom", path: [path], message });
    if (value.days.length === 0) issue("days", "اختر يومًا واحدًا على الأقل للقراءة");
    if (value.scope === "surah" && value.fromSurah > value.toSurah) issue("toSurah", "سورة النهاية تأتي بعد سورة البداية");
    if (value.scope === "juz" && value.fromJuz > value.toJuz) issue("toJuz", "جزء النهاية يأتي بعد جزء البداية");
    if (value.mode === "amount" && !PER_SESSION_OPTIONS[value.unit].includes(value.perSession))
      issue("perSession", "اختر مقدارًا من القائمة");
    if (value.mode === "duration") {
      if (!value.targetDay) issue("targetDay", "اختر تاريخ الختم");
      else if (value.targetDay < planDay()) issue("targetDay", "اختر تاريخًا قادمًا");
    }
  });

export async function createKhatmaAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  const { activeLearner } = await requireSession("/khatma");
  const parsed = schema.safeParse({
    mode: formData.get("mode"),
    unit: formData.get("unit") ?? "pages",
    perSession: formData.get("perSession") ?? 1,
    targetDay: formData.get("targetDay") ?? "",
    days: formData.getAll("days"),
    scope: formData.get("scope") ?? "all",
    fromSurah: formData.get("fromSurah") ?? 1,
    toSurah: formData.get("toSurah") ?? 114,
    fromJuz: formData.get("fromJuz") ?? 1,
    toJuz: formData.get("toJuz") ?? 30,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0]!;
    return { fieldErrors: { [String(issue.path[0] ?? "form")]: issue.message } };
  }
  const { mode, unit, perSession, targetDay, days } = parsed.data;
  const scope: KhatmaScope =
    parsed.data.scope === "surah"
      ? { kind: "surah", from: parsed.data.fromSurah, to: parsed.data.toSurah }
      : parsed.data.scope === "juz"
        ? { kind: "juz", from: parsed.data.fromJuz, to: parsed.data.toJuz }
        : { kind: "all" };

  const boundaries = await loadBoundaries();
  if (!boundaries) return { error: MUSHAF_ERROR };
  const range = scopeRange(boundaries, scope);
  if (!range) return { fieldErrors: { [scope.kind === "juz" ? "toJuz" : "toSurah"]: "اختر بداية ونهاية صحيحتين" } };

  // Duration mode is stored as pages per session, worked out from the reading days left.
  let amount = { unit, perSession };
  if (mode === "duration") {
    const pages = pagesForDuration(planDay(), targetDay, days, unitsInRange(boundaries, "pages", range.from, range.to));
    if (pages === null) return { fieldErrors: { targetDay: "لا يوم قراءة قبل هذا التاريخ، اختر تاريخًا أبعد أو أيامًا أكثر." } };
    amount = { unit: "pages", perSession: pages };
  }

  const supabase = await createSupabaseServerClient();
  const { error: archiveError } = await supabase
    .from("khatmas")
    .update({ status: "archived" })
    .eq("learner_id", activeLearner.id)
    .neq("status", "archived");
  if (archiveError) return { error: GENERIC_ERROR };

  const { error } = await supabase.from("khatmas").insert({
    learner_id: activeLearner.id,
    unit: amount.unit,
    per_session: amount.perSession,
    mode,
    target_day: mode === "duration" ? targetDay : null,
    days,
    start_ayah: range.from,
    end_ayah: range.to,
    position: range.from,
  });
  if (error) return { error: GENERIC_ERROR };
  revalidate();
  return { message: "بدأت ختمتك، تقبّل الله منك." };
}

export interface KhatmaResult {
  error?: string;
}

/** Marks today's portion read and moves on; the last one finishes the khatma. Safe to press twice. */
export async function completeKhatmaTodayAction(): Promise<KhatmaResult> {
  const { activeLearner } = await requireSession("/khatma");
  const supabase = await createSupabaseServerClient();
  const [current, boundaries] = await Promise.all([loadCurrentKhatma(supabase, activeLearner.id), loadBoundaries()]);
  if (!current || current.khatma.status !== "active") return { error: "لا توجد ختمة جارية." };
  if (!boundaries) return { error: MUSHAF_ERROR };
  const { khatma, log } = current;
  const today = planDay();
  if (log.some((row) => row.day === today)) return {};
  const portion = nextPortion(khatma, boundaries);
  if (!portion) return {};

  const { error: logError } = await supabase.from("khatma_log").insert({
    khatma_id: khatma.id,
    learner_id: activeLearner.id,
    day: today,
    from_ayah: portion.from,
    to_ayah: portion.to,
  });
  if (logError) return logError.code === UNIQUE_VIOLATION ? {} : { error: GENERIC_ERROR };

  const finished = portion.to >= khatma.end_ayah;
  const { error } = await supabase
    .from("khatmas")
    .update({ position: portion.to, ...(finished && { status: "completed" as const, completed_at: new Date().toISOString() }) })
    .eq("id", khatma.id)
    .eq("position", portion.from);
  if (error) return { error: GENERIC_ERROR };
  revalidate();
  return {};
}

/** Ends the current khatma (it stays in history) so a new one can begin. */
export async function archiveKhatmaAction(): Promise<KhatmaResult> {
  const { activeLearner } = await requireSession("/khatma");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("khatmas")
    .update({ status: "archived" })
    .eq("learner_id", activeLearner.id)
    .neq("status", "archived");
  if (error) return { error: GENERIC_ERROR };
  revalidate();
  return {};
}
