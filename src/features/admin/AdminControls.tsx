"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/button";
import { Field, FormAlert, SubmitButton } from "@/features/auth/ui/AuthFields";
import type { FormState } from "@/features/auth/actions";
import type { AppRole, AppSettingsRow } from "@/lib/supabase/database.types";
import { setCertificateRevokedAction, setUserDisabledAction, setUserRoleAction, updateExamSettingsAction } from "./actions";

/** A small button that runs an admin action and shows its outcome inline. */
function ActionButton({ label, run, danger }: { label: string; run: () => Promise<FormState>; danger?: boolean }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<FormState>();
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setResult(await run()))}
        className={buttonClass("outline", "sm", cn(danger && "border-rose/40 text-rose hover:bg-rose/10"))}
      >
        {pending && <Loader2 className="animate-spin" aria-hidden />} {label}
      </button>
      {result?.error && <span className="text-xs font-bold text-rose">{result.error}</span>}
    </span>
  );
}

export function UserControls({ userId, disabled, role, self }: { userId: string; disabled: boolean; role: AppRole; self: boolean }) {
  if (self) return <span className="text-xs text-muted">حسابك</span>;
  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton label={disabled ? "إعادة التفعيل" : "إيقاف"} danger={!disabled} run={() => setUserDisabledAction(userId, !disabled)} />
      <ActionButton
        label={role === "admin" ? "إزالة الإدارة" : "تعيين مديرًا"}
        run={() => setUserRoleAction(userId, role === "admin" ? "user" : "admin")}
      />
    </div>
  );
}

export function CertificateControls({ certificateId, revoked }: { certificateId: string; revoked: boolean }) {
  return (
    <ActionButton
      label={revoked ? "استعادة" : "إلغاء الشهادة"}
      danger={!revoked}
      run={() => setCertificateRevokedAction(certificateId, !revoked)}
    />
  );
}

export function ExamSettingsForm({ settings }: { settings: AppSettingsRow }) {
  const [state, action] = useActionState<FormState | undefined, FormData>(updateExamSettingsAction, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" noValidate>
      <FormAlert error={state?.error} message={state?.message} className="sm:col-span-2 lg:col-span-4" />
      <Field
        label="عدد الأسئلة"
        name="exam_question_count"
        type="number"
        inputMode="numeric"
        dir="ltr"
        defaultValue={settings.exam_question_count}
        error={state?.fieldErrors?.exam_question_count}
      />
      <Field
        label="درجة النجاح (٪)"
        name="exam_pass_percent"
        type="number"
        inputMode="numeric"
        dir="ltr"
        defaultValue={settings.exam_pass_percent}
        error={state?.fieldErrors?.exam_pass_percent}
      />
      <Field
        label="مدة الاختبار (دقيقة)"
        name="exam_minutes"
        type="number"
        inputMode="numeric"
        dir="ltr"
        defaultValue={settings.exam_minutes}
        error={state?.fieldErrors?.exam_minutes}
      />
      <Field
        label="الانتظار بعد الرسوب (ساعة)"
        name="retry_cooldown_hours"
        type="number"
        inputMode="numeric"
        dir="ltr"
        defaultValue={settings.retry_cooldown_hours}
        error={state?.fieldErrors?.retry_cooldown_hours}
      />
      <div className="sm:col-span-2 lg:col-span-4 sm:max-w-56">
        <SubmitButton>حفظ الإعدادات</SubmitButton>
      </div>
    </form>
  );
}
