import { z } from "zod";

const numberArray = z.array(z.number().int().nonnegative());

export const kidsProgressSchema = z.object({
  version: z.literal(1),
  memorizedAyahsBySurah: z.record(z.string(), numberArray),
  quizStats: z.object({
    attempts: z.number().int().nonnegative(),
    bestScorePercent: z.number().min(0).max(100),
    totalCorrect: z.number().int().nonnegative(),
    totalQuestions: z.number().int().nonnegative(),
    lastPlayedAt: z.string().nullable(),
  }),
  matchStats: z.object({
    tajweedGamesCompleted: z.number().int().nonnegative(),
    letterGamesCompleted: z.number().int().nonnegative(),
    lastPlayedAt: z.string().nullable(),
  }),
  listenStats: z.object({
    surahsCompleted: numberArray,
    lastPlayedAt: z.string().nullable(),
  }),
  unlockedBadgeIds: z.array(z.string()),
  activityDates: z.array(z.string()).default([]),
  reviewSchedule: z
    .record(
      z.string(),
      z.object({
        intervalIndex: z.number().int().nonnegative(),
        lastReviewedAt: z.string(),
        dueAt: z.string(),
      }),
    )
    .default({}),
  updatedAt: z.string(),
});
