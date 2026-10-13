import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { NawawiCertificateRow } from "@/lib/supabase/database.types";
import type { NawawiQuestion } from "./examGenerator";
import { FINAL_PART } from "./nawawiData";

export type NawawiPartStatus =
  | { kind: "passed"; score: number; total: number }
  | { kind: "in-progress" }
  | { kind: "available"; lastScore: number | null; total: number | null };

export interface NawawiOverview {
  /** Parts 1–4 and the final (5). */
  parts: Record<number, NawawiPartStatus>;
  certificate: Pick<NawawiCertificateRow, "verification_code" | "score" | "total" | "issued_at"> | null;
}

/** Where a learner stands in the course (RLS: the owner's session can read these rows). */
export async function getNawawiOverview(learnerId: string): Promise<NawawiOverview> {
  const supabase = await createSupabaseServerClient();
  const [{ data: certificate }, { data: attempts }] = await Promise.all([
    supabase
      .from("nawawi_certificates")
      .select("verification_code, score, total, issued_at, revoked_at")
      .eq("learner_id", learnerId)
      .maybeSingle(),
    supabase
      .from("nawawi_attempts")
      .select("part, status, score, total, expires_at")
      .eq("learner_id", learnerId)
      .order("started_at", { ascending: false })
      .limit(200),
  ]);
  const now = Date.now();
  const parts: Record<number, NawawiPartStatus> = {};
  for (let part = 1; part <= FINAL_PART; part += 1) {
    const mine = attempts?.filter((attempt) => attempt.part === part) ?? [];
    const best = mine.filter((attempt) => attempt.status === "passed").sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
    const latest = mine[0];
    parts[part] = best
      ? { kind: "passed", score: best.score ?? 0, total: best.total }
      : latest?.status === "in_progress" && new Date(latest.expires_at).getTime() > now
        ? { kind: "in-progress" }
        : { kind: "available", lastScore: latest?.score ?? null, total: latest?.total ?? null };
  }
  return { parts, certificate: certificate && !certificate.revoked_at ? certificate : null };
}

export interface ActiveNawawiAttempt {
  id: string;
  part: number;
  questions: NawawiQuestion[];
  expiresAt: string;
}

/** The learner's running attempt for a part; attempts that ran out of time are closed as expired. */
export async function getActiveNawawiAttempt(learnerId: string, part: number): Promise<ActiveNawawiAttempt | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("nawawi_attempts")
    .select("id, part, questions, expires_at")
    .eq("learner_id", learnerId)
    .eq("part", part)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at).getTime() + 90_000 < Date.now()) {
    await createSupabaseAdminClient()
      .from("nawawi_attempts")
      .update({ status: "expired", score: 0, submitted_at: data.expires_at })
      .eq("id", data.id)
      .eq("status", "in_progress");
    return null;
  }
  return { id: data.id, part: data.part, questions: data.questions as NawawiQuestion[], expiresAt: data.expires_at };
}
