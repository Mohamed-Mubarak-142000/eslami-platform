"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpenCheck, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useSocialMotionPreset } from "@/lib/motion";
import type { Surah } from "./api";
import "./quran.css";

export function QuranReadIndex({ surahs }: { surahs: Surah[] }) {
  const reveal = useSocialMotionPreset("reveal");
  const [search, setSearch] = useState("");

  const filteredSurahs = useMemo(() => {
    const query = search.trim();
    if (!query) return surahs;
    return surahs.filter((surah) => surah.name.includes(query));
  }, [surahs, search]);

  return (
    <main id="quran-main" className="quran-page">
      <motion.section className="quran-intro" {...reveal} viewport={{ once: true, amount: 0.3 }}>
        <span className="landing-kicker"><BookOpenCheck size={17} aria-hidden /> قراءة</span>
        <h1>قراءة القرآن الكريم</h1>
        <p>تصفّح المصحف الشريف سورة سورة، بالرسم العثماني وأرقام الآيات.</p>
      </motion.section>

      <div className="quran-filters">
        <label className="quran-search">
          <Search aria-hidden />
          <span className="sr-only">ابحث عن سورة</span>
          <input
            type="search"
            placeholder="ابحث عن سورة..."
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
        </label>
      </div>

      {surahs.length === 0 && <p className="quran-empty">تعذّر تحميل قائمة السور حاليًا. حاول لاحقًا.</p>}
      {surahs.length > 0 && filteredSurahs.length === 0 && <p className="quran-empty">لا توجد سور مطابقة لبحثك.</p>}

      <div className="quran-read-grid">
        {filteredSurahs.map((surah) => (
          <Link key={surah.id} href={`/quran/read/${surah.id}`} className="quran-read-card">
            <span className="quran-surah__number">{surah.id}</span>
            <span className="quran-read-card__name">{surah.name}</span>
            <span className="quran-tag">{surah.meccan ? "مكية" : "مدنية"}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
