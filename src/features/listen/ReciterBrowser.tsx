"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { normalizeArabic } from "@/lib/normalizeArabic";
import type { Reciter, Riwaya } from "@/features/quran/api";

const AVATAR_TONES = [
  "from-emerald to-emerald-deep",
  "from-gold to-gold-deep",
  "from-emerald-deep to-emerald-night",
  "from-[#2f7d6b] to-emerald",
];

export function ReciterAvatar({ name, className }: { name: string; className?: string }) {
  const tone = AVATAR_TONES[name.length % AVATAR_TONES.length];
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-linear-to-br font-display font-bold text-white shadow-soft",
        tone,
        className,
      )}
      aria-hidden
    >
      {name.trim().charAt(0)}
    </span>
  );
}

interface ReciterBrowserProps {
  reciters: Reciter[];
  riwayat: Riwaya[];
  linkBase?: "/listen" | "/kids/listen";
}

export function ReciterBrowser({ reciters, riwayat, linkBase = "/listen" }: ReciterBrowserProps) {
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState("");
  const [riwaya, setRiwaya] = useState(0);

  const letters = useMemo(
    () => Array.from(new Set(reciters.map((reciter) => reciter.letter).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ar")),
    [reciters],
  );
  const usedRiwayat = useMemo(() => {
    const used = new Set(reciters.flatMap((reciter) => reciter.moshaf.map((moshaf) => moshaf.rewayaId)));
    return riwayat.filter((entry) => used.has(entry.id));
  }, [reciters, riwayat]);

  const filtered = useMemo(() => {
    const needle = normalizeArabic(query);
    return reciters.filter((reciter) => {
      if (letter && reciter.letter !== letter) return false;
      if (riwaya && !reciter.moshaf.some((moshaf) => moshaf.rewayaId === riwaya)) return false;
      return !needle || normalizeArabic(reciter.name).includes(needle);
    });
  }, [reciters, query, letter, riwaya]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="sticky top-16 sm:top-18 z-20 -mx-4 mb-8 space-y-3 border-b border-line bg-ivory/90 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">ابحث عن قارئ</span>
            <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث باسم القارئ…"
              className="h-12 w-full rounded-full border border-line bg-white pe-4 ps-12 outline-none focus:border-emerald/40 focus:shadow-soft"
            />
          </label>
          {usedRiwayat.length > 1 && (
            <label>
              <span className="sr-only">الرواية</span>
              <select
                value={riwaya}
                onChange={(event) => setRiwaya(Number(event.target.value))}
                className="h-12 w-full rounded-full border border-line bg-white px-5 text-sm font-bold outline-none md:w-auto"
              >
                <option value={0}>كل الروايات</option>
                {usedRiwayat.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {letters.length > 1 && (
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" role="group" aria-label="الحرف الأول">
            <button
              type="button"
              aria-pressed={!letter}
              onClick={() => setLetter("")}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold",
                !letter ? "bg-emerald text-white" : "bg-white text-muted ring-1 ring-line",
              )}
            >
              الكل
            </button>
            {letters.map((entry) => (
              <button
                key={entry}
                type="button"
                aria-pressed={letter === entry}
                onClick={() => setLetter(entry === letter ? "" : entry)}
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                  letter === entry ? "bg-emerald text-white" : "bg-white text-ink ring-1 ring-line hover:ring-emerald/40",
                )}
              >
                {entry}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mb-4 text-sm text-muted">{toArabicDigits(filtered.length)} قارئ</p>
      {reciters.length === 0 && (
        <p className="rounded-3xl bg-white p-8 text-center text-muted">تعذّر تحميل قائمة القرّاء الآن. حاول لاحقًا.</p>
      )}
      {reciters.length > 0 && filtered.length === 0 && (
        <p className="rounded-3xl bg-white p-8 text-center text-muted">لا يوجد قارئ مطابق — جرّب اسمًا آخر أو أزل التصفية.</p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((reciter) => (
          <li key={reciter.id}>
            <Link
              href={`${linkBase}/${reciter.id}` as Route}
              className="group flex items-center gap-3 rounded-3xl border border-line bg-white p-3.5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-lift"
            >
              <ReciterAvatar name={reciter.name} className="size-12 text-lg transition-transform duration-300 group-hover:scale-105" />
              <span className="min-w-0">
                <span className="block truncate font-bold text-emerald-deep">{reciter.name}</span>
                <span className="block text-xs text-muted">
                  {toArabicDigits(reciter.moshaf.length)} {reciter.moshaf.length > 2 ? "مصاحف" : "مصحف"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
