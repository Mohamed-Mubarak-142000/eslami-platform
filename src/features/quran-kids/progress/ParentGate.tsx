"use client";

import { useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import {
  clearParentPin,
  hasParentPin,
  isParentUnlockedThisSession,
  markParentUnlockedThisSession,
  setParentPin,
  verifyParentPin,
} from "./parentPinStorage";
import "../quran-kids.css";

const PIN_PATTERN = /^\d{4,6}$/;
const noopSubscribe = () => () => {};
const alwaysFalse = () => false;

export function ParentGate({ children }: { children: ReactNode }) {
  const pinExistsInStorage = useSyncExternalStore(noopSubscribe, hasParentPin, alwaysFalse);
  const unlockedInSession = useSyncExternalStore(noopSubscribe, isParentUnlockedThisSession, alwaysFalse);
  const [pinExistsOverride, setPinExistsOverride] = useState<boolean | null>(null);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const pinExists = pinExistsOverride ?? pinExistsInStorage;
  const unlocked = unlockedInSession || justUnlocked;

  async function handleCreatePin(event: FormEvent) {
    event.preventDefault();
    if (!PIN_PATTERN.test(pin)) {
      setError("الرمز لازم يكون من ٤ إلى ٦ أرقام.");
      return;
    }
    if (pin !== confirmPin) {
      setError("الرمزان غير متطابقين.");
      return;
    }
    await setParentPin(pin);
    markParentUnlockedThisSession();
    setPinExistsOverride(true);
    setJustUnlocked(true);
    setError("");
  }

  async function handleVerifyPin(event: FormEvent) {
    event.preventDefault();
    const ok = await verifyParentPin(pin);
    if (!ok) {
      setError("الرمز غير صحيح.");
      return;
    }
    markParentUnlockedThisSession();
    setJustUnlocked(true);
    setError("");
  }

  function handleForgotPin() {
    if (!window.confirm("سيتم مسح الرمز الحالي، وتقدر تحدد رمزًا جديدًا. متأكد؟")) return;
    clearParentPin();
    setPinExistsOverride(false);
    setJustUnlocked(false);
    setPin("");
    setConfirmPin("");
  }

  if (unlocked) return <>{children}</>;

  return (
    <main id="quran-main" className="quran-page">
      <section className="quran-parent-gate">
        <span className="quran-parent-gate__icon" aria-hidden>{pinExists ? <Lock size={26} /> : <ShieldCheck size={26} />}</span>
        <h1>{pinExists ? "لوحة الأهل" : "أنشئ رمز دخول للوحة الأهل"}</h1>
        <p>
          {pinExists
            ? "أدخل رمز الدخول لمتابعة تقدم طفلك."
            : "الرمز محفوظ في هذا المتصفح فقط، وهدفه منع الطفل من فتح اللوحة عن طريق الخطأ — مش حماية أمنية حقيقية."}
        </p>

        <form onSubmit={pinExists ? handleVerifyPin : handleCreatePin} className="quran-parent-gate__form">
          <label>
            <span className="sr-only">رمز الدخول</span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder="رمز من ٤ أرقام"
              value={pin}
              onChange={(event) => setPin(event.currentTarget.value)}
            />
          </label>
          {!pinExists && (
            <label>
              <span className="sr-only">تأكيد الرمز</span>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="أعد كتابة الرمز"
                value={confirmPin}
                onChange={(event) => setConfirmPin(event.currentTarget.value)}
              />
            </label>
          )}
          {error && <p className="quran-empty" role="alert">{error}</p>}
          <button type="submit" className="quran-parent-gate__submit">{pinExists ? "دخول" : "حفظ الرمز والمتابعة"}</button>
        </form>

        {pinExists && (
          <button type="button" className="quran-parent-gate__forgot" onClick={handleForgotPin}>
            نسيت الرمز؟
          </button>
        )}
      </section>
    </main>
  );
}
