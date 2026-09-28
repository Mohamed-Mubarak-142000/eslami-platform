"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { BookmarkCheck, Search } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { normalizeArabic as normalize } from "@/lib/normalizeArabic";
import type { IndexSurah } from "./indexSurahs";
import { useLastRead } from "./lastReadStorage";

type Revelation = "all" | "meccan" | "medinan";

export function SurahIndex({ surahs }: { surahs: IndexSurah[] }) {
  const [query, setQuery] = useState("");
  const [revelation, setRevelation] = useState<Revelation>("all");
  const [juz, setJuz] = useState(0);
  const lastRead = useLastRead();

  const filtered = useMemo(() => {
    const trimmed = query.trim();
    const asNumber = Number(trimmed.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))));
    const needle = normalize(trimmed);
    return surahs.filter((surah) => {
      if (revelation === "meccan" && !surah.meccan) return false;
      if (revelation === "medinan" && surah.meccan) return false;
      if (juz > 0 && surah.juzStart !== juz) return false;
      if (!trimmed) return true;
      if (Number.isInteger(asNumber) && asNumber > 0) return surah.id === asNumber;
      return normalize(surah.name).includes(needle);
    });
  }, [surahs, query, revelation, juz]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {lastRead && (
        <Link
          href={`/quran/${lastRead.surahId}?page=${lastRead.page}` as Route}
          className="-mt-8 mb-8 flex items-center gap-4 rounded-3xl bg-gold p-4 text-emerald-night shadow-gold transition-transform hover:-translate-y-0.5 sm:p-5"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-night text-gold">
            <BookmarkCheck className="size-6" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-bold opacity-80">أكمل من حيث توقفت</span>
            <span className="block text-lg font-bold">
              سورة {lastRead.surahName} — صفحة {toArabicDigits(lastRead.page)}
            </span>
          </span>
        </Link>
      )}

      <div className="sticky top-18 z-20 -mx-4 mb-8 border-b border-line bg-ivory/90 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <span className="sr-only">ابحث عن سورة بالاسم أو الرقم</span>
            <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث باسم السورة أو رقمها…"
              className="h-12 w-full rounded-full border border-line bg-white pe-4 ps-12 text-base outline-none transition-shadow focus:border-emerald/40 focus:shadow-soft"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <div role="group" aria-label="نوع السورة" className="flex rounded-full border border-line bg-white p-1">
              {(
                [
                  ["all", "الكل"],
                  ["meccan", "مكية"],
                  ["medinan", "مدنية"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={revelation === value}
                  onClick={() => setRevelation(value)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-bold transition-colors",
                    revelation === value ? "bg-emerald text-white" : "text-muted hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="relative">
              <span className="sr-only">تصفية حسب الجزء</span>
              <select
                value={juz}
                onChange={(event) => setJuz(Number(event.target.value))}
                className="h-11 appearance-none rounded-full border border-line bg-white pe-9 ps-4 text-sm font-bold text-ink outline-none"
              >
                <option value={0}>كل الأجزاء</option>
                {Array.from({ length: 30 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    الجزء {toArabicDigits(index + 1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {surahs.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-muted">تعذّر تحميل فهرس السور الآن. حاول لاحقًا.</p>}
      {surahs.length > 0 && filtered.length === 0 && (
        <p className="rounded-3xl bg-white p-8 text-center text-muted">لا توجد سور مطابقة — جرّب كلمة أخرى أو أزل التصفية.</p>
      )}

      <Reveal as="ul" stagger="[data-surah]" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((surah) => (
          <li key={surah.id} data-surah>
            <Link
              href={`/quran/${surah.id}` as Route}
              className="group flex items-center gap-4 rounded-3xl border border-line bg-white p-4 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-lift"
            >
              <span className="relative grid size-13 shrink-0 place-items-center">
                <svg
                  viewBox="0 0 48 48"
                  className="absolute inset-0 size-full text-gold-mist transition-colors duration-300 group-hover:text-gold"
                  aria-hidden
                >
                  <path d="M24 2l5.6 13.5L44 10l-5.5 14L44 38l-14.4-5.5L24 46l-5.6-13.5L4 38l5.5-14L4 10l14.4 5.5z" fill="currentColor" />
                </svg>
                <span className="relative font-display text-sm font-bold text-emerald-deep">{toArabicDigits(surah.id)}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-bold text-emerald-deep">سورة {surah.name}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {surah.meccan ? "مكية" : "مدنية"} · {toArabicDigits(surah.ayahCount)} آية · الجزء {toArabicDigits(surah.juzStart)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </Reveal>
    </div>
  );
}
