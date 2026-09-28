"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";

interface PickerSurah {
  id: number;
  name: string;
  ayahCount: number;
}

const fieldClass =
  "h-12 w-full rounded-2xl border border-line bg-white px-4 text-base text-ink outline-none focus:border-emerald/50 focus:shadow-soft";

/** Plain GET form: the chosen range lives in the URL, so a session can be bookmarked or shared. */
export function TasmeePicker({
  surahs,
  selected,
}: {
  surahs: PickerSurah[];
  selected: { surah: number; from: number; to: number } | null;
}) {
  const [surahId, setSurahId] = useState(selected?.surah ?? 1);
  const [from, setFrom] = useState(selected?.from ?? 1);
  const [to, setTo] = useState(selected?.to ?? surahs.find((surah) => surah.id === (selected?.surah ?? 1))?.ayahCount ?? 7);
  const count = surahs.find((surah) => surah.id === surahId)?.ayahCount ?? 1;

  return (
    <form
      action="/tasmee"
      method="get"
      className="grid gap-4 rounded-4xl border border-line bg-white p-5 shadow-soft sm:grid-cols-[1.6fr_1fr_1fr_auto] sm:items-end sm:p-6"
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">السورة</span>
        <select
          name="surah"
          value={surahId}
          onChange={(event) => {
            const id = Number(event.target.value);
            setSurahId(id);
            setFrom(1);
            setTo(surahs.find((surah) => surah.id === id)?.ayahCount ?? 1);
          }}
          className={fieldClass}
        >
          {surahs.map((surah) => (
            <option key={surah.id} value={surah.id}>
              {toArabicDigits(surah.id)}. {surah.name} ({toArabicDigits(surah.ayahCount)} آية)
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">من الآية</span>
        <input
          name="from"
          type="number"
          inputMode="numeric"
          min={1}
          max={count}
          value={from}
          onChange={(event) => setFrom(Number(event.target.value))}
          className={fieldClass}
          dir="ltr"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">إلى الآية</span>
        <input
          name="to"
          type="number"
          inputMode="numeric"
          min={from}
          max={count}
          value={to}
          onChange={(event) => setTo(Number(event.target.value))}
          className={fieldClass}
          dir="ltr"
        />
      </label>
      <button type="submit" className={buttonClass("primary", "lg")}>
        <Play aria-hidden className="fill-current" /> {selected ? "ابدأ من جديد" : "ابدأ التسميع"}
      </button>
    </form>
  );
}
