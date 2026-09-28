"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useSocialMotionPreset } from "@/lib/motion";
import type { Ayah, Surah } from "@/features/quran";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { generateQuiz } from "./quizGenerator";
import type { QuizQuestion } from "./quizTypes";
import { QuizQuestionCard } from "./QuizQuestionCard";
import { QuizResultScreen } from "./QuizResultScreen";
import "../quran-kids.css";

const QUESTION_COUNT = 8;
const EMPTY_QUESTIONS: QuizQuestion[] = [];

/**
 * Question order is randomized (Math.random), so it must be generated on the client only — a
 * plain useState initializer would run during SSR too and disagree with the client's own first
 * render, triggering a hydration mismatch. useSyncExternalStore is the React-sanctioned way to
 * serve a server-safe snapshot first and swap to the real (random) one during hydration with no
 * visible flash, mirroring the pattern already used by KidsProgressProvider/ParentGate.
 */
function createQuizStore(surahs: Surah[], ayahsBySurah: Record<number, Ayah[]>) {
  let questions: QuizQuestion[] | null = null;
  const listeners = new Set<() => void>();

  return {
    getSnapshot(): QuizQuestion[] {
      if (questions === null) questions = generateQuiz(surahs, ayahsBySurah, QUESTION_COUNT);
      return questions;
    },
    getServerSnapshot(): QuizQuestion[] {
      return EMPTY_QUESTIONS;
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    regenerate() {
      questions = generateQuiz(surahs, ayahsBySurah, QUESTION_COUNT);
      for (const listener of listeners) listener();
    },
  };
}

export function QuranKidsQuiz({ surahs, ayahsBySurah }: { surahs: Surah[]; ayahsBySurah: Record<number, Ayah[]> }) {
  const reveal = useSocialMotionPreset("reveal");
  const { recordQuizResult } = useKidsProgress();
  const [store] = useState(() => createQuizStore(surahs, ayahsBySurah));
  const questions = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentQuestion = questions[currentIndex];

  function handleSelect(choiceId: string) {
    if (!currentQuestion) return;
    setSelectedChoiceId(choiceId);
    if (choiceId === currentQuestion.correctChoiceId) setScore((value) => value + 1);
  }

  function handleNext() {
    const isLast = currentIndex === questions.length - 1;
    if (isLast) {
      recordQuizResult(score, questions.length);
      setFinished(true);
      return;
    }
    setCurrentIndex((value) => value + 1);
    setSelectedChoiceId(null);
  }

  function handleReplay() {
    store.regenerate();
    setCurrentIndex(0);
    setSelectedChoiceId(null);
    setScore(0);
    setFinished(false);
  }

  return (
    <main id="quran-main" className="quran-page">
      <Link href="/quran/kids" className="quran-back">
        <ArrowRight aria-hidden /> رجوع
      </Link>

      <motion.section className="quran-intro" {...reveal} viewport={{ once: true, amount: 0.3 }}>
        <span className="landing-kicker">
          <Sparkles size={17} aria-hidden /> اختبار تفاعلي
        </span>
        <h1>اختبار تفاعلي</h1>
        {!finished && questions.length > 0 && (
          <p>
            السؤال {currentIndex + 1} من {questions.length}
          </p>
        )}
      </motion.section>

      {questions.length === 0 && <p className="quran-empty">تعذّر تحضير الأسئلة حاليًا. حاول لاحقًا.</p>}

      {!finished && currentQuestion && (
        <>
          <QuizQuestionCard question={currentQuestion} selectedChoiceId={selectedChoiceId} onSelect={handleSelect} />
          {selectedChoiceId && (
            <div className="quran-kids-listen-controls">
              <button type="button" className="quran-kids-choice" onClick={handleNext}>
                {currentIndex === questions.length - 1 ? "عرض النتيجة" : "السؤال التالي"}
              </button>
            </div>
          )}
        </>
      )}

      {finished && <QuizResultScreen score={score} total={questions.length} onReplay={handleReplay} />}
    </main>
  );
}
