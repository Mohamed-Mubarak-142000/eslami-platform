"use client";

import { motion } from "framer-motion";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Alert, Button, Checkbox, TextField } from "@/components/ui";
import { ErrorSummary } from "@/components/patterns";
import { useAuthBrandTimeline, useSocialMotionPreset } from "@/lib/motion";
import { FeatureState, type FeatureStatus } from "../shared/FeatureState";
import "./auth-features.css";

type AsyncState = "idle" | "loading" | "success" | "error" | "offline" | "rate-limited";
type FieldErrors = Record<"email" | "password" | "name" | "confirm" | "terms", string>;
const emptyErrors = (): FieldErrors => {
  const values: FieldErrors = { email: "", password: "", name: "", confirm: "", terms: "" };
  return new Proxy(values, { ownKeys: (target) => Reflect.ownKeys(target).filter((key) => typeof key !== "string" || Boolean(target[key as keyof FieldErrors])) });
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthBrandPanel() {
  const panelRef = useRef<HTMLElement>(null);
  useAuthBrandTimeline(panelRef);
  return <aside ref={panelRef} className="auth-brand bg-primary text-primary-foreground" aria-label="عن بصيرة">
    <a className="auth-brand__logo" href="/" aria-label="بصيرة — الرئيسية" data-auth-brand-reveal><span aria-hidden="true">ب</span> بصيرة</a>
    <div className="auth-brand__message"><p className="auth-brand__eyebrow" data-auth-brand-reveal>معرفة موثوقة، ومجتمع يتعلّم بهدوء</p><h2 data-auth-brand-reveal>مكانك الآمن للسؤال، القراءة، ومتابعة أهل الاختصاص.</h2><ul aria-label="مزايا المنصة"><li data-auth-brand-reveal><span aria-hidden="true">✓</span> مصادر واضحة قبل التفاعل</li><li data-auth-brand-reveal><span aria-hidden="true">✓</span> هويات وتخصصات قابلة للتحقق</li><li data-auth-brand-reveal><span aria-hidden="true">✓</span> خصوصيتك جزء من التصميم</li></ul></div>
    <p className="auth-brand__note" data-auth-brand-reveal>نسخة تجريبية داخلية — لا تمثل نظام دخول إنتاجيًا.</p>
  </aside>;
}

function AuthSurface({ title, intro, children, footer, busy = false }: { title: string; intro: string; children: ReactNode; footer: ReactNode; busy?: boolean }) {
  return <div className="auth-page"><AuthBrandPanel /><main className="auth-main"><div className="auth-main__top"><a href="/">العودة للرئيسية</a></div><section className="auth-card" aria-labelledby="auth-title" aria-busy={busy || undefined}><header className="auth-card__header"><span className="auth-card__mark" aria-hidden="true">ب</span><h1 id="auth-title">{title}</h1><p>{intro}</p></header>{children}<footer className="auth-card__footer">{footer}</footer></section><p className="auth-demo-note">هذه تجربة mock مقيدة؛ لا تستخدم بيانات دخول حقيقية.</p></main></div>;
}

function PasswordField({ id, name, label, autoComplete, value, onChange, error, hint }: { id: string; name: string; label: string; autoComplete: string; value: string; onChange: (value: string) => void; error?: string | undefined; hint?: string | undefined }) {
  const [visible, setVisible] = useState(false);
  return <div className="auth-password"><TextField id={id} name={name} type={visible ? "text" : "password"} label={label} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.currentTarget.value)} error={error ?? ""} hint={hint ?? ""} required /><button type="button" className="auth-password__toggle" aria-label={visible ? `إخفاء ${label}` : `إظهار ${label}`} aria-pressed={visible} onClick={() => setVisible((current) => !current)}>{visible ? "إخفاء" : "إظهار"}</button></div>;
}

function StatusMessage({ state }: { state: AsyncState }) {
  if (state === "offline") return <Alert tone="warning" title="لا يوجد اتصال">احتفظنا بالبريد فقط. تحقق من الشبكة ثم أعد المحاولة.</Alert>;
  if (state === "rate-limited") return <Alert tone="warning" title="محاولات كثيرة">انتظر قليلًا ثم أعد المحاولة.</Alert>;
  if (state === "error") return <Alert tone="error" title="تعذر إكمال الطلب">تحقق من البيانات أو أعد المحاولة. لم نكشف أي تفاصيل عن الحساب.</Alert>;
  return null;
}

export interface LoginFormProps { status?: FeatureStatus; requestState?: AsyncState; onSubmit?: (value: { email: string; password: string }) => void | Promise<void> }
export function LoginForm({ status = "ready", requestState = "idle", onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [errors, setErrors] = useState<FieldErrors>(emptyErrors); const [submitting, setSubmitting] = useState(false); const busy = submitting || requestState === "loading";
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const next = emptyErrors(); if (!emailPattern.test(email)) next.email = "أدخل بريدًا إلكترونيًا صالحًا."; if (!password) next.password = "أدخل كلمة المرور."; setErrors(next); if (Object.values(next).some(Boolean) || busy) return; setSubmitting(true); try { await onSubmit?.({ email, password }); } finally { setSubmitting(false); } }
  return <FeatureState status={status}><AuthSurface title="مرحبًا بعودتك" intro="سجّل الدخول لتكمل رحلة المعرفة من حيث توقفت." busy={busy} footer={<p>ليس لديك حساب؟ <a href="/register">أنشئ حساب عضو</a></p>}><form className="auth-form" onSubmit={submit} noValidate><ErrorSummary items={Object.entries(errors).map(([id, label]) => ({ id: `login-${id}`, label }))} /><StatusMessage state={requestState} />{requestState === "success" && <Alert tone="success">تم تأكيد الجلسة التجريبية. جارٍ نقلك بأمان…</Alert>}<TextField id="login-email" name="email" type="email" label="البريد الإلكتروني" placeholder="name@example.com" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} error={errors.email} required /><PasswordField id="login-password" name="password" label="كلمة المرور" autoComplete="current-password" value={password} onChange={setPassword} error={errors.password} /><div className="auth-form__options"><Checkbox id="login-remember" name="remember" label="تذكرني على هذا الجهاز" /><a href="/forgot-password">نسيت كلمة المرور؟</a></div><Button className="auth-form__submit" type="submit" loading={busy} loadingLabel="جارٍ تأكيد الجلسة…">تسجيل الدخول</Button></form></AuthSurface></FeatureState>;
}

export interface RegisterFormProps { requestState?: AsyncState; onSubmit?: (value: { displayName: string; email: string }) => void | Promise<void> }
export function RegisterForm({ requestState = "idle", onSubmit }: RegisterFormProps) {
  const [values, setValues] = useState({ displayName: "", email: "", password: "", confirm: "", terms: false }); const [errors, setErrors] = useState<FieldErrors>(emptyErrors); const [submitting, setSubmitting] = useState(false); const busy = submitting || requestState === "loading";
  const passwordScore = Math.min(4, [values.password.length >= 12, /[A-Za-z]/.test(values.password), /\d/.test(values.password), /[^A-Za-z0-9]/.test(values.password)].filter(Boolean).length);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const next = emptyErrors(); if (values.displayName.trim().length < 2) next.name = "اكتب اسمًا ظاهرًا من حرفين على الأقل."; if (!emailPattern.test(values.email)) next.email = "أدخل بريدًا إلكترونيًا صالحًا."; if (values.password.length < 12) next.password = "استخدم 12 حرفًا على الأقل."; if (values.confirm !== values.password) next.confirm = "كلمتا المرور غير متطابقتين."; if (!values.terms) next.terms = "الموافقة على الشروط وسياسة الخصوصية مطلوبة."; setErrors(next); if (Object.values(next).some(Boolean) || busy) return; setSubmitting(true); try { await onSubmit?.({ displayName: values.displayName.trim(), email: values.email }); } finally { setSubmitting(false); } }
  return <AuthSurface title="أنشئ حسابك" intro="حساب عضو للقراءة والسؤال والتفاعل المسؤول." busy={busy} footer={<p>لديك حساب بالفعل؟ <a href="/login">سجّل الدخول</a></p>}><form className="auth-form" onSubmit={submit} noValidate><ErrorSummary items={Object.entries(errors).map(([id, label]) => ({ id: `register-${id}`, label }))} /><StatusMessage state={requestState} />{requestState === "success" && <Alert tone="success" title="تم إنشاء الحساب التجريبي">تحقق من بريدك لإكمال الإعداد. لا يمنح التسجيل صفة عالم أو موثّق.</Alert>}<div className="auth-form__grid"><TextField id="register-name" name="displayName" label="الاسم الظاهر" autoComplete="name" value={values.displayName} onChange={(event) => setValues({ ...values, displayName: event.currentTarget.value })} error={errors.name} required /><TextField id="register-email" name="email" type="email" label="البريد الإلكتروني" placeholder="name@example.com" autoComplete="email" inputMode="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.currentTarget.value })} error={errors.email} required /></div><PasswordField id="register-password" name="password" label="كلمة المرور" autoComplete="new-password" value={values.password} onChange={(password) => setValues({ ...values, password })} error={errors.password} hint="12 حرفًا على الأقل. اللصق ومدير كلمات المرور مسموحان." /><div className="auth-strength" aria-label={`قوة كلمة المرور ${passwordScore} من 4`}><span style={{ inlineSize: `${passwordScore * 25}%` }} /><small>{passwordScore < 2 ? "ضعيفة" : passwordScore < 4 ? "جيدة" : "قوية"}</small></div><PasswordField id="register-confirm" name="confirm" label="تأكيد كلمة المرور" autoComplete="new-password" value={values.confirm} onChange={(confirm) => setValues({ ...values, confirm })} error={errors.confirm} /><Checkbox id="register-terms" name="terms" checked={values.terms} onChange={(event) => setValues({ ...values, terms: event.currentTarget.checked })} label={<>أوافق على <a href="/terms">الشروط</a> و<a href="/privacy">سياسة الخصوصية</a></>} description="ينشئ هذا حساب عضو فقط؛ التوثيق له مسار مراجعة مستقل." aria-invalid={Boolean(errors.terms)} aria-describedby={errors.terms ? "register-terms-error" : undefined} />{errors.terms && <p id="register-terms-error" className="auth-inline-error" role="alert">{errors.terms}</p>}<Button className="auth-form__submit" type="submit" loading={busy} loadingLabel="جارٍ إنشاء الحساب…">إنشاء حساب عضو</Button></form></AuthSurface>;
}

export function ForgotPasswordForm({ requestState = "idle", onSubmit }: { requestState?: AsyncState; onSubmit?: (email: string) => void | Promise<void> }) {
  const [email, setEmail] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!emailPattern.test(email)) return setError("أدخل بريدًا إلكترونيًا صالحًا."); setError(""); setBusy(true); try { await onSubmit?.(email); } finally { setBusy(false); } }
  return <AuthSurface title="استعادة كلمة المرور" intro="سنرسل تعليمات آمنة إن كان البريد مرتبطًا بحساب." busy={busy} footer={<a href="/login">العودة إلى تسجيل الدخول</a>}><form className="auth-form" onSubmit={submit} noValidate><StatusMessage state={requestState} />{requestState === "success" && <Alert tone="success">إن وُجد حساب بهذا البريد، ستصل تعليمات الاستعادة.</Alert>}<TextField id="forgot-email" name="email" type="email" label="البريد الإلكتروني" autoComplete="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} error={error} required /><Button className="auth-form__submit" type="submit" loading={busy || requestState === "loading"}>إرسال تعليمات الاستعادة</Button></form></AuthSurface>;
}

export function ResetPasswordForm({ tokenState = "valid", requestState = "idle", onSubmit }: { tokenState?: "valid" | "expired" | "used" | "invalid"; requestState?: AsyncState; onSubmit?: (password: string) => void | Promise<void> }) {
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [errors, setErrors] = useState<FieldErrors>(emptyErrors); const [busy, setBusy] = useState(false); const preset = useSocialMotionPreset("dialog");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const next = emptyErrors(); if (password.length < 12) next.password = "استخدم 12 حرفًا على الأقل."; if (confirm !== password) next.confirm = "كلمتا المرور غير متطابقتين."; setErrors(next); if (Object.values(next).some(Boolean) || busy) return; setBusy(true); try { await onSubmit?.(password); } finally { setBusy(false); } }
  if (tokenState !== "valid") return <AuthSurface title="الرابط غير متاح" intro={tokenState === "expired" ? "انتهت صلاحية رابط الاستعادة." : tokenState === "used" ? "استُخدم رابط الاستعادة من قبل." : "تعذر التحقق من رابط الاستعادة."} footer={<a href="/forgot-password">اطلب رابطًا جديدًا</a>}><Alert tone="warning">حفاظًا على أمانك، اطلب رابطًا جديدًا ثم افتحه من البريد نفسه.</Alert></AuthSurface>;
  return <AuthSurface title="كلمة مرور جديدة" intro="اختر كلمة قوية لم تستخدمها في حساب آخر." busy={busy} footer={<a href="/login">العودة إلى تسجيل الدخول</a>}><motion.form className="auth-form" onSubmit={submit} noValidate {...preset}><ErrorSummary items={Object.entries(errors).map(([id, label]) => ({ id: `reset-${id}`, label }))} />{requestState === "success" && <Alert tone="success">تم تحديث كلمة المرور في البيئة التجريبية. إبطال الجلسات هنا محاكاة فقط.</Alert>}<PasswordField id="reset-password" name="password" label="كلمة المرور الجديدة" autoComplete="new-password" value={password} onChange={setPassword} error={errors.password} /><PasswordField id="reset-confirm" name="confirm" label="تأكيد كلمة المرور" autoComplete="new-password" value={confirm} onChange={setConfirm} error={errors.confirm} /><Button className="auth-form__submit" type="submit" loading={busy || requestState === "loading"}>تحديث كلمة المرور</Button></motion.form></AuthSurface>;
}

export function Onboarding({ step = 1, interests = [], onNext }: { step?: number; interests?: readonly string[]; onNext?: (selected: readonly string[]) => void }) {
  const [selected, setSelected] = useState<readonly string[]>([]); const preset = useSocialMotionPreset("onboarding");
  return <motion.section className="onboarding-card" aria-labelledby="onboarding-title" {...preset}><p aria-label={`الخطوة ${step} من 2`}>الخطوة {step} من 2</p><h1 id="onboarding-title">اختر اهتماماتك</h1>{interests.length === 0 ? <p>يمكنك المتابعة الآن والاختيار لاحقًا.</p> : <fieldset><legend>اختر من 3 إلى 7 موضوعات — اخترت {selected.length}</legend>{interests.map((item) => <Checkbox id={`interest-${item}`} key={item} checked={selected.includes(item)} onChange={() => setSelected(selected.includes(item) ? selected.filter((value) => value !== item) : [...selected, item])} label={item} />)}</fieldset>}<div><Button onClick={() => onNext?.(selected)}>حفظ ومتابعة</Button><Button variant="ghost" onClick={() => onNext?.([])}>تخطي الآن</Button></div></motion.section>;
}
