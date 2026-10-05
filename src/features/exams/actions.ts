"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth/session";
import { startExam, submitExam, type StartExamState, type SubmitExamResult } from "./service";

export type { StartExamState, SubmitExamResult };

export async function startExamAction(juz: number): Promise<StartExamState> {
  if (!Number.isInteger(juz) || juz < 1 || juz > 30) return { error: "رقم الجزء غير صحيح." };
  const session = await requireSession(`/exams/${juz}`);
  const outcome = await startExam(session, juz);
  if ("error" in outcome) return { error: outcome.error };
  redirect(`/exams/${juz}` as Route);
}

export async function submitExamAction(attemptId: string, answers: number[]): Promise<SubmitExamResult> {
  const session = await requireSession("/exams");
  return submitExam(session, attemptId, answers);
}
