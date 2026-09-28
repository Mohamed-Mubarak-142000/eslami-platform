"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Award, KeyRound, Lock, Printer, RotateCcw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import type { Surah } from "@/features/quran/api";
import { StarMark } from "@/components/ui/Ornament";
import { useNow } from "@/features/time/useNow";
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
import { isSurahFullyMemorized } from "./reviewSchedule";
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
  const { state, resetProgress } = useKidsProgress();
  const [childName, setChildName] = useState("");
  const [certificateSurah, setCertificateSurah] = useState<Surah | null>(null);
  const completed = surahs.filter((surah) => isSurahFullyMemorized(state, surah.id));
  const recentDays = new Set(state.activityDates);
  const now = useNow();
  const last14 = Array.from({ length: now ? 14 : 0 }, (_, i) => {
    const date = new Date(now ?? 0);
    date.setDate(date.getDate() - (13 - i));
    return date.toISOString().slice(0, 10);
  });

  function print(surah: Surah) {
    setCertificateSurah(surah);
    setTimeout(() => window.print(), 50);
  }

  return (
    <div className="space-y-6 font-sans">
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
        <div className="mt-2 flex gap-1.5" aria-label="أيام النشاط">
          {last14.map((day) => (
            <span key={day} title={day} className={cn("h-8 flex-1 rounded-lg", recentDays.has(day) ? "bg-[#12a15b]" : "bg-[#eef1ec]")} />
          ))}
        </div>
      </div>

      <div className={kidsPanel}>
        <h2 className="inline-flex items-center gap-2 font-kids text-2xl font-extrabold text-emerald-deep">
          <Award className="size-7 text-gold" aria-hidden /> شهادات الإتمام
        </h2>
        {completed.length === 0 ? (
          <p className="mt-3 text-muted">عندما يتمّ طفلك حفظ سورة كاملة، تظهر هنا شهادتها للطباعة.</p>
        ) : (
          <>
            <label className="mt-4 block">
              <span className="text-sm font-bold text-muted">اسم الطفل على الشهادة</span>
              <input
                value={childName}
                onChange={(event) => setChildName(event.target.value)}
                placeholder="مثال: عمر"
                className="mt-1 h-12 w-full rounded-2xl border-2 border-line px-4 outline-none focus:border-emerald"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              {completed.map((surah) => (
                <button key={surah.id} type="button" onClick={() => print(surah)} className={kidsButton("gold", "py-2 text-base")}>
                  <Printer aria-hidden /> سورة {surah.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className={cn(kidsPanel, "border-2 border-dashed border-[#e84a67]/40")}>
        <h2 className="font-kids text-xl font-extrabold text-[#b92f49]">إعادة ضبط التقدّم</h2>
        <p className="mt-1 text-sm text-muted">يمسح كل ما حُفظ من تقدّم ونجوم وشارات على هذا الجهاز.</p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("سيُمسح كل التقدّم على هذا الجهاز. متأكد؟")) resetProgress();
          }}
          className={kidsButton("rose", "mt-4 py-2 text-base")}
        >
          <RotateCcw aria-hidden /> امسح التقدّم
        </button>
      </div>

      {certificateSurah && (
        <section className="print-area hidden print:block" aria-hidden>
          <div className="mx-auto flex min-h-[90vh] max-w-3xl flex-col items-center justify-center rounded-[2rem] border-[10px] border-double border-gold p-12 text-center">
            <StarMark className="size-20 text-gold" />
            <h1 className="mt-6 font-display text-5xl font-bold text-emerald-deep">شهادة إتمام حفظ</h1>
            <p className="mt-8 text-2xl">يسرّ المنارة أن تهنّئ</p>
            <p className="mt-3 font-display text-4xl font-bold text-gold-deep">{childName || "البطل الصغير"}</p>
            <p className="mt-6 text-2xl">
              بإتمام حفظ <span className="font-bold text-emerald-deep">سورة {certificateSurah.name}</span>
            </p>
            <p className="mt-10 text-lg text-muted">{now ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "long" }).format(now) : ""}</p>
          </div>
        </section>
      )}
    </div>
  );
}
