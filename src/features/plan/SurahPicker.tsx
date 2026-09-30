"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { normalizeArabic } from "@/lib/normalizeArabic";
import { juzLabel } from "./schedule";

export interface PickerSurah {
  id: number;
  name: string;
  /** The juz the surah starts in, for grouping. */
  juz: number;
  /** Every juz that holds some of the surah: it counts as covered when all of them are picked. */
  span: number[];
}

export interface PickerJuz {
  juz: number;
  /** Surahs lying wholly inside this juz. */
  surahs: number[];
  /** True when the juz is exactly those whole surahs (juz 29, 30…), so picking them all is picking the juz. */
  aligned: boolean;
}

export interface KnownSelection {
  surahs: number[];
  juz: number[];
}

const sorted = (values: Iterable<number>) => [...new Set(values)].sort((a, b) => a - b);

/**
 * Multi-select of what the learner already knows: whole juz (one tap each) and single surahs.
 * A picked juz covers its surahs, and picking every surah of an aligned juz turns into that juz,
 * so the summary reads "الجزء ٣٠" rather than 37 surah names. Submitted as repeated hidden
 * `priorJuz` / `priorSurahs` inputs.
 */
export function SurahPicker({
  surahs,
  juzList,
  value,
  onChange,
  placeholder,
}: {
  surahs: PickerSurah[];
  juzList: PickerJuz[];
  value: KnownSelection;
  onChange: (next: KnownSelection) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const pickedJuz = new Set(value.juz);
  const pickedSurahs = new Set(value.surahs);
  const covered = (surah: PickerSurah) => surah.span.length > 0 && surah.span.every((juz) => pickedJuz.has(juz));

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => !ref.current?.contains(event.target as Node) && setOpen(false);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const groups = useMemo(() => {
    const needle = normalizeArabic(query.trim());
    const matches = surahs.filter((surah) => !needle || normalizeArabic(surah.name).includes(needle) || String(surah.id) === query.trim());
    const byJuz = new Map<number, PickerSurah[]>();
    for (const surah of matches) byJuz.set(surah.juz, [...(byJuz.get(surah.juz) ?? []), surah]);
    return [...byJuz].sort(([a], [b]) => b - a); // Juz Amma first: most people start there.
  }, [surahs, query]);

  /** Drops surahs a picked juz already covers, and folds complete aligned juz into the juz itself. */
  function commit(juzSet: Set<number>, surahSet: Set<number>) {
    for (const info of juzList) {
      if (info.aligned && !juzSet.has(info.juz) && info.surahs.length > 0 && info.surahs.every((id) => surahSet.has(id)))
        juzSet.add(info.juz);
    }
    const keep = [...surahSet].filter((id) => {
      const span = surahs.find((surah) => surah.id === id)?.span ?? [];
      return !(span.length > 0 && span.every((juz) => juzSet.has(juz)));
    });
    onChange({ juz: sorted(juzSet), surahs: sorted(keep) });
  }

  function toggleJuz(juz: number) {
    const juzSet = new Set(value.juz);
    const surahSet = new Set(value.surahs);
    if (juzSet.has(juz)) {
      juzSet.delete(juz);
    } else {
      juzSet.add(juz);
    }
    commit(juzSet, surahSet);
  }

  function toggleSurah(surah: PickerSurah, on: boolean) {
    const juzSet = new Set(value.juz);
    const surahSet = new Set(value.surahs);
    if (on) {
      surahSet.add(surah.id);
    } else if (covered(surah)) {
      // Unpicking one surah of a picked aligned juz: keep the juz's other surahs.
      for (const juz of surah.span) {
        juzSet.delete(juz);
        for (const id of juzList[juz - 1]?.surahs ?? []) if (id !== surah.id) surahSet.add(id);
      }
    } else {
      surahSet.delete(surah.id);
    }
    commit(juzSet, surahSet);
  }

  const nameOf = (id: number) => surahs.find((surah) => surah.id === id)?.name ?? String(id);
  const count = value.juz.length + value.surahs.length;
  const summary = [
    value.juz.length > 0 &&
      `${toArabicDigits(value.juz.length)} ${value.juz.length === 1 ? "جزء" : value.juz.length === 2 ? "جزءان" : "أجزاء"}`,
    value.surahs.length > 0 &&
      `${toArabicDigits(value.surahs.length)} ${value.surahs.length === 1 ? "سورة" : value.surahs.length <= 10 ? "سور" : "سورة"}`,
  ]
    .filter(Boolean)
    .join(" و");

  return (
    <div ref={ref} className="relative">
      {value.juz.map((juz) => (
        <input key={`j${juz}`} type="hidden" name="priorJuz" value={juz} />
      ))}
      {value.surahs.map((id) => (
        <input key={`s${id}`} type="hidden" name="priorSurahs" value={id} />
      ))}
      <button
        type="button"
        onClick={() => setOpen((open) => !open)}
        aria-expanded={open}
        className="flex h-12 w-full items-center justify-between gap-2 rounded-2xl border border-line bg-white px-4 text-start text-base text-ink outline-none focus:border-emerald/50 focus:shadow-soft"
      >
        <span className={cn("truncate", count === 0 && "text-muted")}>{count === 0 ? placeholder : `${summary} مختارة`}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-14 z-30 rounded-3xl border border-line bg-white p-3 shadow-lift">
          <p className="px-1 text-xs font-bold text-gold-deep">أجزاء كاملة</p>
          <div className="mt-1.5 grid grid-cols-6 gap-1 sm:grid-cols-10">
            {juzList.map(({ juz }) => (
              <button
                key={juz}
                type="button"
                onClick={() => toggleJuz(juz)}
                aria-pressed={pickedJuz.has(juz)}
                aria-label={juzLabel(juz)}
                title={juzLabel(juz)}
                className={cn(
                  "h-9 rounded-xl border text-sm font-bold transition-colors",
                  pickedJuz.has(juz)
                    ? "border-emerald bg-emerald text-white"
                    : "border-line text-ink hover:border-emerald/40 hover:bg-emerald-mist",
                )}
              >
                {toArabicDigits(juz)}
              </button>
            ))}
          </div>

          <label className="mt-3 flex items-center gap-2 rounded-2xl border border-line px-3">
            <Search className="size-4 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="أو ابحث عن سورة"
              aria-label="ابحث باسم السورة"
              className="h-10 w-full bg-transparent text-sm outline-none"
            />
          </label>
          <div className="mt-2 max-h-64 space-y-3 overflow-y-auto overscroll-contain p-1">
            {groups.length === 0 && <p className="p-3 text-center text-sm text-muted">لا نتائج</p>}
            {groups.map(([juz, list]) => (
              <fieldset key={juz}>
                <legend className="flex w-full items-center justify-between gap-2 py-1">
                  <span className="text-xs font-bold text-gold-deep">{juzLabel(juz)}</span>
                  <button type="button" onClick={() => toggleJuz(juz)} className="text-xs font-bold text-emerald hover:underline">
                    {pickedJuz.has(juz) ? "إلغاء الجزء" : "الجزء كله"}
                  </button>
                </legend>
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                  {list.map((surah) => {
                    const inJuz = covered(surah);
                    const on = inJuz || pickedSurahs.has(surah.id);
                    return (
                      <label
                        key={surah.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-emerald-mist",
                          on && "bg-emerald-mist font-bold text-emerald-deep",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={(event) => toggleSurah(surah, event.target.checked)}
                          className="size-4 accent-emerald"
                        />
                        {surah.name}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="mt-2 flex justify-between gap-2 border-t border-line pt-2">
            <button
              type="button"
              onClick={() => onChange({ juz: [], surahs: [] })}
              className="text-sm font-bold text-muted hover:text-rose"
            >
              مسح الاختيار
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm font-bold text-emerald">
              تم
            </button>
          </div>
        </div>
      )}

      {count > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {value.juz.map((juz) => (
            <li key={`j${juz}`}>
              <button
                type="button"
                onClick={() => toggleJuz(juz)}
                className="inline-flex items-center gap-1 rounded-full bg-emerald px-2.5 py-1 text-xs font-bold text-white hover:bg-rose"
                aria-label={`إزالة ${juzLabel(juz)}`}
              >
                {juzLabel(juz)} <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
          {value.surahs.slice(0, 24).map((id) => (
            <li key={`s${id}`}>
              <button
                type="button"
                onClick={() => onChange({ ...value, surahs: value.surahs.filter((surah) => surah !== id) })}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-mist px-2.5 py-1 text-xs font-bold text-emerald-deep hover:bg-rose/10 hover:text-rose"
                aria-label={`إزالة سورة ${nameOf(id)}`}
              >
                {nameOf(id)} <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
          {value.surahs.length > 24 && <li className="px-1 py-1 text-xs text-muted">و{toArabicDigits(value.surahs.length - 24)} أخرى</li>}
        </ul>
      )}
    </div>
  );
}
