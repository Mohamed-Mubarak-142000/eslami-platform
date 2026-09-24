"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { Amiri_Quran } from "next/font/google";
import { ArrowLeft, ArrowRight, BookOpenCheck } from "lucide-react";
import type { Ayah, TafsirAyah } from "./textApi";
import type { TajweedAyah } from "./tajweedApi";
import { TAJWEED_RULES } from "./tajweedApi";
import type { Surah } from "./api";
import "./quran.css";

const amiriQuran = Amiri_Quran({ subsets: ["arabic"], weight: "400", display: "swap" });

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

function toArabicDigits(value: number): string {
  return String(value)
    .split("")
    .map((digit) => ARABIC_DIGITS[Number(digit)] ?? digit)
    .join("");
}

type ViewMode = "plain" | "tajweed";

export function QuranReadSurah({
  surah,
  basmala,
  ayahs,
  tajweedAyahs,
  tafsirAyahs,
}: {
  surah: Surah;
  basmala: string | null;
  ayahs: Ayah[];
  tajweedAyahs: TajweedAyah[];
  tafsirAyahs: TafsirAyah[];
}) {
  const [viewMode, setViewMode] = useState<ViewMode>(tajweedAyahs.length > 0 ? "tajweed" : "plain");
  const [showTafsir, setShowTafsir] = useState(false);
  const prevId = surah.id > 1 ? surah.id - 1 : null;
  const nextId = surah.id < 114 ? surah.id + 1 : null;

  return (
    <main id="quran-main" className="quran-page">
      <Link href="/quran/read" className="quran-back"><ArrowRight aria-hidden /> كل السور</Link>

      <section className="quran-reciter-header">
        <span className="quran-reciter-header__avatar" aria-hidden><BookOpenCheck size={26} /></span>
        <div>
          <span className="landing-kicker">سورة رقم {toArabicDigits(surah.id)}</span>
          <h1>{surah.name}</h1>
          <div className="quran-reciter-header__meta">
            <span className="quran-tag">{surah.meccan ? "مكية" : "مدنية"}</span>
            <span>{toArabicDigits(ayahs.length)} آية</span>
          </div>
        </div>
      </section>

      <div className="quran-filters">
        {tajweedAyahs.length > 0 && (
          <div className="quran-type-filter" role="tablist" aria-label="طريقة العرض">
            <button type="button" role="tab" aria-selected={viewMode === "tajweed"} onClick={() => setViewMode("tajweed")}>مجوّد ملوّن</button>
            <button type="button" role="tab" aria-selected={viewMode === "plain"} onClick={() => setViewMode("plain")}>نص عادي</button>
          </div>
        )}
        {tafsirAyahs.length > 0 && (
          <div className="quran-type-filter">
            <button type="button" aria-pressed={showTafsir} onClick={() => setShowTafsir((value) => !value)}>
              {showTafsir ? "إخفاء التفسير" : "إظهار التفسير الميسر"}
            </button>
          </div>
        )}
      </div>

      {ayahs.length === 0 && <p className="quran-empty">تعذّر تحميل نص هذه السورة حاليًا. حاول لاحقًا.</p>}

      {ayahs.length > 0 && (
        <article className={`quran-mushaf ${amiriQuran.className}`} lang="ar" dir="rtl">
          {basmala && <p className="quran-basmala">{basmala}</p>}

          {viewMode === "tajweed" && tajweedAyahs.length > 0 ? (
            <p>
              {tajweedAyahs.map((ayah) => (
                <span key={ayah.numberInSurah}>
                  {ayah.segments.map((segment, index) =>
                    segment.ruleClass ? (
                      <span key={index} className="quran-tajweed-rule" style={{ color: TAJWEED_RULES[segment.ruleClass]?.color }}>
                        {segment.text}
                      </span>
                    ) : (
                      <span key={index}>{segment.text}</span>
                    ),
                  )}{" "}
                  <span className="quran-ayah-number" aria-hidden>﴿{toArabicDigits(ayah.numberInSurah)}﴾</span>{" "}
                </span>
              ))}
            </p>
          ) : (
            <p>
              {ayahs.map((ayah) => (
                <span key={ayah.number}>
                  {ayah.text} <span className="quran-ayah-number" aria-hidden>﴿{toArabicDigits(ayah.numberInSurah)}﴾</span>{" "}
                </span>
              ))}
            </p>
          )}
        </article>
      )}

      {viewMode === "tajweed" && tajweedAyahs.length > 0 && (
        <div className="quran-tajweed-legend" aria-label="دليل ألوان أحكام التجويد">
          {Object.entries(TAJWEED_RULES).map(([key, rule]) => (
            <span key={key}><i style={{ background: rule.color }} aria-hidden /> {rule.label}</span>
          ))}
        </div>
      )}

      {showTafsir && tafsirAyahs.length > 0 && (
        <section className="quran-tafsir" aria-label="التفسير الميسر">
          <h2>التفسير الميسر</h2>
          <ol>
            {tafsirAyahs.map((ayah) => (
              <li key={ayah.numberInSurah}>
                <span className="quran-ayah-number" aria-hidden>﴿{toArabicDigits(ayah.numberInSurah)}﴾</span>
                <p>{ayah.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="quran-read-pager">
        {prevId ? (
          <Link href={`/quran/read/${prevId}` as Route}><ArrowRight aria-hidden /> السورة السابقة</Link>
        ) : <span />}
        {nextId ? (
          <Link href={`/quran/read/${nextId}` as Route}>السورة التالية <ArrowLeft aria-hidden /></Link>
        ) : <span />}
      </div>
    </main>
  );
}
