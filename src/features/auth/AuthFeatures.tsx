"use client";
import { useState, type FormEvent } from "react";
import { Button, TextField } from "@/components/ui";
import { FeatureState, type FeatureStatus } from "../shared/FeatureState";

export function LoginForm({ status = "ready", onSubmit }: { status?: FeatureStatus; onSubmit?: (value: { email: string; password: string }) => void }) {
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const email = String(data.get("email") ?? ""); const password = String(data.get("password") ?? ""); if (!email || !password) return setError("راجع الحقول الموضحة ثم حاول مرة أخرى."); setError(""); onSubmit?.({ email, password }); }
  return <FeatureState status={status}><form aria-labelledby="login-title" onSubmit={submit} noValidate><h1 id="login-title">تسجيل الدخول</h1>{error && <p role="alert">{error}</p>}<TextField id="login-email" name="email" type="email" label="البريد الإلكتروني" autoComplete="email" required /><TextField id="login-password" name="password" type="password" label="كلمة المرور" autoComplete="current-password" required /><Button type="submit">دخول</Button></form></FeatureState>;
}

export function RegisterForm({ onSubmit }: { onSubmit?: (value: { displayName: string; email: string }) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); onSubmit?.({ displayName: String(data.get("displayName") ?? ""), email: String(data.get("email") ?? "") }); }
  return <form aria-labelledby="register-title" onSubmit={submit}><h1 id="register-title">إنشاء حساب</h1><TextField id="register-name" name="displayName" label="اسم العرض" required /><TextField id="register-email" name="email" type="email" label="البريد الإلكتروني" required /><TextField id="register-password" name="password" type="password" label="كلمة المرور" required /><label><input name="terms" type="checkbox" required /> أوافق على الشروط وسياسة الخصوصية</label><Button type="submit">إنشاء الحساب</Button></form>;
}

export function Onboarding({ step = 1, interests = [], onNext }: { step?: number; interests?: readonly string[]; onNext?: (selected: readonly string[]) => void }) {
  const [selected, setSelected] = useState<readonly string[]>([]);
  return <section aria-labelledby="onboarding-title"><p aria-label={`الخطوة ${step} من 3`}>الخطوة {step} من 3</p><h1 id="onboarding-title">اختر اهتماماتك</h1>{interests.length === 0 ? <p>يمكنك المتابعة الآن والاختيار لاحقًا.</p> : <fieldset><legend>الموضوعات</legend>{interests.map(item => <label key={item}><input type="checkbox" checked={selected.includes(item)} onChange={() => setSelected(selected.includes(item) ? selected.filter(x => x !== item) : [...selected, item])} />{item}</label>)}</fieldset>}<Button onClick={() => onNext?.(selected)}>التالي</Button></section>;
}
