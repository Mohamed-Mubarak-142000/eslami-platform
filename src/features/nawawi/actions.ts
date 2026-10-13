"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth/session";
import { FINAL_PART, partSlug } from "./nawawiData";
import { startNawawiExam, submitNawawiExam, type SubmitNawawiResult } from "./service";

export type { SubmitNawawiResult };

export async function startNawawiExamAction(part: number): Promise<{ error?: string }> {
  if (!Number.isInteger(part) || part < 1 || part > FINAL_PART) return { error: "المرحلة غير صحيحة." };
  const path = `/nawawi/exam/${partSlug(part)}`;
  const session = await requireSession(path);
  const outcome = await startNawawiExam(session, part);
  if ("error" in outcome) return { error: outcome.error };
  redirect(path as Route);
}

export async function submitNawawiExamAction(attemptId: string, answers: number[]): Promise<SubmitNawawiResult> {
  const session = await requireSession("/nawawi");
  return submitNawawiExam(session, attemptId, answers);
}
