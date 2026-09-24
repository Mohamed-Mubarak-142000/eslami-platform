"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { BookOpenCheck, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useSocialMotionPreset } from "@/lib/motion";
import type { Reciter, Riwaya } from "./api";
import "./quran.css";

export function QuranReciters({
  reciters,
  riwayat,
  linkBase = "/quran",
  kicker = "مكتبة صوتية",
  title = "القرآن الكريم كاملًا بأصوات نخبة من القراء",
  description = "اختر قارئك المفضل لعرض تلاواته والاستماع لأي سورة من السور الـ114.",
}: {
  reciters: Reciter[];
  riwayat: Riwaya[];
  linkBase?: string;
  kicker?: string;
  title?: string;
  description?: string;
}) {
  const reveal = useSocialMotionPreset("reveal");
  const [search, setSearch] = useState("");
  const [riwayaId, setRiwayaId] = useState<number | "all">("all");

  const riwayaNameById = useMemo(() => new Map(riwayat.map((item) => [item.id, item.name])), [riwayat]);

  const usedRiwayaIds = useMemo(() => {
    const ids = new Set<number>();
    for (const reciter of reciters) for (const moshaf of reciter.moshaf) ids.add(moshaf.rewayaId);
    return ids;
  }, [reciters]);

  const riwayaOptions = useMemo(
    () => riwayat.filter((item) => usedRiwayaIds.has(item.id)).sort((a, b) => a.name.localeCompare(b.name, "ar")),
    [riwayat, usedRiwayaIds],
  );

  const sortedReciters = useMemo(
    () => [...reciters].sort((a, b) => a.name.localeCompare(b.name, "ar")),
    [reciters],
  );

  const filteredReciters = useMemo(() => {
    const query = search.trim();
    return sortedReciters.filter((reciter) => {
      const matchesSearch = !query || reciter.name.includes(query);
      const matchesRiwaya = riwayaId === "all" || reciter.moshaf.some((moshaf) => moshaf.rewayaId === riwayaId);
      return matchesSearch && matchesRiwaya;
    });
  }, [sortedReciters, search, riwayaId]);

  const groupedReciters = useMemo(() => {
    const groups = new Map<string, Reciter[]>();
    for (const reciter of filteredReciters) {
      const letter = reciter.letter || reciter.name.charAt(0);
      const list = groups.get(letter) ?? [];
      list.push(reciter);
      groups.set(letter, list);
    }
    return Array.from(groups.entries());
  }, [filteredReciters]);

  return (
    <main id="quran-main" className="quran-page">
      <motion.section className="quran-intro" {...reveal} viewport={{ once: true, amount: 0.3 }}>
        <span className="landing-kicker"><BookOpenCheck size={17} aria-hidden /> {kicker}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </motion.section>

      <div className="quran-filters">
        <label className="quran-search">
          <Search aria-hidden />
          <span className="sr-only">ابحث عن قارئ</span>
          <input
            type="search"
            placeholder="ابحث عن قارئ..."
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
        </label>
        {riwayaOptions.length > 1 && (
          <label className="quran-riwaya-filter">
            <span>نوع التلاوة (الرواية)</span>
            <select value={riwayaId} onChange={(event) => setRiwayaId(event.currentTarget.value === "all" ? "all" : Number(event.currentTarget.value))}>
              <option value="all">كل الروايات</option>
              {riwayaOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        )}
      </div>

      {reciters.length === 0 && <p className="quran-empty">تعذّر تحميل قائمة القراء حاليًا. حاول لاحقًا.</p>}
      {reciters.length > 0 && filteredReciters.length === 0 && <p className="quran-empty">لا يوجد قراء مطابقون لبحثك.</p>}

      {groupedReciters.map(([letter, list]) => (
        <div className="quran-reciter-section" key={letter}>
          <h2>{letter}</h2>
          <div className="quran-reciter-card-grid">
            {list.map((reciter) => (
              <Link key={reciter.id} href={`${linkBase}/${reciter.id}` as Route} className="quran-reciter-card">
                <span className="quran-reciter-card__avatar" aria-hidden>{reciter.name.charAt(0)}</span>
                <span className="quran-reciter-card__name">{reciter.name}</span>
                <span className="quran-reciter-card__tags">
                  {reciter.moshaf.slice(0, 2).map((moshaf) => (
                    <span key={moshaf.id}>{riwayaNameById.get(moshaf.rewayaId) ?? moshaf.name}</span>
                  ))}
                  {reciter.moshaf.length > 2 && <span>+{reciter.moshaf.length - 2}</span>}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
