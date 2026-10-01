"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { FormAlert, SubmitButton } from "@/features/auth/ui/AuthFields";
import type { FormState } from "@/features/auth/actions";
import { sendTestReminderAction, updateReminderSettingsAction } from "./actions";

interface SettingsFormProps {
  enabled: boolean;
  hijriOffset: number;
  occasions: { key: string; label: string; enabled: boolean }[];
}

const OFFSETS = [
  { value: -2, label: "قبل التقويم بيومين" },
  { value: -1, label: "قبل التقويم بيوم" },
  { value: 0, label: "مطابق لتقويم أم القرى" },
  { value: 1, label: "بعد التقويم بيوم" },
  { value: 2, label: "بعد التقويم بيومين" },
];

export function ReminderSettingsForm({ enabled, hijriOffset, occasions }: SettingsFormProps) {
  const [state, action] = useActionState<FormState | undefined, FormData>(updateReminderSettingsAction, undefined);
  return (
    <form action={action} className="space-y-5">
      <FormAlert error={state?.error} message={state?.message} />
      <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-ink">
        <input type="checkbox" name="reminders_enabled" defaultChecked={enabled} className="size-5 accent-emerald" />
        تشغيل إرسال التذكيرات تلقائيًا
      </label>

      <div>
        <label htmlFor="hijri_offset" className="mb-1.5 block text-sm font-bold text-ink">
          ضبط التاريخ الهجري
        </label>
        <select
          id="hijri_offset"
          name="hijri_offset"
          defaultValue={String(hijriOffset)}
          className="h-12 w-full max-w-sm rounded-2xl border border-line bg-white px-4 outline-none focus:border-emerald/40"
        >
          {OFFSETS.map((offset) => (
            <option key={offset.value} value={offset.value}>
              {offset.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-muted">
          إن بدأ الشهر عندنا (بالرؤية) بعد تقويم أم القرى بيوم، اختر «بعد التقويم بيوم»، فتتأخر تذكيرات الأيام البيض والمواسم يومًا.
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink">المناسبات المفعّلة</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {occasions.map((occasion) => (
            <label key={occasion.key} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line p-3 text-sm">
              <input
                type="checkbox"
                name="occasion"
                value={occasion.key}
                defaultChecked={occasion.enabled}
                className="size-5 accent-emerald"
              />
              {occasion.label}
            </label>
          ))}
        </div>
      </fieldset>

      <SubmitButton className="sm:w-auto">حفظ الإعدادات</SubmitButton>
    </form>
  );
}

export function TestReminderButton({ occasionKey }: { occasionKey: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<FormState>();
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setResult(await sendTestReminderAction(occasionKey)))}
        className={buttonClass("outline", "md")}
      >
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        أرسل لي نسخة تجريبية
      </button>
      <FormAlert error={result?.error} message={result?.message} />
    </div>
  );
}
