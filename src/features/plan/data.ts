import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MemorizationPlanLogRow, MemorizationPlanRow } from "@/lib/supabase/database.types";

type Client = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export interface PlanWithLog {
  plan: MemorizationPlanRow;
  log: Pick<MemorizationPlanLogRow, "day" | "kind" | "from_unit" | "to_unit">[];
}

/** The learner's newest plan that isn't archived (active, or just completed), with its log. */
export async function loadCurrentPlan(supabase: Client, learnerId: string): Promise<PlanWithLog | null> {
  const { data: plan } = await supabase
    .from("memorization_plans")
    .select("*")
    .eq("learner_id", learnerId)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!plan) return null;
  const { data: log } = await supabase
    .from("memorization_plan_log")
    .select("day, kind, from_unit, to_unit")
    .eq("plan_id", plan.id)
    .order("day", { ascending: false })
    .limit(400);
  return { plan, log: log ?? [] };
}

export function loggedOn(log: PlanWithLog["log"], day: string, kind: MemorizationPlanLogRow["kind"]) {
  const entry = log.find((row) => row.day === day && row.kind === kind);
  return entry ? { from: entry.from_unit, to: entry.to_unit } : null;
}
