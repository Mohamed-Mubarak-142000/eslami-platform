"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAccount } from "@/features/account/AccountProvider";
import { DEFAULT_KIDS_PROGRESS, type KidsProgressState } from "./progressTypes";
import { clearKidsProgress, loadKidsProgress, saveKidsProgress } from "./progressStorage";
import { computeUnlockedBadgeIds } from "./badges";
import { recordActivityDate } from "./streak";
import { advanceReviewSchedule, isSurahFullyMemorized, startReviewSchedule } from "./reviewSchedule";
import { loadRemoteProgress, remoteWriter, type GameRecord, type RemoteWriter } from "./remoteProgress";

type Listener = () => void;
export type ProgressStatus = "ready" | "loading" | "error";

interface Snapshot {
  state: KidsProgressState;
  status: ProgressStatus;
  /** null = on-device guest progress; otherwise the synced learner. */
  learnerId: string | null;
}

const SERVER_SNAPSHOT: Snapshot = { state: DEFAULT_KIDS_PROGRESS, status: "ready", learnerId: null };

function hasGuestProgress(state: KidsProgressState): boolean {
  return (
    Object.values(state.memorizedAyahsBySurah).some((ayahs) => ayahs.length > 0) ||
    state.quizStats.attempts > 0 ||
    state.matchStats.tajweedGamesCompleted + state.matchStats.letterGamesCompleted > 0 ||
    state.listenStats.surahsCompleted.length > 0
  );
}

/** Pushes the difference between two states to the server; games are passed explicitly (counts don't diff). */
async function pushDiff(writer: RemoteWriter, prev: KidsProgressState, next: KidsProgressState, games: GameRecord[]) {
  const writes: Promise<unknown>[] = [];
  const surahs = new Set([...Object.keys(prev.memorizedAyahsBySurah), ...Object.keys(next.memorizedAyahsBySurah)].map(Number));
  for (const surah of surahs) {
    const before = new Set(prev.memorizedAyahsBySurah[surah] ?? []);
    const after = new Set(next.memorizedAyahsBySurah[surah] ?? []);
    writes.push(
      writer.setAyahs(
        surah,
        [...after].filter((ayah) => !before.has(ayah)),
        true,
      ),
    );
    writes.push(
      writer.setAyahs(
        surah,
        [...before].filter((ayah) => !after.has(ayah)),
        false,
      ),
    );
  }
  for (const [surah, review] of Object.entries(next.reviewSchedule)) {
    if (prev.reviewSchedule[Number(surah)]?.lastReviewedAt !== review.lastReviewedAt) writes.push(writer.setReview(Number(surah), review));
  }
  writes.push(writer.addActivityDays(next.activityDates.filter((day) => !prev.activityDates.includes(day))));
  writes.push(writer.addBadges(next.unlockedBadgeIds.filter((id) => !prev.unlockedBadgeIds.includes(id))));
  writes.push(writer.addListens(next.listenStats.surahsCompleted.filter((surah) => !prev.listenStats.surahsCompleted.includes(surah))));
  writes.push(writer.addGames(games));
  await Promise.all(writes);
}

/** Per-provider store — instantiated once per `KidsProgressProvider` mount, never shared at module scope. */
function createProgressStore() {
  let snapshot: Snapshot | null = null;
  let writer: RemoteWriter | null = null;
  let listeners: Listener[] = [];

  function set(next: Snapshot) {
    snapshot = next;
    for (const listener of listeners) listener();
  }

  return {
    getSnapshot(): Snapshot {
      snapshot ??= { state: loadKidsProgress(), status: "ready", learnerId: null };
      return snapshot;
    },
    subscribe(listener: Listener): () => void {
      listeners = [...listeners, listener];
      return () => {
        listeners = listeners.filter((item) => item !== listener);
      };
    },
    /** Switches between guest (device) progress and a signed-in learner's synced progress. */
    connect(learnerId: string | null) {
      if (this.getSnapshot().learnerId === learnerId) return;
      const supabase = learnerId ? getSupabaseBrowserClient() : null;
      if (!learnerId || !supabase) {
        writer = null;
        set({ state: loadKidsProgress(), status: "ready", learnerId: null });
        return;
      }
      writer = remoteWriter(supabase, learnerId);
      set({ state: DEFAULT_KIDS_PROGRESS, status: "loading", learnerId });
      loadRemoteProgress(supabase, learnerId).then(
        (state) => snapshot?.learnerId === learnerId && set({ state, status: "ready", learnerId }),
        () => snapshot?.learnerId === learnerId && set({ ...snapshot, status: "error" }),
      );
    },
    commit(next: KidsProgressState, games: GameRecord[] = []) {
      const current = this.getSnapshot();
      set({ ...current, state: next });
      if (!current.learnerId) {
        saveKidsProgress(next);
        return;
      }
      const learnerId = current.learnerId;
      pushDiff(writer!, current.state, next, games).catch(() => snapshot?.learnerId === learnerId && set({ ...snapshot, status: "error" }));
    },
    async reset() {
      const current = this.getSnapshot();
      set({ ...current, state: DEFAULT_KIDS_PROGRESS });
      if (current.learnerId) await writer?.reset();
      else saveKidsProgress(DEFAULT_KIDS_PROGRESS);
    },
    /** One-time copy of this device's guest progress into the signed-in learner (union, never overwrite). */
    async mergeGuest(): Promise<boolean> {
      const current = this.getSnapshot();
      const guest = loadKidsProgress();
      if (!current.learnerId || !writer || current.status !== "ready") return false;
      const target = current.state;
      const memorizedAyahsBySurah = { ...target.memorizedAyahsBySurah };
      for (const [surah, ayahs] of Object.entries(guest.memorizedAyahsBySurah)) {
        memorizedAyahsBySurah[Number(surah)] = [...new Set([...(memorizedAyahsBySurah[Number(surah)] ?? []), ...ayahs])].sort(
          (a, b) => a - b,
        );
      }
      const merged: KidsProgressState = {
        ...target,
        memorizedAyahsBySurah,
        reviewSchedule: { ...guest.reviewSchedule, ...target.reviewSchedule },
        activityDates: [...new Set([...target.activityDates, ...guest.activityDates])].sort(),
        listenStats: {
          ...target.listenStats,
          surahsCompleted: [...new Set([...target.listenStats.surahsCompleted, ...guest.listenStats.surahsCompleted])],
        },
        quizStats: {
          attempts: target.quizStats.attempts + guest.quizStats.attempts,
          totalCorrect: target.quizStats.totalCorrect + guest.quizStats.totalCorrect,
          totalQuestions: target.quizStats.totalQuestions + guest.quizStats.totalQuestions,
          bestScorePercent: Math.max(target.quizStats.bestScorePercent, guest.quizStats.bestScorePercent),
          lastPlayedAt: target.quizStats.lastPlayedAt ?? guest.quizStats.lastPlayedAt,
        },
        matchStats: {
          tajweedGamesCompleted: target.matchStats.tajweedGamesCompleted + guest.matchStats.tajweedGamesCompleted,
          letterGamesCompleted: target.matchStats.letterGamesCompleted + guest.matchStats.letterGamesCompleted,
          lastPlayedAt: target.matchStats.lastPlayedAt ?? guest.matchStats.lastPlayedAt,
        },
      };
      merged.unlockedBadgeIds = computeUnlockedBadgeIds(merged);
      // Device stats are aggregates, so they arrive as one summary row per game kind.
      const games: GameRecord[] = [
        ...(guest.quizStats.attempts > 0
          ? [{ game: "quiz" as const, score: guest.quizStats.totalCorrect, total: guest.quizStats.totalQuestions }]
          : []),
        ...Array.from({ length: guest.matchStats.tajweedGamesCompleted }, () => ({ game: "tajweed" as const, score: 1, total: 1 })),
        ...Array.from({ length: guest.matchStats.letterGamesCompleted }, () => ({ game: "letters" as const, score: 1, total: 1 })),
      ];
      await pushDiff(writer, target, merged, games);
      set({ ...current, state: merged });
      clearKidsProgress();
      return true;
    },
  };
}

function withRecomputedBadges(state: KidsProgressState): KidsProgressState {
  return {
    ...state,
    unlockedBadgeIds: computeUnlockedBadgeIds(state),
    activityDates: recordActivityDate(state.activityDates),
    updatedAt: new Date().toISOString(),
  };
}

function toggleAyah(list: number[], numberInSurah: number, memorized: boolean): number[] {
  const withoutAyah = list.filter((value) => value !== numberInSurah);
  return memorized ? [...withoutAyah, numberInSurah].sort((a, b) => a - b) : withoutAyah;
}

const MERGE_FLAG_PREFIX = "al-manara:guest-merged:";

function readMergeFlag(userId: string): boolean {
  try {
    return window.localStorage.getItem(MERGE_FLAG_PREFIX + userId) === "1";
  } catch {
    return true;
  }
}

function writeMergeFlag(userId: string) {
  try {
    window.localStorage.setItem(MERGE_FLAG_PREFIX + userId, "1");
  } catch {
    // Without storage the offer simply shows again next visit.
  }
}

interface KidsProgressContextValue {
  state: KidsProgressState;
  status: ProgressStatus;
  /** True when progress is saved to the signed-in account rather than this device. */
  synced: boolean;
  setAyahMemorized: (surahId: number, numberInSurah: number, memorized: boolean) => void;
  setAyahsMemorized: (surahId: number, ayahs: number[], memorized: boolean) => void;
  recordQuizResult: (correct: number, total: number) => void;
  recordMatchGameCompletion: (kind: "tajweed" | "letters") => void;
  recordGame: (record: GameRecord) => void;
  recordListenCompletion: (surahId: number) => void;
  markSurahReviewed: (surahId: number) => void;
  resetProgress: () => void;
  /** Guest progress found on this device that the signed-in user hasn't merged or dismissed yet. */
  guestMergeAvailable: boolean;
  mergeGuestProgress: () => Promise<void>;
  dismissGuestMerge: () => void;
}

const KidsProgressContext = createContext<KidsProgressContextValue | null>(null);

export function KidsProgressProvider({ children }: { children: ReactNode }) {
  const account = useAccount();
  const [store] = useState(() => createProgressStore());
  const snapshot = useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot(),
    () => SERVER_SNAPSHOT,
  );
  const [mergeHandled, setMergeHandled] = useState<string | null>(null);
  const { state } = snapshot;

  const signedIn = account.status === "signed-in";
  const learnerId = signedIn ? account.activeLearner.id : null;
  const userId = signedIn ? account.account.id : null;

  useEffect(() => {
    // Wait for the account to resolve so guest progress isn't briefly shown to a signed-in user.
    if (account.status === "loading") return;
    store.connect(learnerId);
  }, [store, account.status, learnerId]);

  const guestMergeAvailable =
    userId !== null &&
    mergeHandled !== userId &&
    snapshot.learnerId !== null &&
    snapshot.status === "ready" &&
    !readMergeFlag(userId) &&
    hasGuestProgress(loadKidsProgress());

  function setAyahsMemorized(surahId: number, ayahs: number[], memorized: boolean) {
    const current = store.getSnapshot().state;
    const nextList = ayahs.reduce((list, ayah) => toggleAyah(list, ayah, memorized), current.memorizedAyahsBySurah[surahId] ?? []);
    const nextState = { ...current, memorizedAyahsBySurah: { ...current.memorizedAyahsBySurah, [surahId]: nextList } };

    const wasFullyMemorized = isSurahFullyMemorized(current, surahId);
    const isNowFullyMemorized = isSurahFullyMemorized(nextState, surahId);
    const reviewSchedule =
      isNowFullyMemorized && !wasFullyMemorized && !(surahId in current.reviewSchedule)
        ? { ...current.reviewSchedule, [surahId]: startReviewSchedule() }
        : current.reviewSchedule;

    store.commit(withRecomputedBadges({ ...nextState, reviewSchedule }));
  }

  function markSurahReviewed(surahId: number) {
    const current = store.getSnapshot().state;
    const existing = current.reviewSchedule[surahId];
    if (!existing) return;
    store.commit(
      withRecomputedBadges({ ...current, reviewSchedule: { ...current.reviewSchedule, [surahId]: advanceReviewSchedule(existing) } }),
    );
  }

  function recordQuizResult(correct: number, total: number) {
    const current = store.getSnapshot().state;
    const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
    store.commit(
      withRecomputedBadges({
        ...current,
        quizStats: {
          attempts: current.quizStats.attempts + 1,
          bestScorePercent: Math.max(current.quizStats.bestScorePercent, scorePercent),
          totalCorrect: current.quizStats.totalCorrect + correct,
          totalQuestions: current.quizStats.totalQuestions + total,
          lastPlayedAt: new Date().toISOString(),
        },
      }),
      [{ game: "quiz", score: correct, total }],
    );
  }

  function recordGame(record: GameRecord) {
    const current = store.getSnapshot().state;
    const isMatch = record.game === "tajweed" || record.game === "letters";
    store.commit(
      withRecomputedBadges(
        isMatch
          ? {
              ...current,
              matchStats: {
                tajweedGamesCompleted: current.matchStats.tajweedGamesCompleted + (record.game === "tajweed" ? 1 : 0),
                letterGamesCompleted: current.matchStats.letterGamesCompleted + (record.game === "letters" ? 1 : 0),
                lastPlayedAt: new Date().toISOString(),
              },
            }
          : current,
      ),
      [record],
    );
  }

  function recordListenCompletion(surahId: number) {
    const current = store.getSnapshot().state;
    const surahsCompleted = current.listenStats.surahsCompleted.includes(surahId)
      ? current.listenStats.surahsCompleted
      : [...current.listenStats.surahsCompleted, surahId];
    store.commit(withRecomputedBadges({ ...current, listenStats: { surahsCompleted, lastPlayedAt: new Date().toISOString() } }));
  }

  function finishMerge() {
    if (!userId) return;
    writeMergeFlag(userId);
    setMergeHandled(userId);
  }

  return (
    <KidsProgressContext.Provider
      value={{
        state,
        status: snapshot.status,
        synced: snapshot.learnerId !== null,
        setAyahMemorized: (surahId, ayah, memorized) => setAyahsMemorized(surahId, [ayah], memorized),
        setAyahsMemorized,
        recordQuizResult,
        recordMatchGameCompletion: (kind) => recordGame({ game: kind, score: 1, total: 1 }),
        recordGame,
        recordListenCompletion,
        markSurahReviewed,
        resetProgress: () => void store.reset(),
        guestMergeAvailable,
        mergeGuestProgress: async () => {
          if (await store.mergeGuest()) finishMerge();
        },
        dismissGuestMerge: finishMerge,
      }}
    >
      {children}
    </KidsProgressContext.Provider>
  );
}

export function useKidsProgress(): KidsProgressContextValue {
  const context = useContext(KidsProgressContext);
  if (!context) throw new Error("useKidsProgress must be used within a KidsProgressProvider");
  return context;
}
