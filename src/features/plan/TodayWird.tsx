"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState, useTransition, type ReactNode } from "react";
import { BookOpen, BookOpenCheck, CalendarOff, Check, Flame, History, Loader2, Mic, Repeat, Trophy } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { FormAlert } from "@/features/auth/ui/AuthFields";
import { useKidsProgress } from "@/features/kids/progress/KidsProgressProvider";
import { archivePlanAction, completeNewAction, completeReviewAction, type CompleteResult } from "./actions";
import type { DaySchedule, PageLink, TodayView } from "./view";

const HALF_LABEL: Record<PageLink["half"], string> = { full: "", first: " (النصف الأول)", second: " (النصف الثاني)" };
const FINISH_FORMAT = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const SHOWN_SURAHS = 8;

function pageTitle(link: PageLink) {
  return `صفحة ${toArabicDigits(link.page)}${HALF_LABEL[link.half]}`;
}

function PageChips({ pages }: { pages: PageLink[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {pages.map((link) => (
        <li key={`${link.page}-${link.half}`}>
          <Link
            href={link.href as Route}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ivory px-3 py-1.5 text-sm font-bold text-emerald-deep hover:border-emerald/40"
          >
            <BookOpen className="size-4 text-gold-deep" aria-hidden />
            {pageTitle(link)} · {link.surahName}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function DoneBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-mist px-3 py-1.5 text-sm font-bold text-emerald">
      <Check className="size-4" aria-hidden /> {children}
    </span>
  );
}

/** Shown on a day that isn't one of the learner's chosen days; the portion stays available. */
function DayOff({ schedule, what }: { schedule: DaySchedule; what: string }) {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-2xl bg-gold-mist p-3 text-sm leading-7 text-gold-deep">
      <CalendarOff className="mt-1 size-4 shrink-0" aria-hidden />
      <span>
        اليوم ليس من أيام {what} ({schedule.label}){schedule.next && `، موعدك القادم ${schedule.next}`}. إن أحببت فأنجزه اليوم، وإلا فهو
        بانتظارك.
      </span>
    </p>
  );
}

function Card({
  id,
  icon,
  title,
  badge,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="rounded-4xl border border-line bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={id} className="flex items-center gap-2 text-2xl font-bold text-emerald-deep">
          {icon} {title}
        </h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

export function TodayWird({ view }: { view: TodayView }) {
  const { setAyahsMemorized } = useKidsProgress();
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<"new" | "review" | "archive" | null>(null);
  const [error, setError] = useState<string | undefined>();

  function run(kind: "new" | "review" | "archive", action: () => Promise<CompleteResult>) {
    setRunning(kind);
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      // Mirror the new portion into the learner's progress (dashboard count, juz bars, review schedule).
      for (const { surah, ayahs } of result.memorized ?? []) setAyahsMemorized(surah, ayahs, true);
      setRunning(null);
    });
  }

  const spinner = (kind: typeof running) => (pending && running === kind ? <Loader2 className="animate-spin" aria-hidden /> : null);
  const memorize = view.kind === "memorize";
  const hasReview = view.recent.length > 0 || view.far.length > 0;
  const percent = memorize ? view.percent : view.pool.pages > 0 ? Math.round((view.pool.position / view.pool.pages) * 100) : 0;

  return (
    <div className="space-y-6">
      <FormAlert error={error} />

      <section className="rounded-4xl bg-emerald-deep p-6 text-white shadow-lift">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-bold">
            {memorize
              ? `${view.rangeLabel} · ${view.dailyLabel} (${view.newDays.label})`
              : `تثبيت الحفظ · ${view.reviewLabel} (${view.reviewDays.label})`}
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-bold">
            <Flame className="size-4 text-gold-soft" aria-hidden /> {toArabicDigits(view.streak)}{" "}
            {memorize ? "ورد متتالٍ" : "مراجعة متتالية"}
          </span>
        </div>
        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-white/15"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={memorize ? "نسبة إنجاز الخطة" : "موضعك في دورة المراجعة"}
        >
          <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-sm leading-7 text-white/80">
          {memorize ? (
            <>
              {toArabicDigits(view.pagesDone)} من {toArabicDigits(view.totalPages)} صفحة ({toArabicDigits(view.percent)}٪)
              {view.status === "active" && view.finishDay && ` — تختم إن شاء الله قرابة ${FINISH_FORMAT.format(new Date(view.finishDay))}`}
            </>
          ) : (
            `دورة المراجعة: صفحة ${toArabicDigits(view.pool.position + 1)} من ${toArabicDigits(view.pool.pages)}، وحين تتمّها تبدأ من جديد.`
          )}
        </p>
        {view.known.length > 0 && (
          <p className="mt-2 text-sm leading-7 text-white/80">
            {memorize ? "ويدخل في المراجعة ما حفظته سابقًا: " : "تثبّت: "}
            {view.known.slice(0, SHOWN_SURAHS).join("، ")}
            {view.known.length > SHOWN_SURAHS && ` و${toArabicDigits(view.known.length - SHOWN_SURAHS)} أخرى`}
          </p>
        )}
      </section>

      {view.status === "completed" ? (
        <section className="rounded-4xl border border-gold/60 bg-linear-to-br from-gold-mist to-white p-6 text-center shadow-soft">
          <Trophy className="mx-auto size-10 text-gold-deep" aria-hidden />
          <h2 className="mt-3 text-2xl font-bold text-emerald-deep">أتممت خطتك، بارك الله فيك!</h2>
          <p className="mt-2 text-sm text-muted">ثبّت حفظك باختبار الجزء واحصل على شهادته، ثم ابدأ خطة جديدة، أو خطة لتثبيت ما حفظت.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {view.startJuz !== null && (
              <Link href={`/exams/${view.startJuz}` as Route} className={buttonClass("gold", "md")}>
                اختبار الجزء {toArabicDigits(view.startJuz)}
              </Link>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => run("archive", archivePlanAction)}
              className={buttonClass("outline", "md")}
            >
              {spinner("archive")} خطة جديدة
            </button>
          </div>
        </section>
      ) : (
        <>
          {memorize && (
            <Card
              id="new-heading"
              icon={<BookOpenCheck className="size-6 text-gold-deep" aria-hidden />}
              title="حفظ اليوم"
              badge={view.newPortion?.done && <DoneBadge>حفظت ورد اليوم</DoneBadge>}
            >
              {!view.newPortion?.done && !view.newDays.today && <DayOff schedule={view.newDays} what="الحفظ" />}
              {!view.newPortion?.parts ? (
                <p className="mt-3 text-sm text-rose">تعذّر تحميل آيات اليوم الآن، حدّث الصفحة بعد قليل.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {view.newPortion.parts.map((part) => (
                    <li key={`${part.page}-${part.half}`} className="rounded-3xl bg-ivory p-4">
                      <p className="font-bold text-ink">{pageTitle(part)}</p>
                      {part.spans.map((span) => (
                        <p key={`${span.surah}-${span.from}`} className="mt-1 text-sm text-muted">
                          سورة {span.surahName}:{" "}
                          {span.from === span.to
                            ? `الآية ${toArabicDigits(span.from)}`
                            : `من الآية ${toArabicDigits(span.from)} إلى ${toArabicDigits(span.to)}`}
                        </p>
                      ))}
                      {part.opening && <p className="mt-2 font-quran text-lg text-emerald-deep">{part.opening}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={part.href as Route} className={buttonClass("outline", "sm")}>
                          <BookOpen aria-hidden /> افتح في المصحف
                        </Link>
                        {part.spans[0] && (
                          <Link
                            href={`/tasmee?surah=${part.spans[0].surah}&from=${part.spans[0].from}&to=${part.spans[0].to}` as Route}
                            className={buttonClass("ghost", "sm")}
                          >
                            <Mic aria-hidden /> سمّع
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {!view.newPortion?.done && (
                <button
                  type="button"
                  disabled={pending || !view.newPortion?.parts}
                  onClick={() => run("new", completeNewAction)}
                  className={buttonClass(view.newDays.today ? "primary" : "outline", "lg", "mt-5 w-full sm:w-auto")}
                >
                  {spinner("new") ?? <Check aria-hidden />} حفظت ورد اليوم
                </button>
              )}
            </Card>
          )}

          <Card
            id="review-plan-heading"
            icon={<Repeat className="size-6 text-gold-deep" aria-hidden />}
            title="مراجعة اليوم"
            badge={view.reviewDone && <DoneBadge>راجعت اليوم</DoneBadge>}
          >
            {!hasReview ? (
              <p className="mt-3 text-sm leading-7 text-muted">
                لا مراجعة بعد — تبدأ بعد أول يوم حفظ بما حفظته، ثم نضيف صفحات مما حفظته سابقًا كلما زاد.
              </p>
            ) : (
              <>
                {!view.reviewDone && !view.reviewDays.today && <DayOff schedule={view.reviewDays} what="المراجعة" />}
                {view.recent.length > 0 && (
                  <div className="mt-4">
                    <h3 className="flex items-center gap-2 font-bold text-ink">
                      <History className="size-4 text-emerald" aria-hidden /> القريب — ما حفظته في آخر أيام الحفظ
                    </h3>
                    <PageChips pages={view.recent} />
                  </div>
                )}
                {view.far.length > 0 && (
                  <div className="mt-5">
                    <h3 className="flex items-center gap-2 font-bold text-ink">
                      <Repeat className="size-4 text-emerald" aria-hidden />{" "}
                      {memorize ? "البعيد — مما حفظته سابقًا، بالتناوب" : "وِرد التثبيت اليوم"}
                    </h3>
                    <PageChips pages={view.far} />
                  </div>
                )}
                {!view.reviewDone && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run("review", completeReviewAction)}
                    className={buttonClass(view.reviewDays.today ? "gold" : "outline", "lg", "mt-5 w-full sm:w-auto")}
                  >
                    {spinner("review") ?? <Check aria-hidden />} راجعت ورد اليوم
                  </button>
                )}
              </>
            )}
          </Card>

          <div className="text-center">
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (window.confirm("إيقاف هذه الخطة والبدء بخطة جديدة؟ يبقى ما حفظته محفوظًا في تقدّمك."))
                  run("archive", archivePlanAction);
              }}
              className="inline-flex items-center gap-2 text-sm font-bold text-muted underline-offset-4 hover:text-rose hover:underline disabled:opacity-60"
            >
              {spinner("archive")} إيقاف الخطة وبدء خطة جديدة
            </button>
          </div>
        </>
      )}
    </div>
  );
}
