"use client";

import { useActionState, useState } from "react";
import { CalendarRange } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { FormAlert, SubmitButton } from "@/features/auth/ui/AuthFields";
import type { FormState } from "@/features/auth/actions";
import { useNow } from "@/features/time/useNow";
import { createPlanAction } from "./actions";
import { PAGES_PER_DAY_OPTIONS, unitsLabel, type JuzPages } from "./schedule";

const fieldClass =
  "h-12 w-full rounded-2xl border border-line bg-white px-4 text-base text-ink outline-none focus:border-emerald/50 focus:shadow-soft";
const FAR_OPTIONS = [0, 1, 2, 3, 5, 10, 20];
const FINISH_FORMAT = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric" });

export function CreatePlanForm({ juzPages, surahNames }: { juzPages: JuzPages[]; surahNames: Record<number, string> }) {
  const [state, action] = useActionState<FormState | undefined, FormData>(createPlanAction, undefined);
  const [startJuz, setStartJuz] = useState(30);
  const [endJuz, setEndJuz] = useState(30);
  const [unitsPerDay, setUnitsPerDay] = useState(2);
  const now = useNow();

  const start = juzPages[startJuz - 1];
  const end = juzPages[Math.max(startJuz, endJuz) - 1];
  const pages = start && end ? end.endPage - start.startPage + 1 : 0;
  const days = Math.ceil((pages * 2) / unitsPerDay);
  const finish = now ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000) : null;

  const juzLabel = (juz: JuzPages) =>
    `الجزء ${toArabicDigits(juz.juz)}${surahNames[juz.firstSurah] ? ` — يبدأ بسورة ${surahNames[juz.firstSurah]}` : ""}`;

  return (
    <form action={action} className="rounded-4xl border border-line bg-white p-5 shadow-soft sm:p-7" noValidate>
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold-mist text-gold-deep">
          <CalendarRange className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-bold text-emerald-deep">أنشئ خطة حفظ</h2>
          <p className="mt-1 text-sm text-muted">اختر ما تريد حفظه ومقدارك اليومي، ونخبرك كل يوم بوردك من الحفظ والمراجعة.</p>
        </div>
      </div>

      <FormAlert error={state?.error} message={state?.message} className="mb-4" />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">من الجزء</span>
          <select
            name="startJuz"
            value={startJuz}
            onChange={(event) => {
              const value = Number(event.target.value);
              setStartJuz(value);
              if (endJuz < value) setEndJuz(value);
            }}
            className={fieldClass}
          >
            {juzPages.map((juz) => (
              <option key={juz.juz} value={juz.juz}>
                {juzLabel(juz)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">إلى الجزء</span>
          <select name="endJuz" value={endJuz} onChange={(event) => setEndJuz(Number(event.target.value))} className={fieldClass}>
            {juzPages
              .filter((juz) => juz.juz >= startJuz)
              .map((juz) => (
                <option key={juz.juz} value={juz.juz}>
                  {juzLabel(juz)}
                </option>
              ))}
          </select>
          {state?.fieldErrors?.endJuz && <span className="mt-1 block text-sm text-rose">{state.fieldErrors.endJuz}</span>}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">أحفظ كل يوم</span>
          <select
            name="unitsPerDay"
            value={unitsPerDay}
            onChange={(event) => setUnitsPerDay(Number(event.target.value))}
            className={fieldClass}
          >
            {PAGES_PER_DAY_OPTIONS.map((units) => (
              <option key={units} value={units}>
                {unitsLabel(units)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">مراجعة المحفوظ القديم كل يوم</span>
          <select name="farPages" defaultValue={2} className={fieldClass}>
            {FAR_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count === 0 ? "بدون" : count === 1 ? "صفحة" : count === 2 ? "صفحتان" : `${toArabicDigits(count)} صفحات`}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-muted">إلى جانب مراجعة ما حفظته في آخر ٥ أيام تلقائيًا.</span>
        </label>
      </div>

      {pages > 0 && (
        <p className="mt-5 rounded-2xl bg-emerald-mist p-4 text-sm leading-7 text-emerald-deep">
          {toArabicDigits(pages)} صفحة (من صفحة {toArabicDigits(start!.startPage)} إلى {toArabicDigits(end!.endPage)}) — نحو{" "}
          <strong>{toArabicDigits(days)} يومًا</strong>
          {finish && (
            <>
              ، فتختم إن شاء الله قرابة <strong>{FINISH_FORMAT.format(finish)}</strong> إن واظبت كل يوم
            </>
          )}
          .
        </p>
      )}

      <SubmitButton className="mt-5 w-full sm:w-auto">ابدأ الخطة</SubmitButton>
    </form>
  );
}
