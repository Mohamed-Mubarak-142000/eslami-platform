"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, GameKind } from "@/lib/supabase/database.types";
import { DEFAULT_KIDS_PROGRESS, type KidsProgressState, type KidsSurahReview } from "./progressTypes";

type Client = SupabaseClient<Database>;

export interface GameRecord {
  game: GameKind;
  surah?: number | null;
  score: number;
  total: number;
  stars?: number | null;
  moves?: number | null;
}

/** Rebuilds the progress state for one learner from the normalized tables (RLS scopes every query). */
export async function loadRemoteProgress(supabase: Client, learnerId: string): Promise<KidsProgressState> {
  const [ayahs, reviews, days, games, listens, badges] = await Promise.all([
    supabase.from("memorized_ayahs").select("surah, ayah").eq("learner_id", learnerId).limit(10000),
    supabase.from("review_schedule").select("surah, interval_index, last_reviewed_at, due_at").eq("learner_id", learnerId),
    supabase.from("activity_days").select("day").eq("learner_id", learnerId).order("day").limit(2000),
    supabase.from("game_sessions").select("game, score, total, created_at").eq("learner_id", learnerId).order("created_at").limit(5000),
    supabase.from("listen_completions").select("surah, completed_at").eq("learner_id", learnerId),
    supabase.from("learner_badges").select("badge_id").eq("learner_id", learnerId),
  ]);
  const failed = [ayahs, reviews, days, games, listens, badges].find((result) => result.error);
  if (failed?.error) throw failed.error;

  const memorizedAyahsBySurah: Record<number, number[]> = {};
  for (const row of ayahs.data ?? []) (memorizedAyahsBySurah[row.surah] ??= []).push(row.ayah);
  for (const list of Object.values(memorizedAyahsBySurah)) list.sort((a, b) => a - b);

  const reviewSchedule: Record<number, KidsSurahReview> = {};
  for (const row of reviews.data ?? [])
    reviewSchedule[row.surah] = { intervalIndex: row.interval_index, lastReviewedAt: row.last_reviewed_at, dueAt: row.due_at };

  const quizStats = { ...DEFAULT_KIDS_PROGRESS.quizStats };
  const matchStats = { ...DEFAULT_KIDS_PROGRESS.matchStats };
  for (const row of games.data ?? []) {
    if (row.game === "quiz") {
      quizStats.attempts += 1;
      quizStats.totalCorrect += row.score;
      quizStats.totalQuestions += row.total;
      quizStats.bestScorePercent = Math.max(quizStats.bestScorePercent, row.total > 0 ? Math.round((row.score / row.total) * 100) : 0);
      quizStats.lastPlayedAt = row.created_at;
    } else if (row.game === "tajweed" || row.game === "letters") {
      if (row.game === "tajweed") matchStats.tajweedGamesCompleted += 1;
      else matchStats.letterGamesCompleted += 1;
      matchStats.lastPlayedAt = row.created_at;
    }
  }

  const listenRows = listens.data ?? [];
  return {
    ...DEFAULT_KIDS_PROGRESS,
    memorizedAyahsBySurah,
    reviewSchedule,
    quizStats,
    matchStats,
    listenStats: {
      surahsCompleted: listenRows.map((row) => row.surah),
      lastPlayedAt: listenRows.reduce<string | null>(
        (latest, row) => (!latest || row.completed_at > latest ? row.completed_at : latest),
        null,
      ),
    },
    activityDates: (days.data ?? []).map((row) => row.day),
    unlockedBadgeIds: (badges.data ?? []).map((row) => row.badge_id),
    updatedAt: new Date().toISOString(),
  };
}

/** Write-through operations; each is idempotent so a retry or a second tab cannot duplicate rows. */
export function remoteWriter(supabase: Client, learnerId: string) {
  const learner_id = learnerId;
  return {
    async setAyahs(surah: number, ayahs: number[], memorized: boolean) {
      if (ayahs.length === 0) return;
      if (memorized) {
        await supabase.from("memorized_ayahs").upsert(
          ayahs.map((ayah) => ({ learner_id, surah, ayah })),
          { onConflict: "learner_id,surah,ayah", ignoreDuplicates: true },
        );
      } else {
        await supabase.from("memorized_ayahs").delete().eq("learner_id", learner_id).eq("surah", surah).in("ayah", ayahs);
      }
    },
    async setReview(surah: number, review: KidsSurahReview) {
      await supabase
        .from("review_schedule")
        .upsert(
          { learner_id, surah, interval_index: review.intervalIndex, last_reviewed_at: review.lastReviewedAt, due_at: review.dueAt },
          { onConflict: "learner_id,surah" },
        );
    },
    async addActivityDays(days: string[]) {
      if (days.length === 0) return;
      await supabase.from("activity_days").upsert(
        days.map((day) => ({ learner_id, day })),
        { onConflict: "learner_id,day", ignoreDuplicates: true },
      );
    },
    async addBadges(badgeIds: string[]) {
      if (badgeIds.length === 0) return;
      await supabase.from("learner_badges").upsert(
        badgeIds.map((badge_id) => ({ learner_id, badge_id })),
        { onConflict: "learner_id,badge_id", ignoreDuplicates: true },
      );
    },
    async addListens(surahs: number[]) {
      if (surahs.length === 0) return;
      await supabase.from("listen_completions").upsert(
        surahs.map((surah) => ({ learner_id, surah })),
        { onConflict: "learner_id,surah", ignoreDuplicates: true },
      );
    },
    async addGames(games: GameRecord[]) {
      if (games.length === 0) return;
      await supabase
        .from("game_sessions")
        .insert(
          games.map((game) => ({
            learner_id,
            game: game.game,
            surah: game.surah ?? null,
            score: game.score,
            total: game.total,
            stars: game.stars ?? null,
            moves: game.moves ?? null,
          })),
        );
    },
    async reset() {
      await Promise.all(
        (["memorized_ayahs", "review_schedule", "activity_days", "game_sessions", "listen_completions", "learner_badges"] as const).map(
          (table) => supabase.from(table).delete().eq("learner_id", learner_id),
        ),
      );
    },
  };
}

export type RemoteWriter = ReturnType<typeof remoteWriter>;
