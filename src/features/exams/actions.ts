"use server";

import { randomInt } from "node:crypto";
import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireSession, type Session } from "@/features/auth/session";
import { getJuzAyahs } from "@/features/quran/textApi";
import { getSurahs } from "@/features/quran/api";
import { generateExam, gradeExam } from "./examGenerator";
import { getExamSettings } from "./data";

const MAX_STARTS_PER_DAY = 6;
/** Network latency allowance after the timer reaches zero. */
const SUBMIT_GRACE_MS = 90_000;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface StartExamState {
  error?: string;
}

export interface SubmitExamResult {
  error?: string;
  status?: "passed" | "failed" | "expired";
  score?: number;
  total?: number;
  passPercent?: number;
  perQuestion?: boolean[];
  certificateCode?: string;
}

function verificationCode(): string {
  const chars = Array.from({ length: 10 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
  return `${chars.slice(0, 5)}-${chars.slice(5)}`;
}

function holderName(session: Session): string {
  const learner = session.activeLearner;
  if (learner.kind === "child") return learner.display_name;
  return session.profile.certificate_name.trim() || session.profile.full_name.trim() || learner.display_name;
}

export async function startExamAction(juz: number): Promise<StartExamState> {
  if (!Number.isInteger(juz) || juz < 1 || juz > 30) return { error: "رقم الجزء غير صحيح." };
  const session = await requireSession(`/exams/${juz}`);
  const learnerId = session.activeLearner.id;
  const admin = createSupabaseAdminClient();
  const settings = await getExamSettings();
  const now = Date.now();

  const [{ data: certificate }, { data: recent }] = await Promise.all([
    admin.from("certificates").select("id, revoked_at").eq("learner_id", learnerId).eq("juz", juz).maybeSingle(),
    admin
      .from("exam_attempts")
      .select("id, juz, status, expires_at, submitted_at, started_at")
      .eq("learner_id", learnerId)
      .gte("started_at", new Date(now - 24 * 3600_000).toISOString())
      .order("started_at", { ascending: false }),
  ]);
  if (certificate && !certificate.revoked_at) return { error: "حصلت على شهادة هذا الجزء بالفعل." };

  const active = recent?.find(
    (attempt) => attempt.juz === juz && attempt.status === "in_progress" && new Date(attempt.expires_at).getTime() > now,
  );
  if (active) redirect(`/exams/${juz}` as Route);

  const lastFailed = recent?.find((attempt) => attempt.juz === juz && attempt.status !== "in_progress" && attempt.status !== "passed");
  if (lastFailed && settings.retry_cooldown_hours > 0) {
    const retryAt = new Date(lastFailed.submitted_at ?? lastFailed.expires_at).getTime() + settings.retry_cooldown_hours * 3600_000;
    if (retryAt > now)
      return { error: `يمكنك إعادة اختبار هذا الجزء بعد ${Math.ceil((retryAt - now) / 3600_000)} ساعة. راجع حفظك حتى ذلك الحين.` };
  }
  if ((recent?.length ?? 0) >= MAX_STARTS_PER_DAY) return { error: "بلغت الحد اليومي لبدء الاختبارات، حاول غدًا." };

  const [ayahs, surahs] = await Promise.all([getJuzAyahs(juz), getSurahs()]);
  const exam =
    ayahs.length > 0
      ? generateExam(ayahs, settings.exam_question_count, Object.fromEntries(surahs.map((surah) => [surah.id, surah.name])))
      : null;
  if (!exam) return { error: "تعذّر تجهيز الاختبار الآن، حاول بعد قليل." };

  const { data: attempt, error } = await admin
    .from("exam_attempts")
    .insert({
      learner_id: learnerId,
      juz,
      questions: exam.questions,
      total: exam.questions.length,
      expires_at: new Date(now + settings.exam_minutes * 60_000).toISOString(),
    })
    .select("id")
    .single();
  if (error || !attempt) return { error: "تعذّر بدء الاختبار، حاول مرة أخرى." };
  const { error: keyError } = await admin.from("exam_answer_keys").insert({ attempt_id: attempt.id, key: exam.key });
  if (keyError) {
    await admin.from("exam_attempts").delete().eq("id", attempt.id);
    return { error: "تعذّر بدء الاختبار، حاول مرة أخرى." };
  }
  redirect(`/exams/${juz}` as Route);
}

export async function submitExamAction(attemptId: string, answers: number[]): Promise<SubmitExamResult> {
  const session = await requireSession("/exams");
  const admin = createSupabaseAdminClient();
  const { data: attempt } = await admin.from("exam_attempts").select("*").eq("id", attemptId).maybeSingle();
  // The attempt must belong to one of this account's learners.
  if (!attempt || !session.learners.some((learner) => learner.id === attempt.learner_id)) return { error: "الاختبار غير موجود." };
  if (attempt.status !== "in_progress") return { error: "تم تسليم هذا الاختبار من قبل." };

  const [{ data: keyRow }, settings] = await Promise.all([
    admin.from("exam_answer_keys").select("key").eq("attempt_id", attempt.id).single(),
    getExamSettings(),
  ]);
  const key = Array.isArray(keyRow?.key) ? (keyRow.key as number[]) : [];
  const sanitized = Array.from({ length: key.length }, (_, index) => (Number.isInteger(answers[index]) ? answers[index]! : -1));
  const { score, total, perQuestion } = gradeExam(key, sanitized);
  const expired = Date.now() > new Date(attempt.expires_at).getTime() + SUBMIT_GRACE_MS;
  const passed = !expired && total > 0 && (score / total) * 100 >= settings.exam_pass_percent;
  const status = expired ? "expired" : passed ? "passed" : "failed";

  // Conditional update: a second concurrent submit finds no in-progress row and stops here.
  const { data: updated } = await admin
    .from("exam_attempts")
    .update({ answers: sanitized, score, status, submitted_at: new Date().toISOString() })
    .eq("id", attempt.id)
    .eq("status", "in_progress")
    .select("id");
  if (!updated || updated.length === 0) return { error: "تم تسليم هذا الاختبار من قبل." };

  let certificateCode: string | undefined;
  if (passed) {
    const learner = session.learners.find((entry) => entry.id === attempt.learner_id)!;
    const name = learner.kind === "child" ? learner.display_name : holderName({ ...session, activeLearner: learner });
    const certificate = {
      holder_name: name,
      score,
      total,
      exam_attempt_id: attempt.id,
      issued_at: new Date().toISOString(),
      revoked_at: null,
    };
    for (let tries = 0; tries < 3 && !certificateCode; tries += 1) {
      const code = verificationCode();
      // A revoked certificate for the same juz is re-issued in place (unique per learner + juz).
      const { error } = await admin
        .from("certificates")
        .upsert(
          { learner_id: attempt.learner_id, juz: attempt.juz, verification_code: code, ...certificate },
          { onConflict: "learner_id,juz" },
        );
      if (!error) certificateCode = code;
    }
  }

  revalidatePath("/exams");
  revalidatePath("/dashboard");
  return {
    status,
    score,
    total,
    passPercent: settings.exam_pass_percent,
    perQuestion,
    ...(certificateCode ? { certificateCode } : {}),
  };
}
