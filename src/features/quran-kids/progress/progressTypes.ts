export interface KidsQuizStats {
  attempts: number;
  bestScorePercent: number;
  totalCorrect: number;
  totalQuestions: number;
  lastPlayedAt: string | null;
}

export interface KidsMatchStats {
  tajweedGamesCompleted: number;
  letterGamesCompleted: number;
  lastPlayedAt: string | null;
}

export interface KidsListenStats {
  surahsCompleted: number[];
  lastPlayedAt: string | null;
}

export interface KidsProgressState {
  version: 1;
  memorizedAyahsBySurah: Record<number, number[]>;
  quizStats: KidsQuizStats;
  matchStats: KidsMatchStats;
  listenStats: KidsListenStats;
  unlockedBadgeIds: string[];
  updatedAt: string;
}

export const DEFAULT_KIDS_PROGRESS: KidsProgressState = {
  version: 1,
  memorizedAyahsBySurah: {},
  quizStats: { attempts: 0, bestScorePercent: 0, totalCorrect: 0, totalQuestions: 0, lastPlayedAt: null },
  matchStats: { tajweedGamesCompleted: 0, letterGamesCompleted: 0, lastPlayedAt: null },
  listenStats: { surahsCompleted: [], lastPlayedAt: null },
  unlockedBadgeIds: [],
  updatedAt: new Date(0).toISOString(),
};
