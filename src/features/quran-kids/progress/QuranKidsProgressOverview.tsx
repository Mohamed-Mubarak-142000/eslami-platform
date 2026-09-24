"use client";

import { Award } from "lucide-react";
import { motion } from "framer-motion";
import { useSocialMotionPreset } from "@/lib/motion";
import type { Surah } from "@/features/quran";
import { useKidsProgress } from "./KidsProgressProvider";
import { SurahProgressCard } from "./SurahProgressCard";
import { BadgesGallery } from "./BadgesGallery";
import "../quran-kids.css";

export function QuranKidsProgressOverview({ surahs }: { surahs: Surah[] }) {
  const reveal = useSocialMotionPreset("reveal");
  const { state } = useKidsProgress();

  return (
    <main id="quran-main" className="quran-page">
      <motion.section className="quran-intro" {...reveal} viewport={{ once: true, amount: 0.3 }}>
        <span className="landing-kicker"><Award size={17} aria-hidden /> رحلتي</span>
        <h1>رحلتي وشاراتي</h1>
        <p>تابع السور التي بدأت في حفظها، واجمع الشارات بإكمال الأنشطة المختلفة.</p>
      </motion.section>

      <h2 className="quran-kids-section-title">شاراتي</h2>
      <BadgesGallery />

      <h2 className="quran-kids-section-title">تقدّم الحفظ</h2>
      <div className="quran-kids-surah-grid">
        {surahs.map((surah) => (
          <SurahProgressCard
            key={surah.id}
            surah={surah}
            memorizedCount={state.memorizedAyahsBySurah[surah.id]?.length ?? 0}
          />
        ))}
      </div>
    </main>
  );
}
