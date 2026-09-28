"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Check, RotateCcw, Volume2 } from "lucide-react";
import { DUA_CATEGORY_LABELS, DUAS, type DuaCategory } from "./duasData";
import "../quran-extras.css";

function findArabicVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice) => voice.lang.startsWith("ar")) ?? null;
}

const noopSubscribe = () => () => {};
const checkSpeechSupport = () => typeof window !== "undefined" && "speechSynthesis" in window;
const alwaysFalse = () => false;

const CATEGORY_ORDER: DuaCategory[] = ["morning", "evening", "sleep", "after-prayer", "general"];

export function DuasList() {
  const speechSupported = useSyncExternalStore(noopSubscribe, checkSpeechSupport, alwaysFalse);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<DuaCategory>("morning");
  const [counts, setCounts] = useState<Record<string, number>>({});

  const duasInCategory = useMemo(() => DUAS.filter((dua) => dua.category === activeCategory), [activeCategory]);

  function speak(id: string, text: string) {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const arabicVoice = findArabicVoice();
    if (arabicVoice) utterance.voice = arabicVoice;
    utterance.lang = arabicVoice?.lang ?? "ar";
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  }

  function tapCount(id: string, target: number) {
    setCounts((current) => ({ ...current, [id]: Math.min(target, (current[id] ?? 0) + 1) }));
  }

  function resetCount(id: string) {
    setCounts((current) => ({ ...current, [id]: 0 }));
  }

  return (
    <section className="quran-extras-card">
      <h2>أدعية مأثورة</h2>
      <p className="quran-extras-card__hint">
        نماذج أولية لأدعية مشهورة قصيرة، بالنطق الآلي للمتصفح لو متاح — تحتاج مراجعة من مصدر ديني موثوق قبل الاعتماد النهائي.
      </p>

      <div className="quran-type-filter" role="tablist" aria-label="فئة الأذكار">
        {CATEGORY_ORDER.map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          >
            {DUA_CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      {duasInCategory.length === 0 && (
        <p className="quran-empty">لا تتوفر أذكار موثّقة لهذه الفئة بعد. سيتم إضافتها بعد مراجعة مصدر ديني موثوق.</p>
      )}

      <ul className="quran-extras-duas-list">
        {duasInCategory.map((dua) => {
          const target = dua.repeat ?? 1;
          const count = Math.min(target, counts[dua.id] ?? 0);
          const completed = count >= target;
          return (
            <li key={dua.id}>
              <div>
                <span className="quran-extras-duas-list__title">{dua.title}</span>
                <p className="quran-extras-duas-list__text" lang="ar" dir="rtl">
                  {dua.text}
                </p>
                <span className="quran-extras-duas-list__source">
                  {dua.source}
                  {dua.repeat ? ` — يُكرَّر ${dua.repeat} مرات` : ""}
                </span>
              </div>
              <div className="quran-extras-duas-list__actions">
                {speechSupported && (
                  <button type="button" onClick={() => speak(dua.id, dua.text)} disabled={speakingId === dua.id}>
                    <Volume2 size={16} aria-hidden /> {speakingId === dua.id ? "جارٍ الاستماع..." : "استماع"}
                  </button>
                )}
                <button
                  type="button"
                  data-completed={completed || undefined}
                  aria-pressed={completed}
                  aria-label={`عدّ التكرار، ${count} من ${target}`}
                  onClick={() => tapCount(dua.id, target)}
                >
                  {completed ? <Check size={16} aria-hidden /> : null} {count}/{target}
                </button>
                {count > 0 && (
                  <button type="button" aria-label="إعادة ضبط العدّاد" onClick={() => resetCount(dua.id)}>
                    <RotateCcw size={16} aria-hidden />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {!speechSupported && <p className="quran-empty">النطق الصوتي غير متاح على هذا المتصفح، النص معروض للقراءة فقط.</p>}
    </section>
  );
}
