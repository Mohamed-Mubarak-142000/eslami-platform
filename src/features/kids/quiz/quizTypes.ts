export type QuizQuestionKind = "complete-ayah" | "which-surah";

export interface QuizChoice {
  id: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  kind: QuizQuestionKind;
  prompt: string;
  promptLabel: string;
  choices: QuizChoice[];
  correctChoiceId: string;
}
