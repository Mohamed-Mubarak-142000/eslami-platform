import { z } from "zod";
import type { KidsProgressState } from "./progressTypes";

const numberArray = z.array(z.number().int().nonnegative());

const GAME_KINDS = [
  "letters",
  "tajweed",
  "arrange",
  "quiz",
  "listen_pick",
  "ayah_order",
  "true_false",
  "surah_match",
  "kids_recite",
] as const;

// Accepts version 1 (before the journey) and fills the newer fields with defaults.
export const kidsProgressSchema = z
  .object({
    version: z.union([z.literal(1), z.literal(2)]),
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
    companion: z
      .object({ animal: z.enum(["bear", "panda", "rabbit", "fox"]), equipped: z.array(z.string()) })
      .nullable()
      .default(null),
    gameCounts: z.partialRecord(z.enum(GAME_KINDS), z.number().int().nonnegative()).optional(),
    surahSteps: z.record(z.string(), z.array(z.enum(["listen", "play", "recite"]))).default({}),
    dailyDone: z.record(z.string(), z.array(z.string())).default({}),
    ownedItems: z.array(z.string()).default([]),
    openedChests: z.record(z.string(), z.string()).default({}),
    passedQuizSurahs: numberArray.default([]),
    updatedAt: z.string(),
  })
  .transform((data): KidsProgressState => ({
    ...data,
    version: 2,
    // Version 1 only counted the letters and tajweed games.
    gameCounts: data.gameCounts ?? {
      letters: data.matchStats.letterGamesCompleted,
      tajweed: data.matchStats.tajweedGamesCompleted,
    },
  }));
