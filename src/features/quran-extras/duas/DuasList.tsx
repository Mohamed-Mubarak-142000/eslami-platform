"use client";

import { useState, useSyncExternalStore } from "react";
import { Volume2 } from "lucide-react";
import { DUAS } from "./duasData";
import "../quran-extras.css";

function findArabicVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice) => voice.lang.startsWith("ar")) ?? null;
}

const noopSubscribe = () => () => {};
const checkSpeechSupport = () => typeof window !== "undefined" && "speechSynthesis" in window;
const alwaysFalse = () => false;

export function DuasList() {
  const speechSupported = useSyncExternalStore(noopSubscribe, checkSpeechSupport, alwaysFalse);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

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

  return (
    <section className="quran-extras-card">
      <h2>أدعية مأثورة</h2>
      <p className="quran-extras-card__hint">
        نماذج أولية لأدعية مشهورة قصيرة، بالنطق الآلي للمتصفح لو متاح — تحتاج مراجعة من مصدر ديني موثوق قبل الاعتماد النهائي.
      </p>
      <ul className="quran-extras-duas-list">
        {DUAS.map((dua) => (
          <li key={dua.id}>
            <div>
              <span className="quran-extras-duas-list__title">{dua.title}</span>
              <p className="quran-extras-duas-list__text" lang="ar" dir="rtl">{dua.text}</p>
              <span className="quran-extras-duas-list__source">{dua.source}</span>
            </div>
            {speechSupported && (
              <button type="button" onClick={() => speak(dua.id, dua.text)} disabled={speakingId === dua.id}>
                <Volume2 size={16} aria-hidden /> {speakingId === dua.id ? "جارٍ الاستماع..." : "استماع"}
              </button>
            )}
          </li>
        ))}
      </ul>
      {!speechSupported && <p className="quran-empty">النطق الصوتي غير متاح على هذا المتصفح، النص معروض للقراءة فقط.</p>}
    </section>
  );
}
