"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState, type CSSProperties } from "react";
import { Amiri_Quran } from "next/font/google";
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, Copy, Minus, Plus } from "lucide-react";
import type { Ayah, TafsirAyah } from "./textApi";
import type { TajweedAyah } from "./tajweedApi";
import { TAJWEED_RULES } from "./tajweedApi";
import type { Surah } from "./api";
import { saveLastRead } from "./lastReadStorage";
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

const FONT_SIZE_STEPS = ["1.15rem", "1.5rem", "1.85rem", "2.2rem"];
const DEFAULT_FONT_STEP = 1;

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
  const [fontStep, setFontStep] = useState(DEFAULT_FONT_STEP);
  const [copiedAyahNumber, setCopiedAyahNumber] = useState<number | null>(null);
  const prevId = surah.id > 1 ? surah.id - 1 : null;
  const nextId = surah.id < 114 ? surah.id + 1 : null;

  useEffect(() => {
    if (ayahs.length > 0) saveLastRead(surah.id, surah.name);
  }, [surah.id, surah.name, ayahs.length]);

  async function copyAyah(ayah: Ayah) {
    const reference = `${surah.name}: ${toArabicDigits(ayah.numberInSurah)}`;
    try {
      await navigator.clipboard.writeText(`${ayah.text} ﴿${reference}﴾`);
      setCopiedAyahNumber(ayah.number);
      setTimeout(() => setCopiedAyahNumber((current) => (current === ayah.number ? null : current)), 1800);
    } catch {
      // Clipboard access can fail (permissions/insecure context) — silently no-op, nothing to recover.
    }
  }

  return (
    <main id="quran-main" className="quran-page">
      <Link href="/quran/read" className="quran-back">
        <ArrowRight aria-hidden /> كل السور
      </Link>

      <section className="quran-reciter-header">
        <span className="quran-reciter-header__avatar" aria-hidden>
          <BookOpenCheck size={26} />
        </span>
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
            <button type="button" role="tab" aria-selected={viewMode === "tajweed"} onClick={() => setViewMode("tajweed")}>
              مجوّد ملوّن
            </button>
            <button type="button" role="tab" aria-selected={viewMode === "plain"} onClick={() => setViewMode("plain")}>
              نص عادي
            </button>
          </div>
        )}
        {tafsirAyahs.length > 0 && (
          <div className="quran-type-filter">
            <button type="button" aria-pressed={showTafsir} onClick={() => setShowTafsir((value) => !value)}>
              {showTafsir ? "إخفاء التفسير" : "إظهار التفسير الميسر"}
            </button>
          </div>
        )}
        <div className="quran-font-size-control" role="group" aria-label="حجم خط القراءة">
          <button
            type="button"
            disabled={fontStep === 0}
            aria-label="تصغير الخط"
            onClick={() => setFontStep((step) => Math.max(0, step - 1))}
          >
            <Minus size={16} aria-hidden />
          </button>
          <span className="sr-only" aria-live="polite">
            حجم الخط {fontStep + 1} من {FONT_SIZE_STEPS.length}
          </span>
          <button
            type="button"
            disabled={fontStep === FONT_SIZE_STEPS.length - 1}
            aria-label="تكبير الخط"
            onClick={() => setFontStep((step) => Math.min(FONT_SIZE_STEPS.length - 1, step + 1))}
          >
            <Plus size={16} aria-hidden />
          </button>
        </div>
      </div>

      {ayahs.length === 0 && <p className="quran-empty">تعذّر تحميل نص هذه السورة حاليًا. حاول لاحقًا.</p>}

      {ayahs.length > 0 && (
        <article
          className={`quran-mushaf ${amiriQuran.className}`}
          lang="ar"
          dir="rtl"
          style={{ "--quran-reading-font-size": FONT_SIZE_STEPS[fontStep] } as CSSProperties}
        >
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
                  <span className="quran-ayah-number" aria-hidden>
                    ﴿{toArabicDigits(ayah.numberInSurah)}﴾
                  </span>{" "}
                </span>
              ))}
            </p>
          ) : (
            <p>
              {ayahs.map((ayah) => (
                <span key={ayah.number} className="quran-ayah">
                  {ayah.text}{" "}
                  <span className="quran-ayah-number" aria-hidden>
                    ﴿{toArabicDigits(ayah.numberInSurah)}﴾
                  </span>{" "}
                  <button
                    type="button"
                    className="quran-ayah-copy"
                    data-copied={copiedAyahNumber === ayah.number || undefined}
                    aria-label={`نسخ الآية ${toArabicDigits(ayah.numberInSurah)} مع مرجعها`}
                    onClick={() => copyAyah(ayah)}
                  >
                    {copiedAyahNumber === ayah.number ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
                  </button>{" "}
                </span>
              ))}
            </p>
          )}
        </article>
      )}

      {viewMode === "tajweed" && tajweedAyahs.length > 0 && (
        <div className="quran-tajweed-legend" aria-label="دليل ألوان أحكام التجويد">
          {Object.entries(TAJWEED_RULES).map(([key, rule]) => (
            <span key={key}>
              <i style={{ background: rule.color }} aria-hidden /> {rule.label}
            </span>
          ))}
        </div>
      )}

      {showTafsir && tafsirAyahs.length > 0 && (
        <section className="quran-tafsir" aria-label="التفسير الميسر">
          <h2>التفسير الميسر</h2>
          <ol>
            {tafsirAyahs.map((ayah) => (
              <li key={ayah.numberInSurah}>
                <span className="quran-ayah-number" aria-hidden>
                  ﴿{toArabicDigits(ayah.numberInSurah)}﴾
                </span>
                <p>{ayah.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="quran-read-pager">
        {prevId ? (
          <Link href={`/quran/read/${prevId}` as Route}>
            <ArrowRight aria-hidden /> السورة السابقة
          </Link>
        ) : (
          <span />
        )}
        {nextId ? (
          <Link href={`/quran/read/${nextId}` as Route}>
            السورة التالية <ArrowLeft aria-hidden />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </main>
  );
}
