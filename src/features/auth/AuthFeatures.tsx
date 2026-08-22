"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "@/i18n/LocaleProvider";
import { Alert, Button, Checkbox, TextField } from "@/components/ui";
import { ErrorSummary } from "@/components/patterns";
import { useAuthBrandTimeline, useSocialMotionPreset } from "@/lib/motion";
import { FeatureState, type FeatureStatus } from "../shared/FeatureState";
import "./auth-features.css";

type AsyncState = "idle" | "loading" | "success" | "error" | "offline" | "rate-limited";
type AccountType = "member" | "scholar";
type FieldErrors = Record<"email" | "password" | "name" | "confirm" | "terms" | "specialty" | "credential", string>;
const emptyErrors = (): FieldErrors => {
  const values: FieldErrors = { email: "", password: "", name: "", confirm: "", terms: "", specialty: "", credential: "" };
  return new Proxy(values, { ownKeys: (target) => Reflect.ownKeys(target).filter((key) => typeof key !== "string" || Boolean(target[key as keyof FieldErrors])) });
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthBrandPanel() {
  const t = useTranslations("auth");
  const panelRef = useRef<HTMLElement>(null);
  useAuthBrandTimeline(panelRef);
  return (
    <aside ref={panelRef} className="auth-brand bg-primary text-primary-foreground" aria-label={t.brandAria}>
      <a className="auth-brand__logo" href="/" aria-label={t.logoHomeAria} data-auth-brand-reveal>
        <span aria-hidden="true">م</span> {t.brand}
      </a>
      <div className="auth-brand__message">
        <p className="auth-brand__eyebrow" data-auth-brand-reveal>{t.brandEyebrow}</p>
        <h2 data-auth-brand-reveal>{t.brandHeading}</h2>
        <ul aria-label={t.featuresAria}>
          <li data-auth-brand-reveal><span className="auth-brand__feature-icon" aria-hidden="true"><CheckCircle2 size={15} /></span> {t.feature1}</li>
          <li data-auth-brand-reveal><span className="auth-brand__feature-icon" aria-hidden="true"><CheckCircle2 size={15} /></span> {t.feature2}</li>
          <li data-auth-brand-reveal><span className="auth-brand__feature-icon" aria-hidden="true"><CheckCircle2 size={15} /></span> {t.feature3}</li>
        </ul>
      </div>
      <p className="auth-brand__note" data-auth-brand-reveal>{t.brandNote}</p>
    </aside>
  );
}

function AuthSurface({ title, intro, children, footer, busy = false }: { title: string; intro: string; children: ReactNode; footer: ReactNode; busy?: boolean }) {
  const t = useTranslations("auth");
  return (
    <div className="auth-page">
      <AuthBrandPanel />
      <main className="auth-main">
        <div className="auth-main__top"><a href="/">{t.backHome}</a></div>
        <section className="auth-card" aria-labelledby="auth-title" aria-busy={busy || undefined}>
          <header className="auth-card__header">
            <span className="auth-card__mark" aria-hidden="true">م</span>
            <h1 id="auth-title">{title}</h1>
            <p>{intro}</p>
          </header>
          {children}
          <footer className="auth-card__footer">{footer}</footer>
        </section>
        <p className="auth-demo-note">{t.demoNote}</p>
      </main>
    </div>
  );
}

function PasswordField({ id, name, label, autoComplete, value, onChange, error, hint }: { id: string; name: string; label: string; autoComplete: string; value: string; onChange: (value: string) => void; error?: string | undefined; hint?: string | undefined }) {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-password">
      <TextField id={id} name={name} type={visible ? "text" : "password"} label={label} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.currentTarget.value)} error={error ?? ""} hint={hint ?? ""} required />
      <button type="button" className="auth-password__toggle" aria-label={visible ? t.hidePassword(label) : t.showPassword(label)} aria-pressed={visible} onClick={() => setVisible((current) => !current)}>
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}

function StatusMessage({ state }: { state: AsyncState }) {
  const t = useTranslations("auth");
  if (state === "offline") return <Alert tone="warning" title={t.offlineTitle}>{t.offlineMessage}</Alert>;
  if (state === "rate-limited") return <Alert tone="warning" title={t.rateLimitedTitle}>{t.rateLimitedMessage}</Alert>;
  if (state === "error") return <Alert tone="error" title={t.requestErrorTitle}>{t.requestErrorMessage}</Alert>;
  return null;
}

export interface LoginFormProps { status?: FeatureStatus; requestState?: AsyncState; onSubmit?: (value: { email: string; password: string }) => void | Promise<void> }
export function LoginForm({ status = "ready", requestState = "idle", onSubmit }: LoginFormProps) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors);
  const [submitting, setSubmitting] = useState(false);
  const busy = submitting || requestState === "loading";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = emptyErrors();
    if (!emailPattern.test(email)) next.email = t.login.emailInvalid;
    if (!password) next.password = t.login.passwordRequired;
    setErrors(next);
    if (Object.values(next).some(Boolean) || busy) return;
    setSubmitting(true);
    try {
      await onSubmit?.({ email, password });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FeatureState status={status}>
      <AuthSurface title={t.login.title} intro={t.login.intro} busy={busy} footer={<p>{t.login.noAccount} <a href="/register">{t.login.createAccount}</a></p>}>
        <form className="auth-form" onSubmit={submit} noValidate>
          <ErrorSummary items={Object.entries(errors).map(([id, label]) => ({ id: `login-${id}`, label }))} />
          <StatusMessage state={requestState} />
          {requestState === "success" && <Alert tone="success">{t.login.success}</Alert>}
          <TextField id="login-email" name="email" type="email" label={t.login.emailLabel} placeholder="name@example.com" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} error={errors.email} required />
          <PasswordField id="login-password" name="password" label={t.login.passwordLabel} autoComplete="current-password" value={password} onChange={setPassword} error={errors.password} />
          <div className="auth-form__options">
            <Checkbox id="login-remember" name="remember" label={t.login.remember} />
            <a href="/forgot-password">{t.login.forgot}</a>
          </div>
          <Button className="auth-form__submit" type="submit" loading={busy} loadingLabel={t.login.submitLoading}>{t.login.submit}</Button>
        </form>
      </AuthSurface>
    </FeatureState>
  );
}

export interface RegisterFormProps { requestState?: AsyncState; onSubmit?: (value: { displayName: string; email: string; accountType: AccountType; specialty?: string; credential?: string }) => void | Promise<void> }
export function RegisterForm({ requestState = "idle", onSubmit }: RegisterFormProps) {
  const t = useTranslations("auth");
  const [accountType, setAccountType] = useState<AccountType>("member");
  const [values, setValues] = useState({ displayName: "", email: "", password: "", confirm: "", terms: false, specialty: "", credential: "" });
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors);
  const [submitting, setSubmitting] = useState(false);
  const busy = submitting || requestState === "loading";
  const passwordScore = Math.min(4, [values.password.length >= 12, /[A-Za-z]/.test(values.password), /\d/.test(values.password), /[^A-Za-z0-9]/.test(values.password)].filter(Boolean).length);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = emptyErrors();
    if (values.displayName.trim().length < 2) next.name = t.register.nameInvalid;
    if (!emailPattern.test(values.email)) next.email = t.register.emailInvalid;
    if (values.password.length < 12) next.password = t.register.passwordTooShort;
    if (values.confirm !== values.password) next.confirm = t.register.passwordMismatch;
    if (!values.terms) next.terms = t.register.termsRequired;
    if (accountType === "scholar") {
      if (!values.specialty.trim()) next.specialty = t.register.specialtyInvalid;
      if (!values.credential.trim()) next.credential = t.register.credentialInvalid;
    }
    setErrors(next);
    if (Object.values(next).some(Boolean) || busy) return;
    setSubmitting(true);
    try {
      await onSubmit?.({
        displayName: values.displayName.trim(),
        email: values.email,
        accountType,
        ...(accountType === "scholar" ? { specialty: values.specialty.trim(), credential: values.credential.trim() } : {}),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthSurface title={t.register.title} intro={t.register.intro} busy={busy} footer={<p>{t.register.haveAccount} <a href="/login">{t.register.signIn}</a></p>}>
      <form className="auth-form" onSubmit={submit} noValidate>
        <ErrorSummary items={Object.entries(errors).map(([id, label]) => ({ id: `register-${id}`, label }))} />
        <StatusMessage state={requestState} />
        {requestState === "success" && <Alert tone="success" title={t.register.successTitle}>{accountType === "scholar" ? t.register.successMessageScholar : t.register.successMessage}</Alert>}
        <fieldset className="auth-account-type">
          <legend>{t.register.accountTypeLegend}</legend>
          <label className="auth-account-type__option" data-selected={accountType === "member" || undefined}>
            <input type="radio" name="accountType" value="member" checked={accountType === "member"} onChange={() => setAccountType("member")} />
            <span><strong>{t.register.accountTypeMemberLabel}</strong><small>{t.register.accountTypeMemberHint}</small></span>
          </label>
          <label className="auth-account-type__option" data-selected={accountType === "scholar" || undefined}>
            <input type="radio" name="accountType" value="scholar" checked={accountType === "scholar"} onChange={() => setAccountType("scholar")} />
            <span><strong>{t.register.accountTypeScholarLabel}</strong><small>{t.register.accountTypeScholarHint}</small></span>
          </label>
        </fieldset>
        <div className="auth-form__grid">
          <TextField id="register-name" name="displayName" label={t.register.nameLabel} autoComplete="name" value={values.displayName} onChange={(event) => setValues({ ...values, displayName: event.currentTarget.value })} error={errors.name} required />
          <TextField id="register-email" name="email" type="email" label={t.register.emailLabel} placeholder="name@example.com" autoComplete="email" inputMode="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.currentTarget.value })} error={errors.email} required />
        </div>
        {accountType === "scholar" && (
          <>
            <div className="auth-form__grid">
              <TextField id="register-specialty" name="specialty" label={t.register.specialtyLabel} value={values.specialty} onChange={(event) => setValues({ ...values, specialty: event.currentTarget.value })} error={errors.specialty} required />
              <TextField id="register-credential" name="credential" label={t.register.credentialLabel} value={values.credential} onChange={(event) => setValues({ ...values, credential: event.currentTarget.value })} error={errors.credential} required />
            </div>
            <p className="auth-account-type__hint">{t.register.accountTypeScholarNote}</p>
          </>
        )}
        <PasswordField id="register-password" name="password" label={t.register.passwordLabel} autoComplete="new-password" value={values.password} onChange={(password) => setValues({ ...values, password })} error={errors.password} hint={t.register.passwordHint} />
        <div className="auth-strength" aria-label={t.register.strengthAria(passwordScore)}>
          <span style={{ inlineSize: `${passwordScore * 25}%` }} />
          <small>{passwordScore < 2 ? t.register.strengthWeak : passwordScore < 4 ? t.register.strengthGood : t.register.strengthStrong}</small>
        </div>
        <PasswordField id="register-confirm" name="confirm" label={t.register.confirmLabel} autoComplete="new-password" value={values.confirm} onChange={(confirm) => setValues({ ...values, confirm })} error={errors.confirm} />
        <Checkbox
          id="register-terms"
          name="terms"
          checked={values.terms}
          onChange={(event) => setValues({ ...values, terms: event.currentTarget.checked })}
          label={<>{t.register.agreeTo} <a href="/terms">{t.register.terms}</a> {t.register.and}<a href="/privacy">{t.register.privacyPolicy}</a></>}
          description={t.register.termsDescription}
          aria-invalid={Boolean(errors.terms)}
          aria-describedby={errors.terms ? "register-terms-error" : undefined}
        />
        {errors.terms && <p id="register-terms-error" className="auth-inline-error" role="alert">{errors.terms}</p>}
        <Button className="auth-form__submit" type="submit" loading={busy} loadingLabel={t.register.submitLoading}>{t.register.submit}</Button>
      </form>
    </AuthSurface>
  );
}

export function ForgotPasswordForm({ requestState = "idle", onSubmit }: { requestState?: AsyncState; onSubmit?: (email: string) => void | Promise<void> }) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailPattern.test(email)) return setError(t.forgot.emailInvalid);
    setError("");
    setBusy(true);
    try {
      await onSubmit?.(email);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthSurface title={t.forgot.title} intro={t.forgot.intro} busy={busy} footer={<a href="/login">{t.forgot.backToLogin}</a>}>
      <form className="auth-form" onSubmit={submit} noValidate>
        <StatusMessage state={requestState} />
        {requestState === "success" && <Alert tone="success">{t.forgot.success}</Alert>}
        <TextField id="forgot-email" name="email" type="email" label={t.forgot.emailLabel} autoComplete="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} error={error} required />
        <Button className="auth-form__submit" type="submit" loading={busy || requestState === "loading"}>{t.forgot.submit}</Button>
      </form>
    </AuthSurface>
  );
}

export function ResetPasswordForm({ tokenState = "valid", requestState = "idle", onSubmit }: { tokenState?: "valid" | "expired" | "used" | "invalid"; requestState?: AsyncState; onSubmit?: (password: string) => void | Promise<void> }) {
  const t = useTranslations("auth");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors);
  const [busy, setBusy] = useState(false);
  const preset = useSocialMotionPreset("dialog");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = emptyErrors();
    if (password.length < 12) next.password = t.reset.passwordTooShort;
    if (confirm !== password) next.confirm = t.reset.passwordMismatch;
    setErrors(next);
    if (Object.values(next).some(Boolean) || busy) return;
    setBusy(true);
    try {
      await onSubmit?.(password);
    } finally {
      setBusy(false);
    }
  }

  if (tokenState !== "valid") {
    const intro = tokenState === "expired" ? t.reset.linkExpired : tokenState === "used" ? t.reset.linkUsed : t.reset.linkInvalid;
    return (
      <AuthSurface title={t.reset.linkUnavailableTitle} intro={intro} footer={<a href="/forgot-password">{t.reset.requestNewLink}</a>}>
        <Alert tone="warning">{t.reset.securityNotice}</Alert>
      </AuthSurface>
    );
  }

  return (
    <AuthSurface title={t.reset.title} intro={t.reset.intro} busy={busy} footer={<a href="/login">{t.reset.backToLogin}</a>}>
      <motion.form className="auth-form" onSubmit={submit} noValidate {...preset}>
        <ErrorSummary items={Object.entries(errors).map(([id, label]) => ({ id: `reset-${id}`, label }))} />
        {requestState === "success" && <Alert tone="success">{t.reset.success}</Alert>}
        <PasswordField id="reset-password" name="password" label={t.reset.newPasswordLabel} autoComplete="new-password" value={password} onChange={setPassword} error={errors.password} />
        <PasswordField id="reset-confirm" name="confirm" label={t.reset.confirmLabel} autoComplete="new-password" value={confirm} onChange={setConfirm} error={errors.confirm} />
        <Button className="auth-form__submit" type="submit" loading={busy || requestState === "loading"}>{t.reset.submit}</Button>
      </motion.form>
    </AuthSurface>
  );
}

export function Onboarding({ step = 1, interests = [], onNext }: { step?: number; interests?: readonly string[]; onNext?: (selected: readonly string[]) => void }) {
  const t = useTranslations("auth");
  const [selected, setSelected] = useState<readonly string[]>([]);
  const preset = useSocialMotionPreset("onboarding");
  return (
    <motion.section className="onboarding-card" aria-labelledby="onboarding-title" {...preset}>
      <p aria-label={t.onboarding.stepAria(step)}>{t.onboarding.stepLabel(step)}</p>
      <h1 id="onboarding-title">{t.onboarding.title}</h1>
      {interests.length === 0 ? (
        <p>{t.onboarding.noInterests}</p>
      ) : (
        <fieldset>
          <legend>{t.onboarding.legend(selected.length)}</legend>
          {interests.map((item) => (
            <Checkbox
              id={`interest-${item}`}
              key={item}
              checked={selected.includes(item)}
              onChange={() => setSelected(selected.includes(item) ? selected.filter((value) => value !== item) : [...selected, item])}
              label={item}
            />
          ))}
        </fieldset>
      )}
      <div>
        <Button onClick={() => onNext?.(selected)}>{t.onboarding.save}</Button>
        <Button variant="ghost" onClick={() => onNext?.([])}>{t.onboarding.skip}</Button>
      </div>
    </motion.section>
  );
}
