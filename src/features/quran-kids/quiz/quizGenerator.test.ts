import { describe, expect, it } from "vitest";
import type { Ayah, Surah } from "@/features/quran";
import { buildCompleteAyahQuestion, buildQuizPool, buildWhichSurahQuestion, generateQuiz } from "./quizGenerator";

function makeSeededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function makeSurahs(count: number): Surah[] {
  return Array.from({ length: count }, (_, index) => ({ id: index + 1, name: `سورة ${index + 1}`, meccan: true }));
}

function makeAyahs(surahId: number, count: number): Ayah[] {
  return Array.from({ length: count }, (_, index) => ({
    number: surahId * 100 + index + 1,
    numberInSurah: index + 1,
    text: `نص آية ${surahId}-${index + 1}`,
  }));
}

const surahs = makeSurahs(5);
const ayahsBySurah = Object.fromEntries(surahs.map((surah) => [surah.id, makeAyahs(surah.id, 3)]));

describe("buildQuizPool", () => {
  it("flattens ayahs across surahs and links each ayah to the next one in the same surah", () => {
    const pool = buildQuizPool(surahs, ayahsBySurah);
    expect(pool).toHaveLength(15);

    const firstAyahOfSurah1 = pool.find((item) => item.surah.id === 1 && item.ayah.numberInSurah === 1);
    expect(firstAyahOfSurah1?.nextAyah?.numberInSurah).toBe(2);

    const lastAyahOfSurah1 = pool.find((item) => item.surah.id === 1 && item.ayah.numberInSurah === 3);
    expect(lastAyahOfSurah1?.nextAyah).toBeNull();
  });
});

describe("buildWhichSurahQuestion", () => {
  it("produces 4 distinct choices with the correct surah name among them", () => {
    const pool = buildQuizPool(surahs, ayahsBySurah);
    const question = buildWhichSurahQuestion(pool, makeSeededRng(1));
    expect(question).not.toBeNull();
    expect(question?.choices).toHaveLength(4);
    const labels = question?.choices.map((choice) => choice.label) ?? [];
    expect(new Set(labels).size).toBe(4);

    const promptedAyah = pool.find((item) => item.ayah.text === question?.prompt);
    const correctChoice = question?.choices.find((choice) => choice.id === question?.correctChoiceId);
    expect(correctChoice?.label).toBe(promptedAyah?.surah.name);
  });

  it("returns null when there are fewer than 4 distinct surahs in the pool", () => {
    const smallPool = buildQuizPool(surahs.slice(0, 2), ayahsBySurah);
    expect(buildWhichSurahQuestion(smallPool, makeSeededRng(1))).toBeNull();
  });
});

describe("buildCompleteAyahQuestion", () => {
  it("uses the actual next ayah's text as the correct choice", () => {
    const pool = buildQuizPool(surahs, ayahsBySurah);
    const question = buildCompleteAyahQuestion(pool, makeSeededRng(2));
    expect(question).not.toBeNull();
    expect(question?.choices).toHaveLength(4);

    const promptedAyah = pool.find((item) => item.ayah.text === question?.prompt && item.nextAyah !== null);
    const correctChoice = question?.choices.find((choice) => choice.id === question?.correctChoiceId);
    expect(correctChoice?.label).toBe(promptedAyah?.nextAyah?.text);
  });

  it("returns null when no ayah in the pool has a following ayah", () => {
    const singleAyahBySurah = Object.fromEntries(surahs.map((surah) => [surah.id, makeAyahs(surah.id, 1)]));
    const pool = buildQuizPool(surahs, singleAyahBySurah);
    expect(buildCompleteAyahQuestion(pool, makeSeededRng(3))).toBeNull();
  });
});

describe("generateQuiz", () => {
  it("generates the requested number of unique, well-formed questions", () => {
    const questions = generateQuiz(surahs, ayahsBySurah, 6, makeSeededRng(42));
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(6);

    const ids = questions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const question of questions) {
      expect(question.choices).toHaveLength(4);
      expect(question.choices.some((choice) => choice.id === question.correctChoiceId)).toBe(true);
    }
  });
});
