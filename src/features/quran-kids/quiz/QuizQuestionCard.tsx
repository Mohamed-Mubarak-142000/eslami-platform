import { Check, X } from "lucide-react";
import type { QuizQuestion } from "./quizTypes";
import "../quran-kids.css";

export function QuizQuestionCard({
  question,
  selectedChoiceId,
  onSelect,
}: {
  question: QuizQuestion;
  selectedChoiceId: string | null;
  onSelect: (choiceId: string) => void;
}) {
  return (
    <section className="quran-kids-tajweed-snippet" lang="ar" dir="rtl">
      <p className="landing-kicker">{question.promptLabel}</p>
      <p>{question.prompt}</p>

      <div className="quran-kids-choice-grid">
        {question.choices.map((choice) => {
          const isSelected = choice.id === selectedChoiceId;
          const isCorrect = choice.id === question.correctChoiceId;
          const state = selectedChoiceId ? (isCorrect ? "correct" : isSelected ? "incorrect" : undefined) : undefined;
          return (
            <button
              key={choice.id}
              type="button"
              className="quran-kids-choice"
              data-state={state}
              disabled={selectedChoiceId !== null}
              onClick={() => onSelect(choice.id)}
            >
              {state === "correct" && <Check size={16} aria-hidden />}
              {state === "incorrect" && <X size={16} aria-hidden />}
              {choice.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
