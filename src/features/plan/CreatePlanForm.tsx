"use client";

import { useActionState, useState } from "react";
import { BookOpenCheck, CalendarRange, Repeat } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { FormAlert, SubmitButton } from "@/features/auth/ui/AuthFields";
import { useKidsProgress } from "@/features/kids/progress/KidsProgressProvider";
import { useNow } from "@/features/time/useNow";
import { createPlanAction, type PlanFormState } from "./actions";
import { SurahPicker, type PickerSurah } from "./SurahPicker";
import {
  ALL_DAYS,
  finishDay,
  PAGES_PER_DAY_OPTIONS,
  pagesLabel,
  planDay,
  unitsLabel,
  WEEK_ORDER,
  WEEKDAY_NAMES,
  type JuzPages,
} from "./schedule";

const fieldClass =
  "h-12 w-full rounded-2xl border border-line bg-white px-4 text-base text-ink outline-none focus:border-emerald/50 focus:shadow-soft";
const FAR_OPTIONS = [0, 1, 2, 3, 5, 10, 20];
const REVIEW_OPTIONS = [1, 2, 3, 4, 5, 10, 20];
const FINISH_FORMAT = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

type Kind = "memorize" | "review";

function FieldError({ message }: { message?: string | undefined }) {
  return message ? <span className="mt-1 block text-sm text-rose">{message}</span> : null;
}

function DaysPicker({
  name,
  label,
  days,
  onChange,
  error,
}: {
  name: string;
  label: string;
  days: number[];
  onChange: (days: number[]) => void;
  error?: string | undefined;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {WEEK_ORDER.map((day) => {
          const on = days.includes(day);
          return (
            <label
              key={day}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-sm font-bold transition-colors has-focus-visible:ring-2 has-focus-visible:ring-gold",
                on ? "border-emerald bg-emerald text-white" : "border-line bg-white text-muted hover:border-emerald/40",
              )}
            >
              <input
                type="checkbox"
                name={name}
                value={day}
                checked={on}
                onChange={(event) => onChange(event.target.checked ? [...days, day] : days.filter((value) => value !== day))}
                className="sr-only"
              />
              {WEEKDAY_NAMES[day]}
            </label>
          );
        })}
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}

function KindOption({
  kind,
  current,
  onSelect,
  icon,
  title,
  text,
}: {
  kind: Kind;
  current: Kind;
  onSelect: (kind: Kind) => void;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  const on = kind === current;
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-3xl border p-4 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-gold",
        on ? "border-emerald bg-emerald-mist" : "border-line bg-white hover:border-emerald/40",
      )}
    >
      <input type="radio" name="kind" value={kind} checked={on} onChange={() => onSelect(kind)} className="sr-only" />
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

export function CreatePlanForm({
  juzPages,
  surahs,
  surahPages,
  surahNames,
}: {
  juzPages: JuzPages[];
  surahs: PickerSurah[];
  /** First and last mushaf page of each surah, for the preview. */
  surahPages: Record<number, [number, number]>;
  surahNames: Record<number, string>;
}) {
  const { setAyahsMemorized } = useKidsProgress();
  const [state, action] = useActionState<PlanFormState | undefined, FormData>(async (previous, formData) => {
    const result = await createPlanAction(previous, formData);
    // Surahs the learner already knows count as memorized in their progress, like the dashboard toggles.
    for (const { surah, ayahs } of result.memorized ?? []) setAyahsMemorized(surah, ayahs, true);
    return result;
  }, undefined);
  const [kind, setKind] = useState<Kind>("memorize");
  const [startJuz, setStartJuz] = useState(30);
  const [endJuz, setEndJuz] = useState(30);
  const [unitsPerDay, setUnitsPerDay] = useState(2);
  const [reviewPages, setReviewPages] = useState(3);
  const [prior, setPrior] = useState<number[]>([]);
  const [newDays, setNewDays] = useState<number[]>([...ALL_DAYS]);
  const [reviewDays, setReviewDays] = useState<number[]>([...ALL_DAYS]);
  const now = useNow();
  const errors = state?.fieldErrors;

  const start = juzPages[startJuz - 1];
  const end = juzPages[Math.max(startJuz, endJuz) - 1];
  const pages = start && end ? end.endPage - start.startPage + 1 : 0;
  const sessions = Math.ceil((pages * 2) / unitsPerDay);
  const finish = now ? finishDay(sessions, newDays, planDay(now), false) : null;

  const priorPages = new Set<number>();
  for (const id of prior) {
    const [first, last] = surahPages[id] ?? [0, -1];
    for (let page = first; page <= last; page++) {
      if (kind === "review" || !start || !end || page < start.startPage || page > end.endPage) priorPages.add(page);
    }
  }
  const cycle = Math.ceil(priorPages.size / Math.max(1, reviewPages));

  const juzLabel = (juz: JuzPages) =>
    `الجزء ${toArabicDigits(juz.juz)}${surahNames[juz.firstSurah] ? ` — يبدأ بسورة ${surahNames[juz.firstSurah]}` : ""}`;

  return (
    <form action={action} className="rounded-4xl border border-line bg-white p-5 shadow-soft sm:p-7" noValidate>
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold-mist text-gold-deep">
          <CalendarRange className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-bold text-emerald-deep">أنشئ خطتك</h2>
          <p className="mt-1 text-sm text-muted">اختر ما تريده وأيامك المناسبة، ونخبرك كل يوم بوردك من الحفظ والمراجعة.</p>
        </div>
      </div>

      <FormAlert error={state?.error} message={state?.message} className="mb-4" />

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">نوع الخطة</legend>
        <KindOption
          kind="memorize"
          current={kind}
          onSelect={setKind}
          icon={<BookOpenCheck className="size-5" aria-hidden />}
          title="حفظ جديد"
          text="أحفظ أجزاءً جديدة مع مراجعة ما أحفظه."
        />
        <KindOption
          kind="review"
          current={kind}
          onSelect={setKind}
          icon={<Repeat className="size-5" aria-hidden />}
          title="مراجعة محفوظي"
          text="أحفظ سورًا من قبل وأريد تثبيتها بالمراجعة."
        />
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {kind === "memorize" ? (
          <>
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
              <FieldError message={errors?.endJuz} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">أحفظ في كل يوم حفظ</span>
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
              <span className="mb-1.5 block text-sm font-bold">مراجعة المحفوظ القديم في كل يوم مراجعة</span>
              <select name="farPages" defaultValue={2} className={fieldClass}>
                {FAR_OPTIONS.map((count) => (
                  <option key={count} value={count}>
                    {count === 0 ? "بدون" : pagesLabel(count)}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-muted">إلى جانب مراجعة ما حفظته في آخر ٥ أيام حفظ تلقائيًا.</span>
            </label>
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-bold">سور تحفظها من قبل (اختياري)</span>
              <SurahPicker
                surahs={surahs}
                name="priorSurahs"
                selected={prior}
                onChange={setPrior}
                placeholder="اختر السور التي تحفظها لتدخل في المراجعة"
              />
              <span className="mt-1 block text-xs text-muted">
                تدخل في مراجعة المحفوظ القديم من اليوم الأول، وتُحسب محفوظةً في «رحلتي».
              </span>
            </div>
            <div className="sm:col-span-2">
              <DaysPicker name="newDays" label="أيام الحفظ" days={newDays} onChange={setNewDays} error={errors?.newDays} />
            </div>
          </>
        ) : (
          <>
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-bold">السور التي تحفظها</span>
              <SurahPicker
                surahs={surahs}
                name="priorSurahs"
                selected={prior}
                onChange={setPrior}
                placeholder="اختر السور، أو جزءًا كاملًا دفعة واحدة"
              />
              <FieldError message={errors?.priorSurahs} />
              <span className="mt-1 block text-xs text-muted">تُحسب محفوظةً في «رحلتي»، ويُفتح لك اختبار أجزائها.</span>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">أراجع في كل يوم مراجعة</span>
              <select
                name="farPages"
                value={reviewPages}
                onChange={(event) => setReviewPages(Number(event.target.value))}
                className={fieldClass}
              >
                {REVIEW_OPTIONS.map((count) => (
                  <option key={count} value={count}>
                    {count === 20 ? "جزءًا كاملًا (٢٠ صفحة)" : pagesLabel(count)}
                  </option>
                ))}
              </select>
              <FieldError message={errors?.farPages} />
            </label>
          </>
        )}
        <div className="sm:col-span-2">
          <DaysPicker name="reviewDays" label="أيام المراجعة" days={reviewDays} onChange={setReviewDays} error={errors?.reviewDays} />
        </div>
      </div>

      {kind === "memorize" && pages > 0 && (
        <p className="mt-6 rounded-2xl bg-emerald-mist p-4 text-sm leading-7 text-emerald-deep">
          {toArabicDigits(pages)} صفحة (من صفحة {toArabicDigits(start!.startPage)} إلى {toArabicDigits(end!.endPage)}) في{" "}
          <strong>{toArabicDigits(sessions)} يوم حفظ</strong>
          {finish && (
            <>
              ، فتختم إن شاء الله قرابة <strong>{FINISH_FORMAT.format(new Date(finish))}</strong> إن واظبت على أيامك
            </>
          )}
          .{priorPages.size > 0 && ` ويدخل في المراجعة ${toArabicDigits(priorPages.size)} صفحة من محفوظك السابق.`}
        </p>
      )}
      {kind === "review" && priorPages.size > 0 && (
        <p className="mt-6 rounded-2xl bg-emerald-mist p-4 text-sm leading-7 text-emerald-deep">
          محفوظك {toArabicDigits(priorPages.size)} صفحة، تراجعه كاملًا كل <strong>{toArabicDigits(cycle)} يوم مراجعة</strong> ثم تبدأ دورة
          جديدة.
        </p>
      )}

      <SubmitButton className="mt-5 w-full sm:w-auto">ابدأ الخطة</SubmitButton>
    </form>
  );
}
