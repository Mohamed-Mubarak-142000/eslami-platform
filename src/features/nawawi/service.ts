import "server-only";
import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Session } from "@/features/auth/session";
import { getExamSettings } from "@/features/exams/data";
import { gradeExam } from "@/features/exams/examGenerator";
import { generateNawawiExam } from "./examGenerator";
import { FINAL_PART, NAWAWI, NAWAWI_PARTS, hadithsOfPart } from "./nawawiData";

/** Questions and minutes per exam: a part covers 10–12 hadiths, the final all 42. */
export const PART_EXAM = { questions: 10, minutes: 15 };
export const FINAL_EXAM = { questions: 20, minutes: 30 };
const MAX_STARTS_PER_DAY = 10;
/** Network latency allowance after the timer reaches zero. */
const SUBMIT_GRACE_MS = 90_000;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type StartNawawiOutcome = { error: string } | { attemptId: string; resumed: boolean };

export interface SubmitNawawiResult {
  error?: string;
  status?: "passed" | "failed" | "expired";
  score?: number;
  total?: number;
  passPercent?: number;
  perQuestion?: boolean[];
  certificateCode?: string;
}

export function examSize(part: number) {
  return part === FINAL_PART ? FINAL_EXAM : PART_EXAM;
}

function verificationCode(): string {
  const chars = Array.from({ length: 10 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
  return `${chars.slice(0, 5)}-${chars.slice(5)}`;
}

function holderName(session: Session, learnerId: string): string {
  const learner = session.learners.find((entry) => entry.id === learnerId)!;
  if (learner.kind === "child") return learner.display_name;
  return session.profile.certificate_name.trim() || session.profile.full_name.trim() || learner.display_name;
}

/**
 * Opens a Nawawi exam for the session's active learner: a part (1–4) at any time, the final once every
 * part is passed. A failed part may be retried right away (it is study, not certification); the final
 * waits out the juz exams' cooldown. `resumed` means an unexpired attempt was already running.
 */
export async function startNawawiExam(session: Session, part: number): Promise<StartNawawiOutcome> {
  if (!Number.isInteger(part) || part < 1 || part > FINAL_PART) return { error: "المرحلة غير صحيحة." };
  const learnerId = session.activeLearner.id;
  const admin = createSupabaseAdminClient();
  const settings = await getExamSettings();
  const now = Date.now();

  const [{ data: certificate }, { data: attempts }] = await Promise.all([
    admin.from("nawawi_certificates").select("revoked_at").eq("learner_id", learnerId).maybeSingle(),
    admin
      .from("nawawi_attempts")
      .select("id, part, status, expires_at, submitted_at, started_at")
      .eq("learner_id", learnerId)
      .order("started_at", { ascending: false })
      .limit(200),
  ]);
  if (part === FINAL_PART && certificate && !certificate.revoked_at) return { error: "حصلت على شهادة الأربعين النووية بالفعل." };
  if (part === FINAL_PART) {
    const missing = NAWAWI_PARTS.filter((entry) => !attempts?.some((attempt) => attempt.part === entry.id && attempt.status === "passed"));
    if (missing.length > 0) return { error: "اجتز اختبارات المراحل الأربع أولًا، ثم يُفتح لك الاختبار النهائي." };
  }

  const active = attempts?.find(
    (attempt) => attempt.part === part && attempt.status === "in_progress" && new Date(attempt.expires_at).getTime() > now,
  );
  if (active) return { attemptId: active.id, resumed: true };

  if (part === FINAL_PART && settings.retry_cooldown_hours > 0) {
    const lastFailed = attempts?.find(
      (attempt) => attempt.part === part && attempt.status !== "in_progress" && attempt.status !== "passed",
    );
    const retryAt =
      lastFailed && new Date(lastFailed.submitted_at ?? lastFailed.expires_at).getTime() + settings.retry_cooldown_hours * 3600_000;
    if (retryAt && retryAt > now)
      return { error: `يمكنك إعادة الاختبار النهائي بعد ${Math.ceil((retryAt - now) / 3600_000)} ساعة. راجع الأحاديث حتى ذلك الحين.` };
  }
  const today = attempts?.filter((attempt) => new Date(attempt.started_at).getTime() > now - 24 * 3600_000).length ?? 0;
  if (today >= MAX_STARTS_PER_DAY) return { error: "بلغت الحد اليومي لبدء الاختبارات، حاول غدًا." };

  const size = examSize(part);
  const exam = generateNawawiExam(hadithsOfPart(part), NAWAWI, size.questions);
  if (!exam || exam.questions.length !== size.questions) return { error: "تعذّر تجهيز الاختبار الآن، حاول بعد قليل." };

  const { data: attempt, error } = await admin
    .from("nawawi_attempts")
    .insert({
      learner_id: learnerId,
      part,
      questions: exam.questions,
      total: exam.questions.length,
      expires_at: new Date(now + size.minutes * 60_000).toISOString(),
    })
    .select("id")
    .single();
  if (error || !attempt) return { error: "تعذّر بدء الاختبار، حاول مرة أخرى." };
  const { error: keyError } = await admin.from("nawawi_answer_keys").insert({ attempt_id: attempt.id, key: exam.key });
  if (keyError) {
    await admin.from("nawawi_attempts").delete().eq("id", attempt.id);
    return { error: "تعذّر بدء الاختبار، حاول مرة أخرى." };
  }
  return { attemptId: attempt.id, resumed: false };
}

/** Grades an attempt; passing the final issues the learner's certificate. */
export async function submitNawawiExam(session: Session, attemptId: string, answers: unknown): Promise<SubmitNawawiResult> {
  const admin = createSupabaseAdminClient();
  const { data: attempt } = await admin.from("nawawi_attempts").select("*").eq("id", attemptId).maybeSingle();
  // The attempt must belong to one of this account's learners.
  if (!attempt || !session.learners.some((learner) => learner.id === attempt.learner_id)) return { error: "الاختبار غير موجود." };
  if (attempt.status !== "in_progress") return { error: "تم تسليم هذا الاختبار من قبل." };

  const [{ data: keyRow }, settings] = await Promise.all([
    admin.from("nawawi_answer_keys").select("key").eq("attempt_id", attempt.id).single(),
    getExamSettings(),
  ]);
  const key = Array.isArray(keyRow?.key) ? (keyRow.key as number[]) : [];
  const given: unknown[] = Array.isArray(answers) ? answers : [];
  const sanitized = Array.from({ length: key.length }, (_, index) => {
    const answer = given[index];
    return Number.isInteger(answer) ? (answer as number) : -1;
  });
  const { score, total, perQuestion } = gradeExam(key, sanitized);
  const expired = Date.now() > new Date(attempt.expires_at).getTime() + SUBMIT_GRACE_MS;
  const complete = total > 0 && total === attempt.total && Array.isArray(attempt.questions) && attempt.questions.length === total;
  // Integer comparison avoids floating-point edge cases right at the pass mark.
  const passed = !expired && complete && score * 100 >= settings.exam_pass_percent * total;
  const status = expired ? "expired" : passed ? "passed" : "failed";

  // Conditional update: a second concurrent submit finds no in-progress row and stops here.
  const { data: updated } = await admin
    .from("nawawi_attempts")
    .update({ answers: sanitized, score, status, submitted_at: new Date().toISOString() })
    .eq("id", attempt.id)
    .eq("status", "in_progress")
    .select("id");
  if (!updated || updated.length === 0) return { error: "تم تسليم هذا الاختبار من قبل." };

  let certificateCode: string | undefined;
  if (passed && attempt.part === FINAL_PART) {
    const { data: existing } = await admin
      .from("nawawi_certificates")
      .select("verification_code, revoked_at")
      .eq("learner_id", attempt.learner_id)
      .maybeSingle();
    if (existing && !existing.revoked_at) certificateCode = existing.verification_code;
    else {
      const certificate = {
        learner_id: attempt.learner_id,
        holder_name: holderName(session, attempt.learner_id),
        score,
        total,
        attempt_id: attempt.id,
        issued_at: new Date().toISOString(),
        revoked_at: null,
      };
      for (let tries = 0; tries < 3 && !certificateCode; tries += 1) {
        const code = verificationCode();
        // A revoked certificate is re-issued in place (one per learner).
        const { error } = await admin
          .from("nawawi_certificates")
          .upsert({ ...certificate, verification_code: code }, { onConflict: "learner_id" });
        if (!error) certificateCode = code;
      }
    }
  }

  revalidatePath("/nawawi");
  revalidatePath("/certificates/mine");
  return {
    status,
    score,
    total,
    passPercent: settings.exam_pass_percent,
    perQuestion,
    ...(certificateCode ? { certificateCode } : {}),
  };
}
