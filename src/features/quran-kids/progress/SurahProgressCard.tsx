import Link from "next/link";
import type { Route } from "next";
import type { Surah } from "@/features/quran";
import { getSurahAyahCount } from "./surahAyahCounts";

export function SurahProgressCard({ surah, memorizedCount }: { surah: Surah; memorizedCount: number }) {
  const total = getSurahAyahCount(surah.id);
  const percent = total > 0 ? Math.round((memorizedCount / total) * 100) : 0;

  return (
    <Link href={`/quran/kids/progress/${surah.id}` as Route} className="quran-kids-surah-card">
      <span className="quran-surah__number">{surah.id}</span>
      <span className="quran-kids-surah-card__progress">
        <span className="quran-read-card__name">{surah.name}</span>
        <span className="quran-kids-surah-card__bar"><span style={{ inlineSize: `${percent}%` }} /></span>
      </span>
      <span className="quran-tag">{memorizedCount}/{total}</span>
    </Link>
  );
}
