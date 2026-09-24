"use client";

import Link from "next/link";
import type { Route } from "next";
import { Palette, Puzzle } from "lucide-react";
import { motion } from "framer-motion";
import { useSocialMotionPreset } from "@/lib/motion";
import type { Surah } from "@/features/quran";
import "../quran-kids.css";

export function QuranKidsMatchHub({ surahs }: { surahs: Surah[] }) {
  const reveal = useSocialMotionPreset("reveal");

  return (
    <main id="quran-main" className="quran-page">
      <motion.section className="quran-intro" {...reveal} viewport={{ once: true, amount: 0.3 }}>
        <span className="landing-kicker"><Puzzle size={17} aria-hidden /> لعبة التوصيل والتلوين</span>
        <h1>لعبة التوصيل والتلوين</h1>
        <p>اختر لعبة مطابقة الحروف، أو اختر سورة لتلوين أحكام التجويد فيها.</p>
      </motion.section>

      <Link href="/quran/kids/match/letters" className="quran-kids-card">
        <span className="quran-kids-card__icon" aria-hidden><Puzzle /></span>
        <span className="quran-kids-card__title">لعبة مطابقة الحروف</span>
        <span className="quran-kids-card__description">طابق كل حرف عربي باسمه في لعبة ذاكرة ممتعة.</span>
      </Link>

      <h2 className="quran-kids-section-title"><Palette size={16} aria-hidden style={{ verticalAlign: "middle" }} /> تلوين التجويد — اختر سورة</h2>
      <div className="quran-kids-surah-grid">
        {surahs.map((surah) => (
          <Link key={surah.id} href={`/quran/kids/match/${surah.id}` as Route} className="quran-kids-surah-card">
            <span className="quran-surah__number">{surah.id}</span>
            <span className="quran-read-card__name">{surah.name}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
