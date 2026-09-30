"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Award, ChevronLeft, Cloud, GraduationCap, KeyRound, Lock, RotateCcw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import type { Surah } from "@/features/quran/api";
import { useActiveLearner } from "@/features/account/AccountProvider";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import { useKidsProgress } from "./KidsProgressProvider";
import {
  clearParentPin,
  hasParentPin,
  isParentUnlockedThisSession,
  markParentUnlockedThisSession,
  setParentPin,
  verifyParentPin,
} from "./parentPinStorage";
import { ActivityStrip, completedSurahIds } from "./ReportParts";
import { computeStars, countMemorizedAyahs } from "./stars";
import { computeStreak } from "./streak";

const PIN_PATTERN = /^\d{4,6}$/;
const noop = () => () => {};

export function ParentArea({ surahs }: { surahs: Surah[] }) {
  const storedPin = useSyncExternalStore(noop, hasParentPin, () => false);
  const sessionUnlocked = useSyncExternalStore(noop, isParentUnlockedThisSession, () => false);
  const [pinOverride, setPinOverride] = useState<boolean | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const pinExists = pinOverride ?? storedPin;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!pinExists) {
      if (!PIN_PATTERN.test(pin)) return setError("الرمز من ٤ إلى ٦ أرقام.");
      if (pin !== confirm) return setError("الرمزان غير متطابقين.");
      await setParentPin(pin);
      setPinOverride(true);
    } else if (!(await verifyParentPin(pin))) {
      return setError("الرمز غير صحيح.");
    }
    markParentUnlockedThisSession();
    setUnlocked(true);
    setError("");
  }

  if (!(unlocked || sessionUnlocked)) {
    return (
      <form onSubmit={submit} className={`${kidsPanel} mx-auto max-w-md text-center`}>
        <span className="mx-auto grid size-18 place-items-center rounded-full bg-[#4b6b62] text-white shadow-[0_6px_0_#324a43]">
          {pinExists ? <Lock className="size-8" aria-hidden /> : <KeyRound className="size-8" aria-hidden />}
        </span>
        <h1 className="mt-4 text-3xl font-extrabold text-emerald-deep">لوحة الأهل</h1>
        <p className="mt-2 font-sans text-muted">
          {pinExists
            ? "أدخل رمز الدخول لمتابعة تقدّم طفلك."
            : "أنشئ رمزًا من ٤–٦ أرقام. يُحفظ على هذا الجهاز فقط، وهدفه ألا يفتح الطفل اللوحة بالخطأ — وليس حماية أمنية."}
        </p>
        <div className="mt-5 space-y-3 font-sans">
          <label className="block">
            <span className="sr-only">رمز الدخول</span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              pattern="\d{4,6}"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="رمز الدخول"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "pin-error" : undefined}
              className="h-14 w-full rounded-2xl border-2 border-line bg-white text-center text-2xl tracking-[0.5em] outline-none focus:border-emerald"
            />
          </label>
          {!pinExists && (
            <label className="block">
              <span className="sr-only">تأكيد الرمز</span>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                pattern="\d{4,6}"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="أعد كتابة الرمز"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "pin-error" : undefined}
                className="h-14 w-full rounded-2xl border-2 border-line bg-white text-center text-2xl tracking-[0.5em] outline-none focus:border-emerald"
              />
            </label>
          )}
          {error && (
            <p id="pin-error" role="alert" className="font-bold text-[#b92f49]">
              {error}
            </p>
          )}
        </div>
        <button type="submit" className={kidsButton("emerald", "mt-5 w-full")}>
          {pinExists ? "دخول" : "حفظ الرمز والدخول"}
        </button>
        {pinExists && (
          <button
            type="button"
            onClick={() => {
              if (!window.confirm("سيُمسح الرمز الحالي وتنشئ رمزًا جديدًا. متأكد؟")) return;
              clearParentPin();
              setPinOverride(false);
              setPin("");
            }}
            className="mt-3 text-sm font-bold text-muted underline"
          >
            نسيت الرمز؟
          </button>
        )}
      </form>
    );
  }

  return <ParentDashboard surahs={surahs} />;
}

function ParentDashboard({ surahs }: { surahs: Surah[] }) {
  const { state, synced, resetProgress } = useKidsProgress();
  const learner = useActiveLearner();
  const done = new Set(completedSurahIds(state));
  const completed = surahs.filter((surah) => done.has(surah.id));
  // Signed in, progress lives in the account: resetting wipes it on every device, not just this one.
  const owner = !synced ? null : learner?.kind === "child" ? `ملف ${learner.display_name}` : "حسابك";
  const resetWarning = owner
    ? `سيُمسح كل ما حُفظ في ${owner} من آيات محفوظة ونجوم وشارات، على كل الأجهزة، ولا يمكن التراجع. متأكد؟`
    : "سيُمسح كل التقدّم على هذا الجهاز. متأكد؟";

  return (
    <div className="space-y-6 font-sans">
      {owner && (
        <Link
          href="/dashboard"
          className="flex items-center justify-between gap-3 rounded-3xl border-2 border-emerald/20 bg-white p-4 font-bold text-emerald-deep shadow-soft hover:border-emerald/40"
        >
          <span className="inline-flex items-center gap-2">
            <Cloud className="size-5 text-emerald" aria-hidden />
            التقدّم محفوظ في {owner}. تفاصيل الحفظ والاختبارات والشهادات كلها في «رحلتي».
          </span>
          <ChevronLeft className="size-5 shrink-0" aria-hidden />
        </Link>
      )}

      <div className={kidsPanel}>
        <h1 className="inline-flex items-center gap-2 font-kids text-3xl font-extrabold text-emerald-deep">
          <ShieldCheck className="size-8 text-emerald" aria-hidden /> لوحة الأهل
        </h1>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["النجوم", computeStars(state)],
            ["آيات محفوظة", countMemorizedAyahs(state)],
            ["سور مكتملة", completed.length],
            ["أيام متتالية", computeStreak(state.activityDates)],
            ["اختبارات", state.quizStats.attempts],
            ["أفضل نتيجة", `${toArabicDigits(state.quizStats.bestScorePercent)}٪`],
            ["ألعاب الحروف", state.matchStats.letterGamesCompleted],
            ["ألعاب التجويد", state.matchStats.tajweedGamesCompleted],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl bg-ivory p-3 text-center">
              <dd className="font-kids text-2xl font-extrabold text-emerald-deep">
                {typeof value === "number" ? toArabicDigits(value) : value}
              </dd>
              <dt className="text-xs font-bold text-muted">{label}</dt>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm font-bold text-muted">النشاط في آخر ١٤ يومًا</p>
        <ActivityStrip activityDates={state.activityDates} className="mt-2" />
      </div>

      <div className={kidsPanel}>
        <h2 className="inline-flex items-center gap-2 font-kids text-2xl font-extrabold text-emerald-deep">
          <Award className="size-7 text-gold" aria-hidden /> شهادات الأجزاء
        </h2>
        {/* Certificates are per juz and only earned by passing its exam — never for a surah alone. */}
        <p className="mt-3 text-muted">
          حين يتمّ طفلك حفظ جزء كامل، يختبر فيه من «اختبارات الأجزاء»، وإذا اجتاز الاختبار حصل على شهادة الجزء برقم تحقق.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/exams" className={kidsButton("gold", "py-2 text-base")}>
            <GraduationCap aria-hidden /> اختبارات الأجزاء
          </Link>
          <Link href="/certificates/mine" className={kidsButton("sky", "py-2 text-base")}>
            <Award aria-hidden /> الشهادات
          </Link>
        </div>
      </div>

      <div className={cn(kidsPanel, "border-2 border-dashed border-[#e84a67]/40")}>
        <h2 className="font-kids text-xl font-extrabold text-[#b92f49]">إعادة ضبط التقدّم</h2>
        <p className="mt-1 text-sm text-muted">
          {owner
            ? `يمسح كل ما حُفظ في ${owner} من تقدّم ونجوم وشارات، على كل الأجهزة — بما فيها نسب الحفظ في «رحلتي».`
            : "يمسح كل ما حُفظ من تقدّم ونجوم وشارات على هذا الجهاز."}
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(resetWarning)) resetProgress();
          }}
          className={kidsButton("rose", "mt-4 py-2 text-base")}
        >
          <RotateCcw aria-hidden /> امسح التقدّم
        </button>
      </div>
    </div>
  );
}
