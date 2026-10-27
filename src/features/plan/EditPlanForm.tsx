"use client";

import { useActionState, useState } from "react";
import { FormAlert, SubmitButton } from "@/features/auth/ui/AuthFields";
import { useKidsProgress } from "@/features/kids/progress/KidsProgressProvider";
import { updatePlanAction, type PlanFormState } from "./actions";
import { FAR_OPTIONS, fieldClass, REVIEW_OPTIONS } from "./CreatePlanForm";
import { DaysPicker, FieldError } from "./FormBits";
import { SurahPicker, type KnownSelection, type PickerJuz, type PickerSurah } from "./SurahPicker";
import { PAGES_PER_DAY_OPTIONS, pagesLabel, unitsLabel } from "./schedule";
import type { TodayView } from "./view";

/**
 * Changes the running plan without starting over: how much to memorize a day, how many older pages
 * to review, the days, and the surahs known from before — add one memorized elsewhere and it joins
 * the review rotation.
 */
export function EditPlanForm({
  kind,
  settings,
  surahs,
  juzList,
  onDone,
}: {
  kind: TodayView["kind"];
  settings: TodayView["settings"];
  surahs: PickerSurah[];
  juzList: PickerJuz[];
  onDone: () => void;
}) {
  const { setAyahsMemorized } = useKidsProgress();
  const [state, action] = useActionState<PlanFormState | undefined, FormData>(async (previous, formData) => {
    const result = await updatePlanAction(previous, formData);
    // Surahs just added count as memorized in the learner's progress, as when a plan is made.
    for (const { surah, ayahs } of result.memorized ?? []) setAyahsMemorized(surah, ayahs, true);
    if (result.message) onDone();
    return result;
  }, undefined);
  const [known, setKnown] = useState<KnownSelection>({ surahs: settings.priorSurahs, juz: settings.priorJuz });
  const [newDays, setNewDays] = useState(settings.newDays);
  const [reviewDays, setReviewDays] = useState(settings.reviewDays);
  const memorize = kind === "memorize";
  const errors = state?.fieldErrors;

  return (
    <form action={action} className="rounded-4xl border border-line bg-white p-6 shadow-soft">
      <h2 className="text-xl font-bold text-emerald-deep">تعديل الخطة</h2>
      <p className="mt-1 text-sm text-muted">يبقى ما أنجزته في الخطة كما هو، وتسري التعديلات من وردك القادم.</p>
      <FormAlert error={state?.error} />
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {memorize && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">أحفظ في كل يوم حفظ</span>
            <select name="unitsPerDay" defaultValue={settings.unitsPerDay} className={fieldClass}>
              {PAGES_PER_DAY_OPTIONS.map((units) => (
                <option key={units} value={units}>
                  {unitsLabel(units)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">
            {memorize ? "مراجعة ما حفظته سابقًا في كل يوم مراجعة" : "أراجع في كل يوم مراجعة"}
          </span>
          <select name="farPages" defaultValue={settings.farPages} className={fieldClass}>
            {(memorize ? FAR_OPTIONS : REVIEW_OPTIONS).map((count) => (
              <option key={count} value={count}>
                {count === 0 ? "بدون" : count === 20 && !memorize ? "جزءًا كاملًا (٢٠ صفحة)" : pagesLabel(count)}
              </option>
            ))}
          </select>
          <FieldError message={errors?.farPages} />
        </label>
        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-bold">{memorize ? "ما حفظته من قبل (يدخل في المراجعة)" : "ما تحفظه من القرآن"}</span>
          <SurahPicker
            surahs={surahs}
            juzList={juzList}
            value={known}
            onChange={setKnown}
            placeholder="أضف سورًا أو أجزاءً حفظتها لتدخل في المراجعة"
          />
          <FieldError message={errors?.priorSurahs} />
          <span className="mt-1 block text-xs text-muted">ما تضيفه هنا يدخل في مراجعة «البعيد» بالتناوب، ويُحسب محفوظًا في «رحلتي».</span>
        </div>
        {memorize && (
          <div className="sm:col-span-2">
            <DaysPicker name="newDays" label="أيام الحفظ" days={newDays} onChange={setNewDays} error={errors?.newDays} />
          </div>
        )}
        <div className="sm:col-span-2">
          <DaysPicker name="reviewDays" label="أيام المراجعة" days={reviewDays} onChange={setReviewDays} error={errors?.reviewDays} />
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <SubmitButton>حفظ التعديلات</SubmitButton>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex h-11 items-center rounded-full px-5 font-bold text-muted hover:bg-emerald-mist"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
