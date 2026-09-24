"use client";

import Link from "next/link";
import type { Route } from "next";
import { CheckCircle2, PenLine } from "lucide-react";
import { motion } from "framer-motion";
import { useSocialMotionPreset } from "@/lib/motion";
import type { Surah } from "@/features/quran";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import "../quran-kids.css";

export function QuranKidsListenPicker({ surahs }: { surahs: Surah[] }) {
  const reveal = useSocialMotionPreset("reveal");
  const { state } = useKidsProgress();
  const completed = new Set(state.listenStats.surahsCompleted);

  return (
    <main id="quran-main" className="quran-page">
      <motion.section className="quran-intro" {...reveal} viewport={{ once: true, amount: 0.3 }}>
        <span className="landing-kicker"><PenLine size={17} aria-hidden /> استمع وردد</span>
        <h1>استمع وردد</h1>
        <p>اختر سورة لتستمع لكل آية بمفردها مع تظليلها، ثم رددها بصوتك.</p>
      </motion.section>

      <div className="quran-kids-surah-grid">
        {surahs.map((surah) => (
          <Link key={surah.id} href={`/quran/kids/listen/${surah.id}` as Route} className="quran-kids-surah-card">
            <span className="quran-surah__number">{surah.id}</span>
            <span className="quran-read-card__name">{surah.name}</span>
            {completed.has(surah.id) && <CheckCircle2 size={18} color="#2f9e44" aria-label="مكتملة" />}
          </Link>
        ))}
      </div>
    </main>
  );
}
