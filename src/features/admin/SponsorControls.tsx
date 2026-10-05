"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Field, FormAlert, SubmitButton } from "@/features/auth/ui/AuthFields";
import type { FormState } from "@/features/auth/actions";
import { ActionButton } from "./AdminControls";
import { createSponsorAction, deleteSponsorAction, setSponsorActiveAction } from "./sponsorActions";

/** The logo upload: pick an image, see it before saving, or clear it. Remounted after a save to reset. */
function LogoPicker({ error }: { error?: string | undefined }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-ink">شعار الراعي (اختياري)</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-dashed border-line bg-ivory text-muted hover:border-emerald/50"
          aria-label="اختر صورة الشعار"
        >
          {preview ? (
            // A local blob preview of the chosen file.
            <img src={preview} alt="" className="size-full object-contain" />
          ) : (
            <ImagePlus className="size-6" aria-hidden />
          )}
        </button>
        <div className="text-xs text-muted">
          <p>صورة مربعة PNG أو JPG أو WebP، حتى ١ ميجابايت.</p>
          {preview && (
            <button
              type="button"
              onClick={() => {
                if (input.current) input.current.value = "";
                setPreview(null);
              }}
              className="mt-1 inline-flex items-center gap-1 font-bold text-rose"
            >
              <X className="size-3.5" aria-hidden /> إزالة الصورة
            </button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        name="logo"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          setPreview(file ? URL.createObjectURL(file) : null);
        }}
      />
      {error && <p className="mt-1.5 text-sm text-rose">{error}</p>}
    </div>
  );
}

export function AddSponsorForm({ today, monthLater }: { today: string; monthLater: string }) {
  const [state, action] = useActionState<FormState | undefined, FormData>(createSponsorAction, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.message) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <FormAlert error={state?.error} message={state?.message} className="sm:col-span-2" />
      <Field label="اسم الراعي" name="name" placeholder="اسم الجهة أو العلامة" error={state?.fieldErrors?.name} />
      <Field
        label="رسالة الرعاية"
        name="message"
        placeholder="الشهر ده برعاية …"
        hint="سطر واحد قصير يظهر تحت الاسم."
        error={state?.fieldErrors?.message}
      />
      <Field
        label="رابط الراعي (اختياري)"
        name="link_url"
        dir="ltr"
        placeholder="https://..."
        hint="يفتح عند الضغط على الكارت."
        error={state?.fieldErrors?.link_url}
      />
      <LogoPicker key={state?.message ?? "logo"} error={state?.fieldErrors?.logo} />
      <Field label="يبدأ في" name="starts_on" type="date" dir="ltr" defaultValue={today} error={state?.fieldErrors?.starts_on} />
      <Field label="ينتهي في" name="ends_on" type="date" dir="ltr" defaultValue={monthLater} error={state?.fieldErrors?.ends_on} />
      <label className="flex items-center gap-2 text-sm font-bold text-ink sm:col-span-2">
        <input type="checkbox" name="active" defaultChecked className="size-4 accent-emerald" /> يظهر في التطبيق خلال مدته
      </label>
      <SubmitButton className="sm:col-span-2 sm:justify-self-start">إضافة الراعي</SubmitButton>
    </form>
  );
}

export function SponsorRowControls({ sponsorId, active }: { sponsorId: string; active: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton label={active ? "إيقاف الظهور" : "إظهار"} run={() => setSponsorActiveAction(sponsorId, !active)} />
      <ActionButton
        label="حذف"
        danger
        run={() => (window.confirm("حذف الراعي نهائيًا؟") ? deleteSponsorAction(sponsorId) : Promise.resolve({}))}
      />
    </div>
  );
}
