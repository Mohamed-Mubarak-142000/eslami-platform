"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, FormAlert, SubmitButton } from "@/features/auth/ui/AuthFields";
import type { FormState } from "@/features/auth/actions";
import { ActionButton } from "./AdminControls";
import { createSponsorAction, deleteSponsorAction, setSponsorActiveAction } from "./sponsorActions";

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
      <Field
        label="رابط الشعار (اختياري)"
        name="logo_url"
        dir="ltr"
        placeholder="https://.../logo.png"
        hint="صورة مربعة بخلفية شفافة أو فاتحة."
        error={state?.fieldErrors?.logo_url}
      />
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
