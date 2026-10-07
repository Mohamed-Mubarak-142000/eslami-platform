"use client";

import { useActionState, useState } from "react";
import { BookOpenCheck, CalendarRange, Repeat } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { FormAlert, SubmitButton } from "@/features/auth/ui/AuthFields";
import { useKidsProgress } from "@/features/kids/progress/KidsProgressProvider";
import { useNow } from "@/features/time/useNow";
import { createPlanAction, type PlanFormState } from "./actions";
import { DaysPicker, FieldError } from "./FormBits";
import { SurahPicker, type KnownSelection, type PickerJuz, type PickerSurah } from "./SurahPicker";
import { ALL_DAYS, finishDay, PAGES_PER_DAY_OPTIONS, pagesLabel, planDay, rangePages, unitsLabel, type JuzPages } from "./schedule";

const fieldClass =
  "h-12 w-full rounded-2xl border border-line bg-white px-4 text-base text-ink outline-none focus:border-emerald/50 focus:shadow-soft";
const FAR_OPTIONS = [0, 1, 2, 3, 5, 10, 20];
const REVIEW_OPTIONS = [1, 2, 3, 4, 5, 10, 20];
const FINISH_FORMAT = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

type Kind = "memorize" | "review";
/** How the memorize range is picked: a juz then a surah inside it, or straight from surah to surah. */
type RangeBy = "juz" | "surah";

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
  juzSurahs,
  surahs,
  juzList,
  surahPages,
  surahNames,
}: {
  juzPages: JuzPages[];
  /** Every surah with ayahs in each juz, in order. */
  juzSurahs: Record<number, number[]>;
  surahs: PickerSurah[];
  juzList: PickerJuz[];
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
  const firstSurah = (juz: number) => juzSurahs[juz]?.[0] ?? 1;
  const lastSurah = (juz: number) => juzSurahs[juz]?.at(-1) ?? 114;
  const [startSurah, setStartSurah] = useState(() => firstSurah(30));
  const [endSurah, setEndSurah] = useState(() => lastSurah(30));
  const [rangeBy, setRangeBy] = useState<RangeBy>("juz");
  const [fromSurah, setFromSurah] = useState(78);
  const [toSurah, setToSurah] = useState(114);
  // A surah can run over several juz (al-Baqarah spans three): it starts in the first and ends in the last.
  const juzOfSurah = (surah: number, edge: "first" | "last") => {
    const span = surahs.find((item) => item.id === surah)?.span ?? [30];
    return edge === "first" ? Math.min(...span) : Math.max(...span);
  };
  const [unitsPerDay, setUnitsPerDay] = useState(2);
  const [reviewPages, setReviewPages] = useState(3);
  const [known, setKnown] = useState<KnownSelection>({ surahs: [], juz: [] });
  const [newDays, setNewDays] = useState<number[]>([...ALL_DAYS]);
  const [reviewDays, setReviewDays] = useState<number[]>([...ALL_DAYS]);
  const now = useNow();
  const errors = state?.fieldErrors;

  const picked =
    rangeBy === "surah"
      ? { startJuz: juzOfSurah(fromSurah, "first"), endJuz: juzOfSurah(toSurah, "last"), startSurah: fromSurah, endSurah: toSurah }
      : { startJuz, endJuz: Math.max(startJuz, endJuz), startSurah, endSurah };
  const range = rangePages(juzPages, surahPages, picked);
  const pages = range ? range.endPage - range.startPage + 1 : 0;
  const sessions = Math.ceil((pages * 2) / unitsPerDay);
  const finish = now ? finishDay(sessions, newDays, planDay(now), false) : null;

  const priorPages = new Set<number>();
  const knownRanges = [
    ...known.surahs.map((id): [number, number] => surahPages[id] ?? [0, -1]),
    ...known.juz.map((juz): [number, number] => [juzPages[juz - 1]?.startPage ?? 0, juzPages[juz - 1]?.endPage ?? -1]),
  ];
  for (const [first, last] of knownRanges) {
    for (let page = first; page <= last; page++) {
      if (kind === "review" || !range || page < range.startPage || page > range.endPage) priorPages.add(page);
    }
  }
  const cycle = Math.ceil(priorPages.size / Math.max(1, reviewPages));

  const juzLabel = (juz: JuzPages) =>
    `الجزء ${toArabicDigits(juz.juz)}${surahNames[juz.firstSurah] ? ` — يبدأ بسورة ${surahNames[juz.firstSurah]}` : ""}`;
  const surahOption = (surah: number, edge: string | null) =>
    `${toArabicDigits(surah)}. سورة ${surahNames[surah] ?? surah}${edge ? ` (${edge})` : ""}`;

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
          title="تثبيت الحفظ"
          text="أحفظ سورًا أو أجزاءً من قبل وأريد تثبيتها بالمراجعة."
        />
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {kind === "memorize" ? (
          <>
            <fieldset className="sm:col-span-2">
              <legend className="mb-1.5 text-sm font-bold">أحدد ما أحفظه</legend>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["juz", "بالأجزاء"],
                    ["surah", "بالسور"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRangeBy(value)}
                    aria-pressed={rangeBy === value}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                      rangeBy === value ? "border-emerald bg-emerald text-white" : "border-line bg-white text-ink hover:border-emerald/40",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            {rangeBy === "surah" ? (
              <>
                {/* The server takes juz + surah; the juz are the ones these surahs start and end in. */}
                <input type="hidden" name="startJuz" value={picked.startJuz} />
                <input type="hidden" name="endJuz" value={picked.endJuz} />
                <input type="hidden" name="startSurah" value={fromSurah} />
                <input type="hidden" name="endSurah" value={toSurah} />
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">من سورة</span>
                  <select
                    value={fromSurah}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setFromSurah(value);
                      if (toSurah < value) setToSurah(value);
                    }}
                    className={fieldClass}
                  >
                    {surahs.map((surah) => (
                      <option key={surah.id} value={surah.id}>
                        {surahOption(surah.id, null)}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors?.startSurah} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">إلى سورة</span>
                  <select value={toSurah} onChange={(event) => setToSurah(Number(event.target.value))} className={fieldClass}>
                    {surahs
                      .filter((surah) => surah.id >= fromSurah)
                      .map((surah) => (
                        <option key={surah.id} value={surah.id}>
                          {surahOption(surah.id, null)}
                        </option>
                      ))}
                  </select>
                  <FieldError message={errors?.endSurah ?? errors?.endJuz} />
                </label>
              </>
            ) : (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">من الجزء</span>
                  <select
                    name="startJuz"
                    value={startJuz}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setStartJuz(value);
                      setStartSurah(firstSurah(value));
                      if (endJuz < value) {
                        setEndJuz(value);
                        setEndSurah(lastSurah(value));
                      }
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
                  <span className="mb-1.5 block text-sm font-bold">من سورة</span>
                  <select
                    name="startSurah"
                    value={startSurah}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setStartSurah(value);
                      if (endSurah < value) setEndSurah(value);
                    }}
                    className={fieldClass}
                  >
                    {(juzSurahs[startJuz] ?? []).map((surah, index) => (
                      <option key={surah} value={surah}>
                        {surahOption(surah, index === 0 ? "أول الجزء" : null)}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors?.startSurah} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">إلى الجزء</span>
                  <select
                    name="endJuz"
                    value={endJuz}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setEndJuz(value);
                      setEndSurah(lastSurah(value));
                    }}
                    className={fieldClass}
                  >
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
                  <span className="mb-1.5 block text-sm font-bold">إلى سورة</span>
                  <select
                    name="endSurah"
                    value={endSurah}
                    onChange={(event) => setEndSurah(Number(event.target.value))}
                    className={fieldClass}
                  >
                    {(juzSurahs[endJuz] ?? [])
                      .filter((surah) => surah >= startSurah)
                      .map((surah, index, list) => (
                        <option key={surah} value={surah}>
                          {surahOption(surah, index === list.length - 1 ? "آخر الجزء" : null)}
                        </option>
                      ))}
                  </select>
                  <FieldError message={errors?.endSurah} />
                </label>
              </>
            )}
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
              <span className="mb-1.5 block text-sm font-bold">مراجعة ما حفظته سابقًا في كل يوم مراجعة</span>
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
              <span className="mb-1.5 block text-sm font-bold">أجزاء أو سور حفظتها من قبل (اختياري)</span>
              <SurahPicker
                surahs={surahs}
                juzList={juzList}
                value={known}
                onChange={setKnown}
                placeholder="اختر جزءًا كاملًا أو سورًا لتدخل في المراجعة"
              />
              <span className="mt-1 block text-xs text-muted">تدخل في مراجعة «البعيد» من اليوم الأول، وتُحسب محفوظةً في «رحلتي».</span>
            </div>
            <div className="sm:col-span-2">
              <DaysPicker name="newDays" label="أيام الحفظ" days={newDays} onChange={setNewDays} error={errors?.newDays} />
            </div>
          </>
        ) : (
          <>
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-bold">ما تحفظه من القرآن</span>
              <SurahPicker
                surahs={surahs}
                juzList={juzList}
                value={known}
                onChange={setKnown}
                placeholder="اختر أجزاءً كاملة بضغطة، أو سورًا بعينها"
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
          {toArabicDigits(pages)} صفحة (من صفحة {toArabicDigits(range!.startPage)} إلى {toArabicDigits(range!.endPage)}) في{" "}
          <strong>{toArabicDigits(sessions)} يوم حفظ</strong>
          {finish && (
            <>
              ، فتختم إن شاء الله قرابة <strong>{FINISH_FORMAT.format(new Date(finish))}</strong> إن واظبت على أيامك
            </>
          )}
          .{priorPages.size > 0 && ` ويدخل في المراجعة ${toArabicDigits(priorPages.size)} صفحة مما حفظته سابقًا.`}
        </p>
      )}
      {kind === "review" && priorPages.size > 0 && (
        <p className="mt-6 rounded-2xl bg-emerald-mist p-4 text-sm leading-7 text-emerald-deep">
          ما تحفظه {toArabicDigits(priorPages.size)} صفحة، تختم مراجعته كل <strong>{toArabicDigits(cycle)} يوم مراجعة</strong> ثم تبدأ دورة
          جديدة.
        </p>
      )}

      <SubmitButton className="mt-5 w-full sm:w-auto">ابدأ الخطة</SubmitButton>
    </form>
  );
}
