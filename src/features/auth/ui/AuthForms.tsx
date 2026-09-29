"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import {
  emailCodeLoginAction,
  forgotPasswordAction,
  loginAction,
  registerAction,
  resendOtpAction,
  resetPasswordAction,
  verifyOtpAction,
  type FormState,
  type OtpType,
} from "../actions";
import { Field, FormAlert, OrDivider, SubmitButton } from "./AuthFields";
import { SocialButtons } from "./SocialButtons";

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-3xl font-bold text-emerald-deep">{title}</h1>
      <p className="mt-2 text-muted">{subtitle}</p>
    </div>
  );
}

function PasswordLogin({ next, notice }: { next?: string | undefined; notice?: string | undefined }) {
  const [state, action] = useActionState<FormState | undefined, FormData>(loginAction, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <FormAlert error={state?.error ?? notice} />
      <Field
        label="البريد الإلكتروني"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        dir="ltr"
        required
        placeholder="name@example.com"
        defaultValue={state?.values?.email}
        error={state?.fieldErrors?.email}
      />
      <Field
        label="كلمة المرور"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="اكتب كلمة المرور"
        error={state?.fieldErrors?.password}
      />
      <div className="text-start">
        <Link href="/forgot-password" className="text-sm font-bold text-emerald hover:underline">
          نسيت كلمة المرور؟
        </Link>
      </div>
      <SubmitButton>دخول</SubmitButton>
    </form>
  );
}

function CodeLogin({ next }: { next?: string | undefined }) {
  const [state, action] = useActionState<FormState | undefined, FormData>(emailCodeLoginAction, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <FormAlert error={state?.error} />
      <Field
        label="البريد الإلكتروني"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        dir="ltr"
        required
        placeholder="name@example.com"
        defaultValue={state?.values?.email}
        error={state?.fieldErrors?.email}
        hint="سنرسل لك كودًا من ٦ أرقام للدخول بدون كلمة مرور."
      />
      <SubmitButton>أرسل لي كود الدخول</SubmitButton>
    </form>
  );
}

export function LoginForm({ next, notice }: { next?: string | undefined; notice?: string | undefined }) {
  const [mode, setMode] = useState<"password" | "code">("password");

  return (
    <div>
      <Heading title="تسجيل الدخول" subtitle="أهلًا بعودتك — تابع رحلتك مع القرآن." />
      <SocialButtons next={next} />
      <OrDivider />
      <div role="tablist" aria-label="طريقة الدخول" className="mb-5 grid grid-cols-2 rounded-full border border-line bg-white p-1">
        {(
          [
            ["password", "بكلمة المرور"],
            ["code", "بكود على البريد"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={cn("rounded-full py-2 text-sm font-bold transition-colors", mode === value ? "bg-emerald text-white" : "text-muted")}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "password" ? <PasswordLogin next={next} notice={notice} /> : <CodeLogin next={next} />}
      <p className="mt-6 text-center text-sm text-muted">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="font-bold text-emerald hover:underline">
          أنشئ حسابًا مجانيًا
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState<FormState | undefined, FormData>(registerAction, undefined);
  return (
    <div>
      <Heading title="إنشاء حساب" subtitle="مجاني تمامًا — احفظ تقدّمك وتقدّم أطفالك واحصل على شهادات الأجزاء." />
      <SocialButtons />
      <OrDivider />
      <form action={action} className="space-y-4" noValidate>
        <FormAlert error={state?.error} />
        <Field
          label="الاسم الكامل"
          name="fullName"
          autoComplete="name"
          required
          placeholder="مثال: أحمد محمد علي"
          defaultValue={state?.values?.fullName}
          error={state?.fieldErrors?.fullName}
          hint="يظهر هذا الاسم على شهاداتك، ويمكنك تعديله لاحقًا."
        />
        <Field
          label="البريد الإلكتروني"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          dir="ltr"
          required
          placeholder="name@example.com"
          defaultValue={state?.values?.email}
          error={state?.fieldErrors?.email}
        />
        <Field
          label="كلمة المرور"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="اختر كلمة مرور قوية"
          error={state?.fieldErrors?.password}
          hint="٨ أحرف على الأقل."
        />
        <Field
          label="تأكيد كلمة المرور"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          placeholder="أعد كتابة كلمة المرور"
          error={state?.fieldErrors?.confirm}
        />
        <SubmitButton>إنشاء الحساب</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        لديك حساب؟{" "}
        <Link href="/login" className="font-bold text-emerald hover:underline">
          سجّل الدخول
        </Link>
      </p>
    </div>
  );
}

const VERIFY_COPY: Record<OtpType, { title: string; subtitle: string }> = {
  signup: { title: "تأكيد البريد الإلكتروني", subtitle: "أرسلنا كودًا من ٦ أرقام إلى" },
  recovery: { title: "استعادة كلمة المرور", subtitle: "إن كان البريد مسجّلًا، فقد أرسلنا كودًا من ٦ أرقام إلى" },
  email: { title: "كود الدخول", subtitle: "أرسلنا كود دخول من ٦ أرقام إلى" },
};

export function VerifyOtpForm({ email, type, next }: { email: string; type: OtpType; next?: string | undefined }) {
  const [state, action] = useActionState<FormState | undefined, FormData>(verifyOtpAction, undefined);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [cooldown, setCooldown] = useState(60);
  const [resendState, setResendState] = useState<FormState | null>(null);
  const [resending, startResend] = useTransition();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "");
    if (clean.length > 1) {
      const next = clean.slice(0, 6).split("");
      const filled = Array.from({ length: 6 }, (_, i) => next[i] ?? "");
      setDigits(filled);
      inputs.current[Math.min(next.length, 5)]?.focus();
      if (next.length === 6) setTimeout(() => formRef.current?.requestSubmit(), 0);
      return;
    }
    const updated = [...digits];
    updated[index] = clean;
    setDigits(updated);
    if (clean && index < 5) inputs.current[index + 1]?.focus();
    if (updated.every(Boolean)) setTimeout(() => formRef.current?.requestSubmit(), 0);
  }

  const copy = VERIFY_COPY[type];
  return (
    <div>
      <Heading title={copy.title} subtitle={`${copy.subtitle} ${email}`} />
      <form ref={formRef} action={action} className="space-y-5">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="next" value={next ?? "/dashboard"} />
        <input type="hidden" name="token" value={digits.join("")} />
        <FormAlert error={state?.error ?? state?.fieldErrors?.token ?? resendState?.error} message={resendState?.message} />
        <div className="flex justify-center gap-2" dir="ltr" role="group" aria-label="كود التحقق">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputs.current[index] = element;
              }}
              value={digit}
              onChange={(event) => setDigit(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !digit && index > 0) inputs.current[index - 1]?.focus();
              }}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={6}
              aria-label={`الرقم ${index + 1}`}
              className="size-13 rounded-2xl border border-line bg-white text-center font-display text-2xl font-bold text-emerald-deep outline-none focus:border-emerald focus:shadow-soft sm:size-14"
            />
          ))}
        </div>
        <SubmitButton>تأكيد</SubmitButton>
      </form>
      <div className="mt-5 text-center text-sm text-muted">
        {cooldown > 0 ? (
          <p>يمكنك طلب كود جديد بعد {toArabicDigits(cooldown)} ثانية</p>
        ) : (
          <button
            type="button"
            disabled={resending}
            onClick={() =>
              startResend(async () => {
                setResendState(await resendOtpAction(email, type));
                setCooldown(60);
              })
            }
            className="font-bold text-emerald hover:underline"
          >
            أرسل الكود مرة أخرى
          </button>
        )}
        <p className="mt-2">لم يصلك؟ تحقّق من مجلد الرسائل غير المرغوب فيها.</p>
      </div>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState<FormState | undefined, FormData>(forgotPasswordAction, undefined);
  return (
    <div>
      <Heading title="نسيت كلمة المرور؟" subtitle="أدخل بريدك وسنرسل لك كودًا لتعيين كلمة مرور جديدة." />
      <form action={action} className="space-y-4" noValidate>
        <FormAlert error={state?.error} />
        <Field
          label="البريد الإلكتروني"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          dir="ltr"
          required
          placeholder="name@example.com"
          defaultValue={state?.values?.email}
          error={state?.fieldErrors?.email}
        />
        <SubmitButton>أرسل الكود</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-bold text-emerald hover:underline">
          العودة لتسجيل الدخول
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState<FormState | undefined, FormData>(resetPasswordAction, undefined);
  return (
    <div>
      <Heading title="كلمة مرور جديدة" subtitle="اختر كلمة مرور قوية لحسابك." />
      <form action={action} className="space-y-4" noValidate>
        <FormAlert error={state?.error} />
        <Field
          label="كلمة المرور الجديدة"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="اختر كلمة مرور قوية"
          error={state?.fieldErrors?.password}
          hint="٨ أحرف على الأقل."
        />
        <Field
          label="تأكيد كلمة المرور"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          placeholder="أعد كتابة كلمة المرور"
          error={state?.fieldErrors?.confirm}
        />
        <SubmitButton>حفظ كلمة المرور</SubmitButton>
      </form>
    </div>
  );
}
