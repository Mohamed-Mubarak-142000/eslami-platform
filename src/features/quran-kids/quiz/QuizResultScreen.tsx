import { Star } from "lucide-react";
import "../quran-kids.css";

export function QuizResultScreen({ score, total, onReplay }: { score: number; total: number; onReplay: () => void }) {
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <section className="quran-kids-score-panel">
      <Star size={40} color="#f5c518" aria-hidden />
      <p>نتيجتك</p>
      <strong>{score} / {total}</strong>
      <p>{percent}%</p>
      <button type="button" className="quran-kids-choice" onClick={onReplay}>العب مرة أخرى</button>
    </section>
  );
}
