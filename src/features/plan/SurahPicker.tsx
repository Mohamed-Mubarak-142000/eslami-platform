"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { normalizeArabic } from "@/lib/normalizeArabic";

export interface PickerSurah {
  id: number;
  name: string;
  /** The juz the surah starts in, for grouping. */
  juz: number;
}

/**
 * Multi-select dropdown of surahs, grouped by juz with a "whole juz" shortcut. The choice is
 * submitted as repeated hidden `name` inputs.
 */
export function SurahPicker({
  surahs,
  name,
  selected,
  onChange,
  placeholder,
}: {
  surahs: PickerSurah[];
  name: string;
  selected: number[];
  onChange: (next: number[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const chosen = new Set(selected);

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

  const toggle = (ids: number[], on: boolean) => {
    const next = new Set(selected);
    for (const id of ids) {
      if (on) next.add(id);
      else next.delete(id);
    }
    onChange([...next].sort((a, b) => a - b));
  };
  const nameOf = (id: number) => surahs.find((surah) => surah.id === id)?.name ?? String(id);

  return (
    <div ref={ref} className="relative">
      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex h-12 w-full items-center justify-between gap-2 rounded-2xl border border-line bg-white px-4 text-start text-base text-ink outline-none focus:border-emerald/50 focus:shadow-soft"
      >
        <span className={cn("truncate", selected.length === 0 && "text-muted")}>
          {selected.length === 0 ? placeholder : `${toArabicDigits(selected.length)} ${selected.length <= 10 ? "سور" : "سورة"} مختارة`}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-14 z-30 rounded-3xl border border-line bg-white p-3 shadow-lift">
          <label className="flex items-center gap-2 rounded-2xl border border-line px-3">
            <Search className="size-4 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث باسم السورة"
              aria-label="ابحث باسم السورة"
              className="h-10 w-full bg-transparent text-sm outline-none"
            />
          </label>
          <div className="mt-2 max-h-72 space-y-3 overflow-y-auto overscroll-contain p-1">
            {groups.length === 0 && <p className="p-3 text-center text-sm text-muted">لا نتائج</p>}
            {groups.map(([juz, list]) => {
              const all = list.every((surah) => chosen.has(surah.id));
              return (
                <fieldset key={juz}>
                  <legend className="flex w-full items-center justify-between gap-2 py-1">
                    <span className="text-xs font-bold text-gold-deep">الجزء {toArabicDigits(juz)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        toggle(
                          list.map((surah) => surah.id),
                          !all,
                        )
                      }
                      className="text-xs font-bold text-emerald hover:underline"
                    >
                      {all ? "إلغاء الكل" : "اختر الكل"}
                    </button>
                  </legend>
                  <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                    {list.map((surah) => (
                      <label
                        key={surah.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-emerald-mist",
                          chosen.has(surah.id) && "bg-emerald-mist font-bold text-emerald-deep",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={chosen.has(surah.id)}
                          onChange={(event) => toggle([surah.id], event.target.checked)}
                          className="size-4 accent-emerald"
                        />
                        {surah.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between gap-2 border-t border-line pt-2">
            <button type="button" onClick={() => onChange([])} className="text-sm font-bold text-muted hover:text-rose">
              مسح الاختيار
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm font-bold text-emerald">
              تم
            </button>
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {selected.slice(0, 24).map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => toggle([id], false)}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-mist px-2.5 py-1 text-xs font-bold text-emerald-deep hover:bg-rose/10 hover:text-rose"
                aria-label={`إزالة سورة ${nameOf(id)}`}
              >
                {nameOf(id)} <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
          {selected.length > 24 && <li className="px-1 py-1 text-xs text-muted">و{toArabicDigits(selected.length - 24)} أخرى</li>}
        </ul>
      )}
    </div>
  );
}
