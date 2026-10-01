"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CompanionAnimal } from "@/lib/supabase/database.types";
import { useAccount } from "@/features/account/AccountProvider";
import { DEFAULT_KIDS_PROGRESS, type KidsProgressState, type MissionStep } from "./progressTypes";
import { clearKidsProgress, loadKidsProgress, saveKidsProgress } from "./progressStorage";
import { computeUnlockedBadgeIds } from "./badges";
import { recordActivityDate } from "./streak";
import { advanceReviewSchedule, isSurahFullyMemorized, startReviewSchedule } from "./reviewSchedule";
import { isQuizPassed } from "./levels";
import { loadRemoteProgress, remoteWriter, type GameRecord, type RemoteWriter } from "./remoteProgress";
import { applyDailyEvent, type DailyEvent } from "./dailyChallenge";
import { gemBalance, ownedItemIds, rollChest, unopenedChests } from "./rewards";
import { getRewardItem } from "../rewards/catalog";

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
    Object.values(state.gameCounts).some((count) => (count ?? 0) > 0) ||
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
  if (JSON.stringify(prev.companion) !== JSON.stringify(next.companion)) writes.push(writer.setProfile(next.companion));
  writes.push(
    writer.addDailyTasks(
      Object.entries(next.dailyDone).flatMap(([day, tasks]) =>
        tasks.filter((task) => !(prev.dailyDone[day] ?? []).includes(task)).map((taskId) => ({ day, taskId })),
      ),
    ),
  );
  writes.push(
    writer.addRewards([
      ...next.ownedItems.filter((id) => !prev.ownedItems.includes(id)).map((refId) => ({ kind: "item" as const, refId })),
      ...Object.entries(next.openedChests)
        .filter(([chestId]) => !(chestId in prev.openedChests))
        .map(([refId, rewardId]) => ({ kind: "chest" as const, refId, rewardId })),
    ]),
  );
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
      // The companion stays: a reset clears learning progress, not who the child travels with.
      const cleared = { ...DEFAULT_KIDS_PROGRESS, companion: current.state.companion && { ...current.state.companion, equipped: [] } };
      set({ ...current, state: cleared });
      if (current.learnerId) {
        await writer?.reset();
        await writer?.setProfile(cleared.companion);
      } else saveKidsProgress(cleared);
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
      const union = <T,>(a: T[], b: T[]) => [...new Set([...a, ...b])];
      const gameCounts = { ...target.gameCounts };
      for (const [game, count] of Object.entries(guest.gameCounts) as [keyof typeof gameCounts, number][])
        gameCounts[game] = (gameCounts[game] ?? 0) + count;
      const surahSteps = { ...target.surahSteps };
      for (const [surah, steps] of Object.entries(guest.surahSteps))
        surahSteps[Number(surah)] = union(surahSteps[Number(surah)] ?? [], steps);
      const dailyDone = { ...target.dailyDone };
      for (const [day, tasks] of Object.entries(guest.dailyDone)) dailyDone[day] = union(dailyDone[day] ?? [], tasks);

      const merged: KidsProgressState = {
        ...target,
        memorizedAyahsBySurah,
        reviewSchedule: { ...guest.reviewSchedule, ...target.reviewSchedule },
        activityDates: union(target.activityDates, guest.activityDates).sort(),
        listenStats: {
          ...target.listenStats,
          surahsCompleted: union(target.listenStats.surahsCompleted, guest.listenStats.surahsCompleted),
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
        gameCounts,
        surahSteps,
        dailyDone,
        ownedItems: union(target.ownedItems, guest.ownedItems),
        openedChests: { ...guest.openedChests, ...target.openedChests },
        companion: target.companion ?? guest.companion,
        passedQuizSurahs: union(target.passedQuizSurahs, guest.passedQuizSurahs),
      };
      merged.unlockedBadgeIds = computeUnlockedBadgeIds(merged);
      // Device stats are aggregates, so they arrive as one summary row per quiz and one row per game played.
      const games: GameRecord[] = [
        ...(guest.quizStats.attempts > 0
          ? [{ game: "quiz" as const, score: guest.quizStats.totalCorrect, total: guest.quizStats.totalQuestions }]
          : []),
        ...(Object.entries(guest.gameCounts) as [GameRecord["game"], number][])
          .filter(([game]) => game !== "quiz")
          .flatMap(([game, count]) => Array.from({ length: count }, () => ({ game, score: 1, total: 1 }))),
        // Opened levels are derived from passed per-surah quiz rows, so each guest pass needs its own row.
        ...guest.passedQuizSurahs
          .filter((surah) => !target.passedQuizSurahs.includes(surah))
          .map((surah) => ({ game: "quiz" as const, surah, score: 1, total: 1 })),
      ];
      await pushDiff(writer, target, merged, games);
      set({ ...current, state: merged });
      clearKidsProgress();
      return true;
    },
  };
}

function withRecomputedBadges(state: KidsProgressState, event?: DailyEvent): KidsProgressState {
  const withDaily = event ? applyDailyEvent(state, event) : state;
  return {
    ...withDaily,
    unlockedBadgeIds: computeUnlockedBadgeIds(withDaily),
    activityDates: recordActivityDate(withDaily.activityDates),
    updatedAt: new Date().toISOString(),
  };
}

function toggleAyah(list: number[], numberInSurah: number, memorized: boolean): number[] {
  const withoutAyah = list.filter((value) => value !== numberInSurah);
  return memorized ? [...withoutAyah, numberInSurah].sort((a, b) => a - b) : withoutAyah;
}

function addStep(state: KidsProgressState, surahId: number | null | undefined, step: MissionStep): KidsProgressState {
  if (surahId === null || surahId === undefined) return state;
  const steps = state.surahSteps[surahId] ?? [];
  return steps.includes(step) ? state : { ...state, surahSteps: { ...state.surahSteps, [surahId]: [...steps, step] } };
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
  /** With `surahId`, a passing score opens the next surah. */
  recordQuizResult: (correct: number, total: number, surahId?: number) => void;
  recordGame: (record: GameRecord) => void;
  recordListenCompletion: (surahId: number) => void;
  markSurahReviewed: (surahId: number) => void;
  chooseCompanion: (animal: CompanionAnimal) => void;
  /** Wears an owned companion item (replacing whatever is in its slot), or takes it off. */
  toggleEquip: (itemId: string) => void;
  /** Buys an item with gems; false when it is already owned or the balance is short. */
  buyItem: (itemId: string) => boolean;
  /** Opens an earned chest and returns what was inside (an item id or `gems-<n>`). */
  openChest: (chestId: string) => string | null;
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

    store.commit(withRecomputedBadges({ ...nextState, reviewSchedule }, memorized ? { type: "learn" } : undefined));
  }

  function markSurahReviewed(surahId: number) {
    const current = store.getSnapshot().state;
    const existing = current.reviewSchedule[surahId];
    if (!existing) return;
    store.commit(
      withRecomputedBadges(
        { ...current, reviewSchedule: { ...current.reviewSchedule, [surahId]: advanceReviewSchedule(existing) } },
        { type: "learn" },
      ),
    );
  }

  function recordQuizResult(correct: number, total: number, surahId?: number) {
    const current = store.getSnapshot().state;
    const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = surahId !== undefined && isQuizPassed(correct, total) && !current.passedQuizSurahs.includes(surahId);
    store.commit(
      withRecomputedBadges(
        {
          ...current,
          quizStats: {
            attempts: current.quizStats.attempts + 1,
            bestScorePercent: Math.max(current.quizStats.bestScorePercent, scorePercent),
            totalCorrect: current.quizStats.totalCorrect + correct,
            totalQuestions: current.quizStats.totalQuestions + total,
            lastPlayedAt: new Date().toISOString(),
          },
          gameCounts: { ...current.gameCounts, quiz: (current.gameCounts.quiz ?? 0) + 1 },
          passedQuizSurahs: passed ? [...current.passedQuizSurahs, surahId] : current.passedQuizSurahs,
        },
        { type: "quiz" },
      ),
      [{ game: "quiz", surah: surahId ?? null, score: correct, total }],
    );
  }

  function recordGame(record: GameRecord) {
    const current = store.getSnapshot().state;
    const isMatch = record.game === "tajweed" || record.game === "letters";
    const counted: KidsProgressState = {
      ...current,
      gameCounts: { ...current.gameCounts, [record.game]: (current.gameCounts[record.game] ?? 0) + 1 },
      matchStats: isMatch
        ? {
            tajweedGamesCompleted: current.matchStats.tajweedGamesCompleted + (record.game === "tajweed" ? 1 : 0),
            letterGamesCompleted: current.matchStats.letterGamesCompleted + (record.game === "letters" ? 1 : 0),
            lastPlayedAt: new Date().toISOString(),
          }
        : current.matchStats,
    };
    const step: MissionStep = record.game === "kids_recite" ? "recite" : "play";
    store.commit(withRecomputedBadges(addStep(counted, record.surah, step), { type: "game", game: record.game }), [record]);
  }

  function recordListenCompletion(surahId: number) {
    const current = store.getSnapshot().state;
    const surahsCompleted = current.listenStats.surahsCompleted.includes(surahId)
      ? current.listenStats.surahsCompleted
      : [...current.listenStats.surahsCompleted, surahId];
    store.commit(
      withRecomputedBadges(
        addStep({ ...current, listenStats: { surahsCompleted, lastPlayedAt: new Date().toISOString() } }, surahId, "listen"),
        { type: "listen" },
      ),
    );
  }

  function chooseCompanion(animal: CompanionAnimal) {
    const current = store.getSnapshot().state;
    store.commit({ ...current, companion: { animal, equipped: current.companion?.equipped ?? [] } });
  }

  function toggleEquip(itemId: string) {
    const current = store.getSnapshot().state;
    const item = getRewardItem(itemId);
    if (!current.companion || item?.kind !== "companion" || !ownedItemIds(current).has(itemId)) return;
    const { equipped } = current.companion;
    const next = equipped.includes(itemId)
      ? equipped.filter((id) => id !== itemId)
      : [...equipped.filter((id) => (getRewardItem(id) as typeof item | undefined)?.slot !== item.slot), itemId];
    store.commit({ ...current, companion: { ...current.companion, equipped: next } });
  }

  function buyItem(itemId: string): boolean {
    const current = store.getSnapshot().state;
    const item = getRewardItem(itemId);
    if (!item || ownedItemIds(current).has(itemId) || gemBalance(current) < item.price) return false;
    store.commit({ ...current, ownedItems: [...current.ownedItems, itemId] });
    return true;
  }

  function openChest(chestId: string): string | null {
    const current = store.getSnapshot().state;
    if (!unopenedChests(current).some((chest) => chest.id === chestId)) return current.openedChests[chestId] ?? null;
    const reward = rollChest(current, chestId);
    store.commit({ ...current, openedChests: { ...current.openedChests, [chestId]: reward } });
    return reward;
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
        recordGame,
        recordListenCompletion,
        markSurahReviewed,
        chooseCompanion,
        toggleEquip,
        buyItem,
        openChest,
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
