"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSession } from "@/features/auth/session";
import type { FormState } from "@/features/auth/actions";
import { planDay } from "@/features/plan/schedule";
import { loadBoundaries, loadCurrentKhatma } from "./data";
import { nextPortion, pagesForDuration, PER_SESSION_OPTIONS, TOTAL_AYAHS } from "./schedule";

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
  })
  .superRefine((value, context) => {
    const issue = (path: string, message: string) => context.addIssue({ code: "custom", path: [path], message });
    if (value.days.length === 0) issue("days", "اختر يومًا واحدًا على الأقل للقراءة");
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
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0]!;
    return { fieldErrors: { [String(issue.path[0] ?? "form")]: issue.message } };
  }
  const { mode, unit, perSession, targetDay, days } = parsed.data;

  // Duration mode is stored as pages per session, worked out from the reading days left.
  let amount = { unit, perSession };
  if (mode === "duration") {
    const pages = pagesForDuration(planDay(), targetDay, days);
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

  const finished = portion.to >= TOTAL_AYAHS;
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
