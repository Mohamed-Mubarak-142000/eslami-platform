import "server-only";
import { randomInt } from "node:crypto";
import type { NawawiHadith } from "./nawawiData";

export type NawawiQuestionType = "complete" | "missing" | "narrator";

/** What the learner sees — never contains the answer. */
export interface NawawiQuestion {
  id: string;
  type: NawawiQuestionType;
  /** The hadith's number in the book. */
  hadith: number;
  prompt: string;
  options: string[];
}

export interface GeneratedNawawiExam {
  questions: NawawiQuestion[];
  /** Index of the correct option for each question, stored separately (service role only). */
  key: number[];
}

const BLANK = "……";
const PROMPT_WORDS = 16;
const OPTION_WORDS = 8;
const ARABIC_LETTER = /[ء-يٱ-ۓ]/g;
/** Punctuation that clings to the end of a word: kept in the prompt, left out of the options. */
const TRAILING = /[،؛:.!؟"'»)\]]+$/;

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

function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function bare(word: string): string {
  return word.replace(TRAILING, "");
}

function letterCount(word: string): number {
  return word.match(ARABIC_LETTER)?.length ?? 0;
}

function clip(list: string[], size: number): string {
  return list.length > size ? `${list.slice(0, size).join(" ")} …` : list.join(" ");
}

/** Four distinct options around the correct one; null when the pool can't supply three distractors. */
function withOptions(correct: string, pool: string[]): { options: string[]; answer: number } | null {
  const distractors = shuffle([...new Set(pool)].filter((option) => option !== correct)).slice(0, 3);
  if (distractors.length < 3) return null;
  const options = shuffle([correct, ...distractors]);
  return { options, answer: options.indexOf(correct) };
}

/** The hadith's longest saying: most of the Prophet's words ﷺ, and what the questions quote. */
function mainSaying(hadith: NawawiHadith): string[] {
  return words(hadith.sayings.reduce((longest, saying) => (saying.length > longest.length ? saying : longest), ""));
}

/** Whether two narrator lines name a common companion ("أبو ذر ومعاذ بن جبل" and "أبو ذر الغفاري"). */
function sharesNarrator(a: string, b: string): boolean {
  const people = (line: string) => line.split(" و").map((name) => name.trim());
  return people(a).some((x) => people(b).some((y) => x.startsWith(y) || y.startsWith(x)));
}

type Built = { question: Omit<NawawiQuestion, "id">; answer: number } | null;

const BUILDERS: Record<NawawiQuestionType, (hadith: NawawiHadith, pool: NawawiHadith[]) => Built> = {
  // The opening of a saying, choose how it continues.
  complete: (hadith, pool) => {
    const saying = mainSaying(hadith);
    if (saying.length < 8) return null;
    const cut = Math.min(Math.ceil(saying.length / 2), PROMPT_WORDS);
    const correct = clip(saying.slice(cut).map(bare), OPTION_WORDS);
    const distractors = pool
      .filter((other) => other.number !== hadith.number)
      .map(mainSaying)
      .filter((other) => other.length >= 8)
      .map((other) => clip(other.slice(Math.min(Math.ceil(other.length / 2), PROMPT_WORDS)).map(bare), OPTION_WORDS));
    const built = withOptions(correct, distractors);
    return (
      built && {
        question: { type: "complete", hadith: hadith.number, prompt: `${saying.slice(0, cut).join(" ")} ${BLANK}`, options: built.options },
        answer: built.answer,
      }
    );
  },
  // A passage of a saying with one word blanked, choose the word.
  missing: (hadith, pool) => {
    const saying = mainSaying(hadith);
    if (saying.length < 5) return null;
    // A long saying is quoted from the start of one of its sentences, with at least five words to it.
    const starts = [0, ...saying.flatMap((word, index) => (/[،.؛:]$/.test(word) && index + 6 <= saying.length ? [index + 1] : []))];
    const start = saying.length > PROMPT_WORDS ? pick(starts)! : 0;
    const passage = saying.slice(start, start + PROMPT_WORDS);
    const target = pick(passage.map((word, index) => ({ word: bare(word), index })).filter(({ word }) => letterCount(word) >= 3));
    if (!target) return null;
    const inSaying = new Set(saying.map(bare));
    const distractors = pool
      .flatMap((other) => mainSaying(other).map(bare))
      .filter((word) => !inSaying.has(word) && Math.abs(letterCount(word) - letterCount(target.word)) <= 2);
    const built = withOptions(target.word, distractors);
    const prompt = passage.map((word, index) => (index === target.index ? word.replace(bare(word), BLANK) : word)).join(" ");
    return (
      built && {
        question: { type: "missing", hadith: hadith.number, prompt: start > 0 ? `… ${prompt}` : prompt, options: built.options },
        answer: built.answer,
      }
    );
  },
  // Who narrated it.
  narrator: (hadith, pool) => {
    const saying = mainSaying(hadith);
    const others = [...new Set(pool.map((other) => other.narrator))];
    // A narrator who is part of the right answer ("أبو ذر ومعاذ بن جبل") would make two options right.
    const distractors = others.filter((name) => !sharesNarrator(name, hadith.narrator));
    const built = withOptions(hadith.narrator, distractors);
    return (
      built && {
        question: { type: "narrator", hadith: hadith.number, prompt: clip(saying, PROMPT_WORDS), options: built.options },
        answer: built.answer,
      }
    );
  },
};

const TYPE_CYCLE: NawawiQuestionType[] = ["complete", "missing", "narrator", "missing", "complete"];

/**
 * Builds an exam over `hadiths`, drawing distractors from the whole book (`pool`). Every hadith is
 * asked about before any is asked twice, and questions come in the book's order.
 */
export function generateNawawiExam(hadiths: NawawiHadith[], pool: NawawiHadith[], count: number): GeneratedNawawiExam | null {
  const entries: { question: Omit<NawawiQuestion, "id">; answer: number }[] = [];
  const asked = new Map<number, Set<NawawiQuestionType>>();
  let attempts = 0;
  while (entries.length < count && attempts < count * 40) {
    attempts += 1;
    const fewest = Math.min(...hadiths.map((hadith) => asked.get(hadith.number)?.size ?? 0));
    const hadith = pick(hadiths.filter((entry) => (asked.get(entry.number)?.size ?? 0) === fewest));
    if (!hadith) break;
    const used = asked.get(hadith.number) ?? new Set();
    const preferred = TYPE_CYCLE[entries.length % TYPE_CYCLE.length]!;
    const types = [preferred, ...shuffle(TYPE_CYCLE.filter((type) => type !== preferred))].filter((type) => !used.has(type));
    let built: Built = null;
    let type: NawawiQuestionType | undefined;
    for (type of types) {
      built = BUILDERS[type](hadith, pool);
      if (built) break;
    }
    if (!built || !type) {
      // Nothing more to ask about this hadith: mark every type so it isn't picked again.
      asked.set(hadith.number, new Set(TYPE_CYCLE));
      continue;
    }
    used.add(type);
    asked.set(hadith.number, used);
    entries.push(built);
  }
  if (entries.length < count) return null;
  entries.sort((a, b) => a.question.hadith - b.question.hadith);
  return {
    questions: entries.map((entry, index) => ({ ...entry.question, id: `q${index + 1}` })),
    key: entries.map((entry) => entry.answer),
  };
}
