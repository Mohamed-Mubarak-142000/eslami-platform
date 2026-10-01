"use client";

import { useActionState, useState } from "react";
import { BookOpen, CalendarClock, ListOrdered } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { FormAlert, SubmitButton } from "@/features/auth/ui/AuthFields";
import type { FormState } from "@/features/auth/actions";
import type { KhatmaUnit } from "@/lib/supabase/database.types";
import { useNow } from "@/features/time/useNow";
import { DaysPicker, FieldError } from "@/features/plan/FormBits";
import { ALL_DAYS, finishDay, planDay, shiftDay } from "@/features/plan/schedule";
import { createKhatmaAction } from "./actions";
import { amountLabel, pagesForDuration, pagesInJuz, PER_SESSION_OPTIONS, sessionsBetween, UNIT_TOTALS } from "./schedule";

type Mode = "amount" | "duration";

const fieldClass =
  "h-12 w-full rounded-2xl border border-line bg-white px-4 text-base text-ink outline-none focus:border-emerald/50 focus:shadow-soft";
const UNIT_NAMES: Record<KhatmaUnit, string> = { pages: "صفحات", hizb: "أحزاب", juz: "أجزاء", surah: "سور" };
const QUICK_DURATIONS: [label: string, days: number][] = [
  ["أسبوع", 7],
  ["١٥ يومًا", 15],
  ["شهر", 30],
  ["شهران", 60],
];
const DATE_FORMAT = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function ModeOption({
  mode,
  current,
  onSelect,
  icon,
  title,
  text,
}: {
  mode: Mode;
  current: Mode;
  onSelect: (mode: Mode) => void;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  const on = mode === current;
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-3xl border p-4 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-gold",
        on ? "border-emerald bg-emerald-mist" : "border-line bg-white hover:border-emerald/40",
      )}
    >
      <input type="radio" name="mode" value={mode} checked={on} onChange={() => onSelect(mode)} className="sr-only" />
      <span
        className={cn("grid size-10 shrink-0 place-items-center rounded-2xl", on ? "bg-emerald text-white" : "bg-gold-mist text-gold-deep")}
      >
        {icon}
      </span>
      <span>
        <span className="block font-bold text-emerald-deep">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{text}</span>
      </span>
    </label>
  );
}

export function CreateKhatmaForm() {
  const [state, action] = useActionState<FormState | undefined, FormData>(createKhatmaAction, undefined);
  const [mode, setMode] = useState<Mode>("amount");
  const [unit, setUnit] = useState<KhatmaUnit>("juz");
  const [perSession, setPerSession] = useState(1);
  const [days, setDays] = useState<number[]>([...ALL_DAYS]);
  const now = useNow();
  const today = now ? planDay(now) : null;
  const [targetDay, setTargetDay] = useState("");
  const errors = state?.fieldErrors;

  const sessions = Math.ceil(UNIT_TOTALS[unit] / perSession);
  const finish = today ? finishDay(sessions, days, today, false) : null;
  const durationPages = today && targetDay ? pagesForDuration(today, targetDay, days) : null;
  const durationSessions = today && targetDay ? sessionsBetween(today, targetDay, days) : 0;

  return (
    <form action={action} className="rounded-4xl border border-line bg-white p-5 shadow-soft sm:p-7" noValidate>
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold-mist text-gold-deep">
          <BookOpen className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-bold text-emerald-deep">ابدأ ختمة</h2>
          <p className="mt-1 text-sm text-muted">اختر مقدار وردك أو موعد ختمك، والأيام التي تقرأ فيها، ونخبرك كل يوم بوردك.</p>
        </div>
      </div>

      <FormAlert error={state?.error} message={state?.message} className="mb-4" />

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">طريقة الختمة</legend>
        <ModeOption
          mode="amount"
          current={mode}
          onSelect={setMode}
          icon={<ListOrdered className="size-5" aria-hidden />}
          title="أقرأ كل يوم مقدارًا"
          text="صفحات أو أحزابًا أو أجزاءً أو سورًا، ونحسب لك موعد الختم."
        />
        <ModeOption
          mode="duration"
          current={mode}
          onSelect={setMode}
          icon={<CalendarClock className="size-5" aria-hidden />}
          title="أختم في مدة"
          text="اختر متى تريد أن تختم، ونقسم لك المصحف على أيامك."
        />
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {mode === "amount" ? (
          <>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">أقرأ بـ</span>
              <select
                name="unit"
                value={unit}
                onChange={(event) => {
                  const next = event.target.value as KhatmaUnit;
                  setUnit(next);
                  setPerSession(PER_SESSION_OPTIONS[next][0]!);
                }}
                className={fieldClass}
              >
                {(Object.keys(UNIT_NAMES) as KhatmaUnit[]).map((key) => (
                  <option key={key} value={key}>
                    {UNIT_NAMES[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">في كل يوم قراءة</span>
              <select
                name="perSession"
                value={perSession}
                onChange={(event) => setPerSession(Number(event.target.value))}
                className={fieldClass}
              >
                {PER_SESSION_OPTIONS[unit].map((count) => (
                  <option key={count} value={count}>
                    {amountLabel(unit, count)}
                    {unit === "pages" && pagesInJuz(count) ? ` (${pagesInJuz(count)})` : ""}
                  </option>
                ))}
              </select>
              <FieldError message={errors?.perSession} />
            </label>
          </>
        ) : (
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-bold">أريد أن أختم خلال</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_DURATIONS.map(([label, count]) => {
                const day = today ? shiftDay(today, count - 1) : "";
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setTargetDay(day)}
                    aria-pressed={targetDay === day}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                      targetDay === day ? "border-emerald bg-emerald text-white" : "border-line bg-white text-ink hover:border-emerald/40",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
              <label className="inline-flex items-center gap-2 text-sm font-bold text-muted">
                أو حتى تاريخ
                <input
                  type="date"
                  name="targetDay"
                  value={targetDay}
                  min={today ?? undefined}
                  onChange={(event) => setTargetDay(event.target.value)}
                  className="h-10 rounded-2xl border border-line bg-white px-3 text-ink outline-none focus:border-emerald/50"
                  dir="ltr"
                />
              </label>
            </div>
            <FieldError message={errors?.targetDay} />
          </div>
        )}
        <div className="sm:col-span-2">
          <DaysPicker name="days" label="أيام القراءة" days={days} onChange={setDays} error={errors?.days} />
        </div>
      </div>

      {mode === "amount" && finish && (
        <p className="mt-6 rounded-2xl bg-emerald-mist p-4 text-sm leading-7 text-emerald-deep">
          تختم في <strong>{toArabicDigits(sessions)} يوم قراءة</strong>، أي قرابة <strong>{DATE_FORMAT.format(new Date(finish))}</strong> إن
          واظبت على أيامك.
        </p>
      )}
      {mode === "duration" && targetDay && (
        <p className="mt-6 rounded-2xl bg-emerald-mist p-4 text-sm leading-7 text-emerald-deep">
          {durationPages === null ? (
            "لا يوم قراءة قبل هذا التاريخ، اختر تاريخًا أبعد أو أيامًا أكثر."
          ) : (
            <>
              {toArabicDigits(durationSessions)} يوم قراءة حتى {DATE_FORMAT.format(new Date(targetDay))}، فوردك{" "}
              <strong>{amountLabel("pages", durationPages)}</strong>
              {pagesInJuz(durationPages) && ` (${pagesInJuz(durationPages)})`} في كل يوم.
            </>
          )}
        </p>
      )}

      <SubmitButton className="mt-5 w-full sm:w-auto">ابدأ الختمة</SubmitButton>
    </form>
  );
}
