"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { Ayah, Surah } from "@/features/quran";
import { useKidsProgress } from "./KidsProgressProvider";
import "../quran-kids.css";

export function SurahMemorizationChecklist({ surah, ayahs }: { surah: Surah; ayahs: Ayah[] }) {
  const { state, setAyahMemorized } = useKidsProgress();
  const memorized = new Set(state.memorizedAyahsBySurah[surah.id] ?? []);

  return (
    <main id="quran-main" className="quran-page">
      <Link href="/quran/kids/progress" className="quran-back"><ArrowRight aria-hidden /> رحلتي وشاراتي</Link>

      <section className="quran-reciter-header">
        <span className="quran-reciter-header__avatar" aria-hidden><Check size={26} /></span>
        <div>
          <span className="landing-kicker">سورة رقم {surah.id}</span>
          <h1>{surah.name}</h1>
          <div className="quran-reciter-header__meta">
            <span className="quran-tag">{memorized.size}/{ayahs.length} آية محفوظة</span>
          </div>
        </div>
      </section>

      <ul className="quran-kids-checklist">
        {ayahs.map((ayah) => {
          const isMemorized = memorized.has(ayah.numberInSurah);
          return (
            <li key={ayah.number}>
              <button
                type="button"
                className="quran-kids-checklist__item"
                data-checked={isMemorized}
                aria-pressed={isMemorized}
                onClick={() => setAyahMemorized(surah.id, ayah.numberInSurah, !isMemorized)}
              >
                <span className="quran-kids-checklist__check" aria-hidden>{isMemorized && <Check size={14} />}</span>
                <span className="quran-kids-checklist__text">{ayah.text}</span>
                <span className="quran-ayah-number" aria-hidden>﴿{ayah.numberInSurah}﴾</span>
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
