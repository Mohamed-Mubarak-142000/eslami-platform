"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_KIDS_PROGRESS, type KidsProgressState } from "./progressTypes";
import { loadKidsProgress, saveKidsProgress } from "./progressStorage";
import { computeUnlockedBadgeIds } from "./badges";
import { recordActivityDate } from "./streak";
import { advanceReviewSchedule, isSurahFullyMemorized, startReviewSchedule } from "./reviewSchedule";

type Listener = () => void;

let cachedState: KidsProgressState | null = null;
let listeners: Listener[] = [];

function getSnapshot(): KidsProgressState {
  if (cachedState === null) cachedState = loadKidsProgress();
  return cachedState;
}

function getServerSnapshot(): KidsProgressState {
  return DEFAULT_KIDS_PROGRESS;
}

function subscribe(listener: Listener): () => void {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((item) => item !== listener);
  };
}

function commit(next: KidsProgressState) {
  cachedState = next;
  saveKidsProgress(next);
  for (const listener of listeners) listener();
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

interface KidsProgressContextValue {
  state: KidsProgressState;
  setAyahMemorized: (surahId: number, numberInSurah: number, memorized: boolean) => void;
  recordQuizResult: (correct: number, total: number) => void;
  recordMatchGameCompletion: (kind: "tajweed" | "letters") => void;
  recordListenCompletion: (surahId: number) => void;
  markSurahReviewed: (surahId: number) => void;
  resetProgress: () => void;
}

const KidsProgressContext = createContext<KidsProgressContextValue | null>(null);

export function KidsProgressProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function setAyahMemorized(surahId: number, numberInSurah: number, memorized: boolean) {
    const current = getSnapshot();
    const currentList = current.memorizedAyahsBySurah[surahId] ?? [];
    const nextList = toggleAyah(currentList, numberInSurah, memorized);
    const nextMemorized = { ...current.memorizedAyahsBySurah, [surahId]: nextList };
    const nextState = { ...current, memorizedAyahsBySurah: nextMemorized };

    const wasFullyMemorized = isSurahFullyMemorized(current, surahId);
    const isNowFullyMemorized = isSurahFullyMemorized(nextState, surahId);
    const reviewSchedule =
      isNowFullyMemorized && !wasFullyMemorized && !(surahId in current.reviewSchedule)
        ? { ...current.reviewSchedule, [surahId]: startReviewSchedule() }
        : current.reviewSchedule;

    commit(withRecomputedBadges({ ...nextState, reviewSchedule }));
  }

  function markSurahReviewed(surahId: number) {
    const current = getSnapshot();
    const existing = current.reviewSchedule[surahId];
    if (!existing) return;
    commit(withRecomputedBadges({ ...current, reviewSchedule: { ...current.reviewSchedule, [surahId]: advanceReviewSchedule(existing) } }));
  }

  function recordQuizResult(correct: number, total: number) {
    const current = getSnapshot();
    const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
    commit(
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
    );
  }

  function recordMatchGameCompletion(kind: "tajweed" | "letters") {
    const current = getSnapshot();
    commit(
      withRecomputedBadges({
        ...current,
        matchStats: {
          tajweedGamesCompleted: current.matchStats.tajweedGamesCompleted + (kind === "tajweed" ? 1 : 0),
          letterGamesCompleted: current.matchStats.letterGamesCompleted + (kind === "letters" ? 1 : 0),
          lastPlayedAt: new Date().toISOString(),
        },
      }),
    );
  }

  function recordListenCompletion(surahId: number) {
    const current = getSnapshot();
    const surahsCompleted = current.listenStats.surahsCompleted.includes(surahId)
      ? current.listenStats.surahsCompleted
      : [...current.listenStats.surahsCompleted, surahId];
    commit(withRecomputedBadges({ ...current, listenStats: { surahsCompleted, lastPlayedAt: new Date().toISOString() } }));
  }

  function resetProgress() {
    commit(DEFAULT_KIDS_PROGRESS);
  }

  return (
    <KidsProgressContext.Provider
      value={{ state, setAyahMemorized, recordQuizResult, recordMatchGameCompletion, recordListenCompletion, markSurahReviewed, resetProgress }}
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
