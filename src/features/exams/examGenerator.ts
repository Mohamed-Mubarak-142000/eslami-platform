import "server-only";
import { randomInt } from "node:crypto";
import type { JuzAyah } from "@/features/quran/textApi";
import { splitAyahWords } from "@/features/kids/games/arrangeGameLogic";

export type QuestionType = "next" | "complete" | "missing" | "surah";

/** What the learner sees — never contains the answer. */
export interface ExamQuestion {
  id: string;
  type: QuestionType;
  surah: number;
  ayah: number;
  /** Ayah text, the first half of it, or the ayah with a blank ("…") for `missing`. */
  prompt: string;
  options: string[];
}

export interface GeneratedExam {
  questions: ExamQuestion[];
  /** Index of the correct option for each question, stored separately (service role only). */
  key: number[];
}

const OPTION_WORDS = 7;
const BLANK = "……";
const ARABIC_LETTER = /[ء-يٱ-ۓ]/g;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function pick<T>(items: T[]): T | undefined {
  return items.length > 0 ? items[randomInt(items.length)] : undefined;
}

function clip(words: string[]): string {
  return words.length > OPTION_WORDS ? `${words.slice(0, OPTION_WORDS).join(" ")} …` : words.join(" ");
}

function letterCount(word: string): number {
  return word.match(ARABIC_LETTER)?.length ?? 0;
}

/** Builds 4 distinct options around the correct one; returns null when the juz can't supply enough distractors. */
function withOptions(correct: string, pool: string[]): { options: string[]; answer: number } | null {
  const distractors = shuffle([...new Set(pool)].filter((option) => option !== correct)).slice(0, 3);
  if (distractors.length < 3) return null;
  const options = shuffle([correct, ...distractors]);
  return { options, answer: options.indexOf(correct) };
}

interface Candidate {
  ayah: JuzAyah;
  words: string[];
  next: JuzAyah | undefined;
}

type Builder = (candidate: Candidate, all: Candidate[]) => { question: Omit<ExamQuestion, "id">; answer: number } | null;

const BUILDERS: Record<QuestionType, Builder> = {
  // Show an ayah, choose how the following ayah begins.
  next: ({ ayah, words, next }, all) => {
    if (!next || next.surah !== ayah.surah || words.length > 30) return null;
    const correct = clip(splitAyahWords(next.text));
    const built = withOptions(
      correct,
      all.filter((other) => other.ayah.number !== next.number && other.ayah.number !== ayah.number).map((other) => clip(other.words)),
    );
    return (
      built && {
        question: { type: "next", surah: ayah.surah, ayah: ayah.numberInSurah, prompt: ayah.text, options: built.options },
        answer: built.answer,
      }
    );
  },
  // Show the first half of an ayah, choose its ending.
  complete: ({ ayah, words }, all) => {
    if (words.length < 6 || words.length > 30) return null;
    const half = Math.ceil(words.length / 2);
    const correct = clip(words.slice(half));
    const pool = all
      .filter((other) => other.ayah.number !== ayah.number && other.words.length >= 6)
      .map((other) => clip(other.words.slice(Math.ceil(other.words.length / 2))));
    const built = withOptions(correct, pool);
    return (
      built && {
        question: {
          type: "complete",
          surah: ayah.surah,
          ayah: ayah.numberInSurah,
          prompt: `${words.slice(0, half).join(" ")} ${BLANK}`,
          options: built.options,
        },
        answer: built.answer,
      }
    );
  },
  // Blank one word of the ayah, choose the missing word.
  missing: ({ ayah, words }, all) => {
    if (words.length < 5 || words.length > 25) return null;
    const positions = words.map((word, index) => ({ word, index })).filter(({ word, index }) => index > 0 && letterCount(word) >= 3);
    const target = pick(positions);
    if (!target) return null;
    const inAyah = new Set(words);
    const pool = all
      .flatMap((other) => other.words)
      .filter((word) => !inAyah.has(word) && Math.abs(letterCount(word) - letterCount(target.word)) <= 2);
    const built = withOptions(target.word, pool);
    const prompt = words.map((word, index) => (index === target.index ? BLANK : word)).join(" ");
    return (
      built && {
        question: { type: "missing", surah: ayah.surah, ayah: ayah.numberInSurah, prompt, options: built.options },
        answer: built.answer,
      }
    );
  },
  // Show an ayah, choose its surah (names are filled in by the caller).
  surah: ({ ayah, words }) => {
    if (words.length < 4 || words.length > 25) return null;
    return { question: { type: "surah", surah: ayah.surah, ayah: ayah.numberInSurah, prompt: ayah.text, options: [] }, answer: -1 };
  },
};

const TYPE_CYCLE: QuestionType[] = ["missing", "next", "complete", "missing", "surah", "next", "complete"];

/**
 * Generates a juz memorization exam from the juz text. Ayahs whose text repeats inside the juz
 * (refrains) are excluded so every question has exactly one right answer.
 */
export function generateExam(ayahs: JuzAyah[], count: number, surahNames: Record<number, string>): GeneratedExam | null {
  const textCounts = new Map<string, number>();
  for (const ayah of ayahs) textCounts.set(ayah.text, (textCounts.get(ayah.text) ?? 0) + 1);
  const all: Candidate[] = ayahs.map((ayah, index) => ({ ayah, words: splitAyahWords(ayah.text), next: ayahs[index + 1] }));
  const unique = all.filter(
    (candidate) => textCounts.get(candidate.ayah.text) === 1 && (!candidate.next || textCounts.get(candidate.next.text) === 1),
  );

  const juzSurahs = [...new Set(ayahs.map((ayah) => ayah.surah))];
  const low = Math.max(1, Math.min(...juzSurahs) - 3);
  const high = Math.min(114, Math.max(...juzSurahs) + 3);
  const nearbySurahs = Array.from({ length: high - low + 1 }, (_, i) => low + i);

  const used = new Set<number>();
  const questions: ExamQuestion[] = [];
  const key: number[] = [];
  let attempts = 0;
  while (questions.length < count && attempts < count * 40) {
    attempts += 1;
    const candidate = pick(unique.filter((entry) => !used.has(entry.ayah.number)));
    if (!candidate) break;
    const type = TYPE_CYCLE[questions.length % TYPE_CYCLE.length]!;
    const built = BUILDERS[type](candidate, all) ?? BUILDERS.missing(candidate, all);
    if (!built) continue;

    let { question, answer } = built;
    if (question.type === "surah") {
      const correct = surahNames[question.surah];
      const options = correct ? withOptions(correct, nearbySurahs.map((id) => surahNames[id] ?? "").filter(Boolean)) : null;
      if (!options) continue;
      question = { ...question, options: options.options };
      answer = options.answer;
    }
    used.add(candidate.ayah.number);
    questions.push({ ...question, id: `q${questions.length + 1}` });
    key.push(answer);
  }

  if (questions.length < Math.min(count, 5)) return null;
  // Present in mushaf order, which reads more naturally than a random jumble.
  const order = questions.map((question, index) => ({
    question,
    answer: key[index]!,
    number: ayahs.findIndex((ayah) => ayah.surah === question.surah && ayah.numberInSurah === question.ayah),
  }));
  order.sort((a, b) => a.number - b.number);
  return {
    questions: order.map((entry, index) => ({ ...entry.question, id: `q${index + 1}` })),
    key: order.map((entry) => entry.answer),
  };
}

export function gradeExam(key: number[], answers: unknown): { score: number; total: number; perQuestion: boolean[] } {
  const given = Array.isArray(answers) ? answers : [];
  const perQuestion = key.map((correct, index) => given[index] === correct);
  return { score: perQuestion.filter(Boolean).length, total: key.length, perQuestion };
}
