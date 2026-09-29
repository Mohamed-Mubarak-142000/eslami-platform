"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Field, FormAlert, SubmitButton } from "@/features/auth/ui/AuthFields";
import type { FormState } from "@/features/auth/actions";
import { setEmailUpdatesAction, unsubscribeAction, updateFacebookUrlAction } from "./actions";

/** Admin: the Facebook page every announcement links to. Empty hides the Facebook box. */
export function FacebookUrlForm({ facebookUrl }: { facebookUrl: string | null }) {
  const [state, action] = useActionState<FormState | undefined, FormData>(updateFacebookUrlAction, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start" noValidate>
      <FormAlert error={state?.error} message={state?.message} className="sm:col-span-2" />
      <Field
        label="رابط صفحة فيسبوك"
        name="facebook_url"
        dir="ltr"
        defaultValue={facebookUrl ?? ""}
        placeholder="https://www.facebook.com/..."
        hint="يظهر في كل رسالة كزر «تابعنا على فيسبوك». اتركه فارغًا لإخفائه."
        error={state?.fieldErrors?.facebook_url}
      />
      <SubmitButton className="sm:mt-7 sm:w-auto">حفظ الرابط</SubmitButton>
    </form>
  );
}

/** Account page: opt in/out of announcement emails. */
export function EmailUpdatesToggle({ enabled: initial }: { enabled: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<FormState>();
  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-ink">
        <input
          type="checkbox"
          checked={enabled}
          disabled={pending}
          onChange={(event) => {
            const next = event.target.checked;
            setEnabled(next);
            start(async () => {
              const outcome = await setEmailUpdatesAction(next);
              if (outcome.error) setEnabled(!next);
              setResult(outcome);
            });
          }}
          className="size-5 accent-emerald"
        />
        أرسلوا لي رسائل عن الميزات الجديدة في المنارة
        {pending && <Loader2 className="size-4 animate-spin text-muted" aria-hidden />}
      </label>
      <FormAlert error={result?.error} message={result?.message} />
    </div>
  );
}

/** The page behind the email's unsubscribe link: one explicit tap, so link scanners can't trigger it. */
export function UnsubscribeButton({ userId, token }: { userId: string; token: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<FormState>();
  if (result?.message) return <FormAlert message={result.message} />;
  return (
    <div className="space-y-3">
      <FormAlert error={result?.error} />
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setResult(await unsubscribeAction(userId, token)))}
        className={buttonClass("primary", "lg", "w-full")}
      >
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        إيقاف رسائل التحديثات
      </button>
    </div>
  );
}
