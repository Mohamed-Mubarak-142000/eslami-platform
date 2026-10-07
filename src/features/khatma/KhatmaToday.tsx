"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState, useTransition } from "react";
import { BookOpen, CalendarOff, Check, Flame, Loader2, PartyPopper, Trophy } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { FormAlert } from "@/features/auth/ui/AuthFields";
import { archiveKhatmaAction, completeKhatmaTodayAction, type KhatmaResult } from "./actions";
import type { KhatmaView } from "./view";

const DATE_FORMAT = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const formatDay = (day: string) => DATE_FORMAT.format(new Date(day));

export function KhatmaToday({ view }: { view: KhatmaView }) {
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<"read" | "archive" | null>(null);
  const [error, setError] = useState<string | undefined>();

  function run(kind: "read" | "archive", action: () => Promise<KhatmaResult>) {
    setRunning(kind);
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      setRunning(null);
    });
  }
  const spinner = (kind: typeof running) => (pending && running === kind ? <Loader2 className="animate-spin" aria-hidden /> : null);
  const portion = view.portion;
  const sameSurah = portion && portion.from.surah === portion.to.surah;

  return (
    <div className="space-y-6">
      <FormAlert error={error} />

      <section className="rounded-4xl bg-emerald-deep p-6 text-white shadow-lift">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-bold">
            {view.scope} · {view.amount} ({view.daysLabel})
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-bold">
            <Flame className="size-4 text-gold-soft" aria-hidden /> {toArabicDigits(view.streak)} ورد متتالٍ
          </span>
        </div>
        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-white/15"
          role="progressbar"
          aria-valuenow={view.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="نسبة إنجاز الختمة"
        >
          <div className="h-full rounded-full bg-gold" style={{ width: `${view.percent}%` }} />
        </div>
        <p className="mt-2 text-sm leading-7 text-white/80">
          {toArabicDigits(view.pagesDone)} من {toArabicDigits(view.totalPages)} صفحة ({toArabicDigits(view.percent)}٪)
          {view.status === "active" && view.finishDay && ` — تختم إن شاء الله قرابة ${formatDay(view.finishDay)}`}
          {view.targetDay && ` (هدفك ${formatDay(view.targetDay)})`}
        </p>
        {view.finished > 0 && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-gold-soft">
            <Trophy className="size-4" aria-hidden /> أتممت{" "}
            {view.finished === 1
              ? "ختمة واحدة"
              : view.finished === 2
                ? "ختمتين"
                : `${toArabicDigits(view.finished)} ${view.finished <= 10 ? "ختمات" : "ختمة"}`}
          </p>
        )}
      </section>

      {view.status === "completed" ? (
        <section className="rounded-4xl border border-gold/60 bg-linear-to-br from-gold-mist to-white p-6 text-center shadow-soft">
          <PartyPopper className="mx-auto size-10 text-gold-deep" aria-hidden />
          <h2 className="mt-3 text-2xl font-bold text-emerald-deep">
            {view.scope === "المصحف كاملًا" ? "ختمتَ القرآن" : `أتممتَ ${view.scope}`}، تقبّل الله منك!
          </h2>
          {/* Agreed upon (al-Bukhari 6464, Muslim 783). */}
          <p className="mt-2 text-sm text-muted">«أحبُّ الأعمالِ إلى اللهِ أدومُها وإن قلَّ» — ابدأ ختمة جديدة متى شئت.</p>
          <button
            type="button"
            disabled={pending}
            onClick={() => run("archive", archiveKhatmaAction)}
            className={buttonClass("primary", "md", "mt-5")}
          >
            {spinner("archive")} ختمة جديدة
          </button>
        </section>
      ) : (
        portion && (
          <section aria-labelledby="khatma-today" className="rounded-4xl border border-line bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="khatma-today" className="flex items-center gap-2 text-2xl font-bold text-emerald-deep">
                <BookOpen className="size-6 text-gold-deep" aria-hidden /> ورد اليوم
              </h2>
              {portion.done && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-mist px-3 py-1.5 text-sm font-bold text-emerald">
                  <Check className="size-4" aria-hidden /> قرأت ورد اليوم
                </span>
              )}
            </div>
            {!portion.done && !view.readsToday && (
              <p className="mt-3 flex items-start gap-2 rounded-2xl bg-gold-mist p-3 text-sm leading-7 text-gold-deep">
                <CalendarOff className="mt-1 size-4 shrink-0" aria-hidden />
                <span>
                  اليوم ليس من أيام قراءتك ({view.daysLabel}){view.nextDay && `، وردك القادم ${view.nextDay}`}. إن أحببت فاقرأه اليوم.
                </span>
              </p>
            )}
            <div className="mt-4 rounded-3xl bg-ivory p-4 sm:p-5">
              <p className="text-lg font-bold leading-9 text-ink">
                {sameSurah ? (
                  <>
                    سورة {portion.from.surahName}: من الآية {toArabicDigits(portion.from.ayah)} إلى {toArabicDigits(portion.to.ayah)}
                  </>
                ) : (
                  <>
                    من سورة {portion.from.surahName} (الآية {toArabicDigits(portion.from.ayah)}) إلى سورة {portion.to.surahName} (الآية{" "}
                    {toArabicDigits(portion.to.ayah)})
                  </>
                )}
              </p>
              <p className="mt-1 text-sm text-muted">
                {portion.startPage === portion.endPage
                  ? `صفحة ${toArabicDigits(portion.startPage)}`
                  : `الصفحات ${toArabicDigits(portion.startPage)}–${toArabicDigits(portion.endPage)}`}
              </p>
              <Link href={portion.href as Route} className={buttonClass("outline", "sm", "mt-4")}>
                <BookOpen aria-hidden /> اقرأ في المصحف
              </Link>
            </div>
            {!portion.done && (
              <button
                type="button"
                disabled={pending}
                onClick={() => run("read", completeKhatmaTodayAction)}
                className={buttonClass(view.readsToday ? "primary" : "outline", "lg", "mt-5 w-full sm:w-auto")}
              >
                {spinner("read") ?? <Check aria-hidden />} قرأت ورد اليوم
              </button>
            )}
          </section>
        )
      )}

      {view.status === "active" && (
        <div className="text-center">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (window.confirm("إيقاف هذه الختمة والبدء بختمة جديدة؟")) run("archive", archiveKhatmaAction);
            }}
            className="inline-flex items-center gap-2 text-sm font-bold text-muted underline-offset-4 hover:text-rose hover:underline disabled:opacity-60"
          >
            {spinner("archive")} إيقاف الختمة وبدء ختمة جديدة
          </button>
        </div>
      )}
    </div>
  );
}
