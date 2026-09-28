"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, FormAlert, SubmitButton } from "@/features/auth/ui/AuthFields";
import type { FormState } from "@/features/auth/actions";
import { ActionButton } from "./AdminControls";
import { createStoryAction, deleteStoryAction, setStoryPublishedAction } from "./storyActions";

export function AddStoryForm({ nextOrder }: { nextOrder: number }) {
  const [state, action] = useActionState<FormState | undefined, FormData>(createStoryAction, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.message) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <FormAlert error={state?.error} message={state?.message} className="sm:col-span-2" />
      <Field
        className="sm:col-span-2"
        label="رابط فيديو يوتيوب"
        name="video"
        dir="ltr"
        placeholder="https://www.youtube.com/watch?v=..."
        error={state?.fieldErrors?.video}
      />
      <Field label="عنوان القصة" name="title" placeholder="قصة سيدنا نوح" error={state?.fieldErrors?.title} />
      <Field label="النبي (اختياري)" name="prophet" placeholder="نوح عليه السلام" error={state?.fieldErrors?.prophet} />
      <Field
        className="sm:col-span-2"
        label="نبذة قصيرة (اختياري)"
        name="summary"
        hint="تظهر تحت الفيديو."
        error={state?.fieldErrors?.summary}
      />
      <Field label="ماذا تعلّمنا؟ (اختياري)" name="lesson" placeholder="الصبر والثقة بالله" error={state?.fieldErrors?.lesson} />
      <Field
        label="الترتيب"
        name="sort_order"
        type="number"
        inputMode="numeric"
        dir="ltr"
        defaultValue={nextOrder}
        error={state?.fieldErrors?.sort_order}
      />
      <label className="flex items-center gap-2 text-sm font-bold text-ink sm:col-span-2">
        <input type="checkbox" name="published" className="size-4 accent-emerald" /> تظهر للأطفال فورًا
      </label>
      <SubmitButton className="sm:col-span-2 sm:justify-self-start">إضافة القصة</SubmitButton>
    </form>
  );
}

export function StoryRowControls({ storyId, published }: { storyId: string; published: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton label={published ? "إخفاء" : "إظهار للأطفال"} run={() => setStoryPublishedAction(storyId, !published)} />
      <ActionButton
        label="حذف"
        danger
        run={() =>
          window.confirm("حذف القصة نهائيًا؟ سيُحذف معها سجل مشاهدة الأطفال.") ? deleteStoryAction(storyId) : Promise.resolve({})
        }
      />
    </div>
  );
}
