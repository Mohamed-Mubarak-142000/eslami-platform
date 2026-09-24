"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
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

export function QuranKidsQuiz({ surahs, ayahsBySurah }: { surahs: Surah[]; ayahsBySurah: Record<number, Ayah[]> }) {
  const reveal = useSocialMotionPreset("reveal");
  const { recordQuizResult } = useKidsProgress();
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => generateQuiz(surahs, ayahsBySurah, QUESTION_COUNT));
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
    setQuestions(generateQuiz(surahs, ayahsBySurah, QUESTION_COUNT));
    setCurrentIndex(0);
    setSelectedChoiceId(null);
    setScore(0);
    setFinished(false);
  }

  return (
    <main id="quran-main" className="quran-page">
      <motion.section className="quran-intro" {...reveal} viewport={{ once: true, amount: 0.3 }}>
        <span className="landing-kicker"><Sparkles size={17} aria-hidden /> اختبار تفاعلي</span>
        <h1>اختبار تفاعلي</h1>
        {!finished && questions.length > 0 && <p>السؤال {currentIndex + 1} من {questions.length}</p>}
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
