import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppSettingsRow, CertificateRow } from "@/lib/supabase/database.types";
import type { ExamQuestion } from "./examGenerator";

const DEFAULT_SETTINGS: AppSettingsRow = {
  id: true,
  exam_question_count: 20,
  exam_pass_percent: 80,
  exam_minutes: 30,
  retry_cooldown_hours: 24,
  facebook_url: null,
  reminders_enabled: true,
  hijri_offset: 0,
  disabled_occasions: [],
  updated_at: new Date(0).toISOString(),
};

export const getExamSettings = cache(async (): Promise<AppSettingsRow> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("app_settings").select("*").eq("id", true).maybeSingle();
  return data ?? DEFAULT_SETTINGS;
});

export type JuzExamStatus =
  | { kind: "certified"; certificate: Pick<CertificateRow, "verification_code" | "score" | "total" | "issued_at"> }
  | { kind: "in-progress"; expiresAt: string }
  | { kind: "cooldown"; retryAt: string; lastScore: number | null; total: number }
  | { kind: "available"; lastScore: number | null; total: number | null };

/** Status of all 30 juz exams for one learner (RLS: the owner's session can read these rows). */
export async function getExamOverview(learnerId: string, cooldownHours: number): Promise<Record<number, JuzExamStatus>> {
  const supabase = await createSupabaseServerClient();
  const [{ data: certificates }, { data: attempts }] = await Promise.all([
    supabase.from("certificates").select("juz, verification_code, score, total, issued_at, revoked_at").eq("learner_id", learnerId),
    supabase
      .from("exam_attempts")
      .select("juz, status, score, total, expires_at, submitted_at, started_at")
      .eq("learner_id", learnerId)
      .order("started_at", { ascending: false })
      .limit(300),
  ]);
  const now = Date.now();
  const overview: Record<number, JuzExamStatus> = {};
  for (let juz = 1; juz <= 30; juz += 1) {
    const certificate = certificates?.find((entry) => entry.juz === juz && !entry.revoked_at);
    if (certificate) {
      overview[juz] = { kind: "certified", certificate };
      continue;
    }
    const latest = attempts?.find((attempt) => attempt.juz === juz);
    if (latest?.status === "in_progress" && new Date(latest.expires_at).getTime() > now) {
      overview[juz] = { kind: "in-progress", expiresAt: latest.expires_at };
      continue;
    }
    if (latest && latest.status !== "passed" && cooldownHours > 0) {
      const retryAt = new Date(latest.submitted_at ?? latest.expires_at).getTime() + cooldownHours * 3600_000;
      if (retryAt > now) {
        overview[juz] = { kind: "cooldown", retryAt: new Date(retryAt).toISOString(), lastScore: latest.score, total: latest.total };
        continue;
      }
    }
    overview[juz] = { kind: "available", lastScore: latest?.score ?? null, total: latest?.total ?? null };
  }
  return overview;
}

export interface ActiveAttempt {
  id: string;
  juz: number;
  questions: ExamQuestion[];
  expiresAt: string;
}

/** The learner's running attempt for a juz; attempts that ran out of time are closed as expired. */
export async function getActiveAttempt(learnerId: string, juz: number): Promise<ActiveAttempt | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("exam_attempts")
    .select("id, juz, questions, expires_at, status")
    .eq("learner_id", learnerId)
    .eq("juz", juz)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at).getTime() + 90_000 < Date.now()) {
    await createSupabaseAdminClient()
      .from("exam_attempts")
      .update({ status: "expired", score: 0, submitted_at: data.expires_at })
      .eq("id", data.id)
      .eq("status", "in_progress");
    return null;
  }
  return { id: data.id, juz: data.juz, questions: data.questions as ExamQuestion[], expiresAt: data.expires_at };
}
