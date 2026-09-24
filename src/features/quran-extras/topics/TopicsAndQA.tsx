import { SAMPLE_QUESTIONS, TOPICS } from "./topicsData";
import "../quran-extras.css";

export function TopicsAndQA() {
  return (
    <section className="quran-extras-card">
      <h2>موضوعات وأسئلة شائعة</h2>
      <p className="quran-extras-card__hint">
        هذا عرض أولي لفكرة موضوعات وأسئلة موثّقة من خطة «بصيرة» الأصلية — محتوى نموذجي عام لحين اعتماد محتوى حقيقي ومصادره.
      </p>

      <div className="quran-extras-topics-grid">
        {TOPICS.map((topic) => (
          <div key={topic.id} className="quran-extras-topic">
            <strong>{topic.label}</strong>
            <span>{topic.description}</span>
          </div>
        ))}
      </div>

      <h3 className="quran-kids-section-title">أسئلة نموذجية</h3>
      <dl className="quran-extras-qa-list">
        {SAMPLE_QUESTIONS.map((item) => (
          <div key={item.id}>
            <dt>{item.question}</dt>
            <dd>{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
